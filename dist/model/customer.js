"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = getAll;
exports.getById = getById;
exports.search = search;
exports.nearby = nearby;
exports.create = create;
exports.update = update;
exports.remove = remove;
const dbconnect_1 = require("../dbconnect");
const columns = 'customer_id AS id, first_name AS firstName, last_name AS lastName, phone, address, email, latitude, longitude, created_at AS createdAt';
async function getAll() {
    const [rows] = await dbconnect_1.conn.query(`SELECT ${columns} FROM customer ORDER BY customer_id`);
    return rows;
}
async function getById(id) {
    const [rows] = await dbconnect_1.conn.execute(`SELECT ${columns} FROM customer WHERE customer_id = ?`, [id]);
    return rows[0] ?? null;
}
async function search(firstName, lastName) {
    const [rows] = await dbconnect_1.conn.execute(`SELECT ${columns} FROM customer WHERE first_name LIKE ? AND last_name LIKE ? ORDER BY customer_id`, [firstName ? `%${firstName}%` : '%', lastName ? `%${lastName}%` : '%']);
    return rows;
}
async function nearby(latitude, longitude, radiusKm) {
    const distance = `6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(latitude - ?) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ?) / 2), 2)))`;
    const [rows] = await dbconnect_1.conn.execute(`SELECT ${columns}, ${distance} AS distanceKm FROM customer HAVING distanceKm <= ? ORDER BY distanceKm`, [latitude, latitude, longitude, radiusKm]);
    return rows;
}
async function create(input) {
    const [result] = await dbconnect_1.conn.execute('INSERT INTO customer (first_name, last_name, phone, address, email, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)', [input.firstName, input.lastName, input.phone, input.address, input.email, input.latitude, input.longitude]);
    return result.insertId;
}
async function update(id, input) {
    const [result] = await dbconnect_1.conn.execute('UPDATE customer SET first_name=?, last_name=?, phone=?, address=?, email=?, latitude=?, longitude=? WHERE customer_id=?', [input.firstName, input.lastName, input.phone, input.address, input.email, input.latitude, input.longitude, id]);
    if (result.affectedRows > 0)
        return true;
    return (await getById(id)) !== null;
}
async function remove(id) {
    const [result] = await dbconnect_1.conn.execute('DELETE FROM customer WHERE customer_id=?', [id]);
    return result.affectedRows;
}
