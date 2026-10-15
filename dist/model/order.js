"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = getAll;
exports.getById = getById;
exports.nearby = nearby;
exports.create = create;
exports.updateBoxes = updateBoxes;
exports.remove = remove;
exports.simulate = simulate;
exports.clearSimulated = clearSimulated;
const dbconnect_1 = require("../dbconnect");
const select = `o.order_id AS id, o.customer_id AS customerId, o.box_quantity AS boxes, o.order_date AS orderDate, o.status, o.simulated,
  c.first_name AS customerFirstName, c.last_name AS customerLastName, c.phone AS customerPhone,
  c.address AS customerAddress, c.email AS customerEmail, c.latitude AS customerLatitude, c.longitude AS customerLongitude`;
function hydrate(row) {
    return {
        id: row.id, customerId: row.customerId, boxes: row.boxes, orderDate: row.orderDate, status: row.status, simulated: Boolean(row.simulated),
        customer: { id: row.customerId, firstName: row.customerFirstName, lastName: row.customerLastName, phone: row.customerPhone,
            address: row.customerAddress, email: row.customerEmail, latitude: row.customerLatitude, longitude: row.customerLongitude },
        ...(row.distanceKm === undefined ? {} : { distanceKm: Number(row.distanceKm) })
    };
}
async function getAll() {
    const [rows] = await dbconnect_1.conn.query('SELECT ' + select + ' FROM `order` o JOIN customer c ON c.customer_id=o.customer_id ORDER BY o.order_id');
    return rows.map(hydrate);
}
async function getById(id) {
    const [rows] = await dbconnect_1.conn.execute('SELECT ' + select + ' FROM `order` o JOIN customer c ON c.customer_id=o.customer_id WHERE o.order_id=?', [id]);
    return rows[0] ? hydrate(rows[0]) : null;
}
async function nearby(latitude, longitude, radiusKm) {
    const distance = `6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(c.latitude - ?) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(c.latitude)) * POWER(SIN(RADIANS(c.longitude - ?) / 2), 2)))`;
    const [rows] = await dbconnect_1.conn.execute('SELECT ' + select + ', ' + distance + ' AS distanceKm FROM `order` o JOIN customer c ON c.customer_id=o.customer_id HAVING distanceKm<=? ORDER BY distanceKm', [latitude, latitude, longitude, radiusKm]);
    return rows.map(hydrate);
}
async function create(customerId, boxes) {
    const [result] = await dbconnect_1.conn.execute('INSERT INTO `order` (customer_id, box_quantity, status, simulated) VALUES (?, ?, ?, FALSE)', [customerId, boxes, 'pending']);
    return result.insertId;
}
async function updateBoxes(id, boxes) {
    const [result] = await dbconnect_1.conn.execute('UPDATE `order` SET box_quantity=? WHERE order_id=?', [boxes, id]);
    if (result.affectedRows > 0)
        return true;
    return (await getById(id)) !== null;
}
async function remove(id) {
    const [result] = await dbconnect_1.conn.execute('DELETE FROM `order` WHERE order_id=?', [id]);
    return result.affectedRows;
}
async function simulate() {
    const connection = await dbconnect_1.conn.getConnection();
    try {
        await connection.beginTransaction();
        const [customers] = await connection.query('SELECT customer_id FROM customer ORDER BY customer_id');
        if (customers.length === 0)
            throw Object.assign(new Error('Create at least one customer before simulating orders'), { status: 409 });
        await connection.query('DELETE FROM `order` WHERE simulated=TRUE');
        for (let i = 0; i < 25; i++) {
            const customerId = Number(customers[i % customers.length].customer_id);
            const statuses = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
            await connection.execute('INSERT INTO `order` (customer_id, box_quantity, status, simulated) VALUES (?, ?, ?, TRUE)', [customerId, (i % 10) + 1, statuses[i % statuses.length]]);
        }
        await connection.commit();
        return 25;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
async function clearSimulated() {
    const [result] = await dbconnect_1.conn.execute('DELETE FROM `order` WHERE simulated=TRUE');
    return result.affectedRows;
}
