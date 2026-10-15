"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const customer_1 = require("./controller/customer");
const order_1 = require("./controller/order");
const dbconnect_1 = require("./dbconnect");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json({ limit: '100kb' }));
exports.app.get('/', (_req, res) => res.json({ name: 'Customer & Order API', version: '1.0.0', docs: '/api' }));
exports.app.get('/health', async (_req, res) => {
    try {
        await dbconnect_1.conn.query('SELECT 1 FROM customer LIMIT 0');
        res.json({ status: 'ok', database: 'connected' });
    }
    catch {
        res.status(503).json({ status: 'unavailable', database: 'disconnected' });
    }
});
exports.app.get('/api', (_req, res) => res.json({
    customers: ['GET /api/customers', 'POST /api/customers', 'GET /api/customers/:id', 'PUT /api/customers/:id', 'DELETE /api/customers/:id', 'GET /api/customers/search?firstName=&lastName=', 'GET /api/customers/nearby?latitude=&longitude=&radiusKm=1'],
    orders: ['GET /api/orders', 'POST /api/orders', 'GET /api/orders/:id', 'PUT /api/orders/:id', 'DELETE /api/orders/:id', 'GET /api/orders/nearby?latitude=&longitude=&radiusKm=2', 'POST /api/orders/simulate', 'DELETE /api/orders/simulated']
}));
exports.app.use('/api/customers', customer_1.router);
exports.app.use('/api/orders', order_1.router);
exports.app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
exports.app.use((err, _req, res, _next) => {
    console.error(err);
    const e = err;
    if (e.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(409).json({ error: 'Customer has orders; delete those orders first' });
    if (e.code === 'ER_NO_SUCH_TABLE')
        return res.status(503).json({ error: 'Database schema not imported; import database.sql first' });
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT')
        return res.status(503).json({ error: 'Database unavailable; check MySQL and DB_* configuration' });
    return res.status(e.status || 500).json({ error: e.status === 409 ? String(err.message) : e.status === 400 ? 'Invalid request body' : 'Internal server error' });
});
