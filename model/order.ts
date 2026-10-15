import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { conn } from '../dbconnect';

export interface Order {
  id: number; customerId: number; boxes: number; orderDate: Date; status: string; simulated: boolean;
}
export interface OrderWithCustomer extends Order {
  customer: { id: number; firstName: string; lastName: string; phone: string; address: string; email: string; latitude: number; longitude: number };
}
type OrderRow = RowDataPacket & Order & {
  customerFirstName: string; customerLastName: string; customerPhone: string; customerEmail: string;
  customerAddress: string; customerLatitude: number; customerLongitude: number; distanceKm?: number;
};
const select = `o.order_id AS id, o.customer_id AS customerId, o.box_quantity AS boxes, o.order_date AS orderDate, o.status, o.simulated,
  c.first_name AS customerFirstName, c.last_name AS customerLastName, c.phone AS customerPhone,
  c.address AS customerAddress, c.email AS customerEmail, c.latitude AS customerLatitude, c.longitude AS customerLongitude`;
function hydrate(row: OrderRow): OrderWithCustomer & { distanceKm?: number } {
  return {
    id: row.id, customerId: row.customerId, boxes: row.boxes, orderDate: row.orderDate, status: row.status, simulated: Boolean(row.simulated),
    customer: { id: row.customerId, firstName: row.customerFirstName, lastName: row.customerLastName, phone: row.customerPhone,
      address: row.customerAddress, email: row.customerEmail, latitude: row.customerLatitude, longitude: row.customerLongitude },
    ...(row.distanceKm === undefined ? {} : { distanceKm: Number(row.distanceKm) })
  };
}
export async function getAll(): Promise<OrderWithCustomer[]> {
  const [rows] = await conn.query<OrderRow[]>('SELECT ' + select + ' FROM `order` o JOIN customer c ON c.customer_id=o.customer_id ORDER BY o.order_id');
  return rows.map(hydrate);
}
export async function getById(id: number): Promise<OrderWithCustomer | null> {
  const [rows] = await conn.execute<OrderRow[]>('SELECT ' + select + ' FROM `order` o JOIN customer c ON c.customer_id=o.customer_id WHERE o.order_id=?', [id]);
  return rows[0] ? hydrate(rows[0]) : null;
}
export async function nearby(latitude: number, longitude: number, radiusKm: number): Promise<Array<OrderWithCustomer & { distanceKm: number }>> {
  const distance = `6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(c.latitude - ?) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(c.latitude)) * POWER(SIN(RADIANS(c.longitude - ?) / 2), 2)))`;
  const [rows] = await conn.execute<OrderRow[]>(
    'SELECT ' + select + ', ' + distance + ' AS distanceKm FROM `order` o JOIN customer c ON c.customer_id=o.customer_id HAVING distanceKm<=? ORDER BY distanceKm',
    [latitude, latitude, longitude, radiusKm]
  );
  return rows.map(hydrate) as Array<OrderWithCustomer & { distanceKm: number }>;
}
export async function create(customerId: number, boxes: number): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>('INSERT INTO `order` (customer_id, box_quantity, status, simulated) VALUES (?, ?, ?, FALSE)', [customerId, boxes, 'pending']);
  return result.insertId;
}
export async function updateBoxes(id: number, boxes: number): Promise<boolean> {
  const [result] = await conn.execute<ResultSetHeader>('UPDATE `order` SET box_quantity=? WHERE order_id=?', [boxes, id]);
  if (result.affectedRows > 0) return true;
  return (await getById(id)) !== null;
}
export async function remove(id: number): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>('DELETE FROM `order` WHERE order_id=?', [id]);
  return result.affectedRows;
}
export async function simulate(): Promise<number> {
  const connection = await conn.getConnection();
  try {
    await connection.beginTransaction();
    const [customers] = await connection.query<RowDataPacket[]>('SELECT customer_id FROM customer ORDER BY customer_id');
    if (customers.length === 0) throw Object.assign(new Error('Create at least one customer before simulating orders'), { status: 409 });
    await connection.query('DELETE FROM `order` WHERE simulated=TRUE');
    for (let i = 0; i < 25; i++) {
      const customerId = Number(customers[i % customers.length].customer_id);
      const statuses=['pending','confirmed','preparing','delivered','cancelled'];
      await connection.execute('INSERT INTO `order` (customer_id, box_quantity, status, simulated) VALUES (?, ?, ?, TRUE)', [customerId, (i % 10) + 1, statuses[i % statuses.length]]);
    }
    await connection.commit();
    return 25;
  } catch (error) {
    await connection.rollback(); throw error;
  } finally { connection.release(); }
}
export async function clearSimulated(): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>('DELETE FROM `order` WHERE simulated=TRUE');
  return result.affectedRows;
}
