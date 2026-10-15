"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const OrderModel = __importStar(require("../model/order"));
const CustomerModel = __importStar(require("../model/customer"));
exports.router = express_1.default.Router();
function idParam(value) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function location(req) {
    const latitude = Number(req.query.latitude), longitude = Number(req.query.longitude), radiusKm = req.query.radiusKm === undefined ? 2 : Number(req.query.radiusKm);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(radiusKm) || radiusKm <= 0)
        return null;
    return { latitude, longitude, radiusKm };
}
exports.router.get('/nearby', async (req, res, next) => {
    const p = location(req);
    if (!p)
        return res.status(400).json({ error: 'Provide valid latitude, longitude, and positive radiusKm' });
    try {
        res.json(await OrderModel.nearby(p.latitude, p.longitude, p.radiusKm));
    }
    catch (e) {
        next(e);
    }
});
exports.router.post('/simulate', async (_req, res, next) => { try {
    const count = await OrderModel.simulate();
    res.status(201).json({ message: `Created ${count} simulated orders`, count });
}
catch (e) {
    next(e);
} });
exports.router.delete('/simulated', async (_req, res, next) => { try {
    res.json({ deletedCount: await OrderModel.clearSimulated() });
}
catch (e) {
    next(e);
} });
exports.router.get('/', async (_req, res, next) => { try {
    res.json(await OrderModel.getAll());
}
catch (e) {
    next(e);
} });
exports.router.post('/', async (req, res, next) => {
    const customerId = Number(req.body?.customerId), boxes = Number(req.body?.boxes);
    if (!Number.isInteger(customerId) || customerId <= 0 || !Number.isInteger(boxes) || boxes <= 0)
        return res.status(400).json({ error: 'customerId and positive integer boxes are required' });
    try {
        if (!await CustomerModel.getById(customerId))
            return res.status(404).json({ error: 'Customer not found' });
        const id = await OrderModel.create(customerId, boxes);
        res.status(201).json(await OrderModel.getById(id));
    }
    catch (e) {
        next(e);
    }
});
exports.router.get('/:id', async (req, res, next) => {
    const id = idParam(req.params.id);
    if (!id)
        return res.status(400).json({ error: 'id must be a positive integer' });
    try {
        const order = await OrderModel.getById(id);
        order ? res.json(order) : res.status(404).json({ error: 'Order not found' });
    }
    catch (e) {
        next(e);
    }
});
exports.router.put('/:id', async (req, res, next) => {
    const id = idParam(req.params.id), boxes = Number(req.body?.boxes);
    if (!id)
        return res.status(400).json({ error: 'id must be a positive integer' });
    if (!Number.isInteger(boxes) || boxes <= 0)
        return res.status(400).json({ error: 'boxes must be a positive integer' });
    try {
        const found = await OrderModel.updateBoxes(id, boxes);
        found ? res.json(await OrderModel.getById(id)) : res.status(404).json({ error: 'Order not found' });
    }
    catch (e) {
        next(e);
    }
});
exports.router.delete('/:id', async (req, res, next) => {
    const id = idParam(req.params.id);
    if (!id)
        return res.status(400).json({ error: 'id must be a positive integer' });
    try {
        const deleted = await OrderModel.remove(id);
        deleted ? res.json({ deletedId: id }) : res.status(404).json({ error: 'Order not found' });
    }
    catch (e) {
        next(e);
    }
});
