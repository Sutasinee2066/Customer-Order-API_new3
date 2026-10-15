import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { conn } from '../dbconnect';

export interface Customer {
  id: number; firstName: string; lastName: string; phone: string; address: string; email: string;
  latitude: number; longitude: number; createdAt: Date;
}
export interface CustomerInput {
  firstName: string; lastName: string; phone: string; address: string; email: string; latitude: number; longitude: number;
}
type CustomerRow = RowDataPacket & Customer;

const columns = 'customer_id AS id, first_name AS firstName, last_name AS lastName, phone, address, email, latitude, longitude, created_at AS createdAt';

export async function getAll(): Promise<Customer[]> {
  const [rows] = await conn.query<CustomerRow[]>(`SELECT ${columns} FROM customer ORDER BY customer_id`);
  return rows;
}
export async function getById(id: number): Promise<Customer | null> {
  const [rows] = await conn.execute<CustomerRow[]>(`SELECT ${columns} FROM customer WHERE customer_id = ?`, [id]);
  return rows[0] ?? null;
}
export async function search(firstName: string, lastName: string): Promise<Customer[]> {
  const [rows] = await conn.execute<CustomerRow[]>(
    `SELECT ${columns} FROM customer WHERE first_name LIKE ? AND last_name LIKE ? ORDER BY customer_id`,
    [firstName ? `%${firstName}%` : '%', lastName ? `%${lastName}%` : '%']
  );
  return rows;
}
export async function nearby(latitude: number, longitude: number, radiusKm: number): Promise<Array<Customer & { distanceKm: number }>> {
  const distance = `6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(latitude - ?) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ?) / 2), 2)))`;
  const [rows] = await conn.execute<(CustomerRow & { distanceKm: number })[]>(
    `SELECT ${columns}, ${distance} AS distanceKm FROM customer HAVING distanceKm <= ? ORDER BY distanceKm`,
    [latitude, latitude, longitude, radiusKm]
  );
  return rows;
}
export async function create(input: CustomerInput): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO customer (first_name, last_name, phone, address, email, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [input.firstName, input.lastName, input.phone, input.address, input.email, input.latitude, input.longitude]
  );
  return result.insertId;
}
export async function update(id: number, input: CustomerInput): Promise<boolean> {
  const [result] = await conn.execute<ResultSetHeader>(
    'UPDATE customer SET first_name=?, last_name=?, phone=?, address=?, email=?, latitude=?, longitude=? WHERE customer_id=?',
    [input.firstName, input.lastName, input.phone, input.address, input.email, input.latitude, input.longitude, id]
  );
  if (result.affectedRows > 0) return true;
  return (await getById(id)) !== null;
}
export async function remove(id: number): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>('DELETE FROM customer WHERE customer_id=?', [id]);
  return result.affectedRows;
}
