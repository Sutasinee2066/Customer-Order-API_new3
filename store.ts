import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

type Customer = { id: number; firstName: string; lastName: string; phone: string; email: string; latitude: number; longitude: number; createdAt: string };
type Order = { id: number; customerId: number; boxes: number; createdAt: string; simulated: boolean };
type State = { customers: Customer[]; orders: Order[]; nextCustomerId: number; nextOrderId: number };

const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const file = path.join(dataDir, 'database.json');
const bangkok = { lat: 13.7563, lon: 100.5018 };
const names: Array<[string, string]> = [
  ['Anan','Sukjai'],['Suda','Jaidee'],['Kanya','Srisawat'],['Niran','Thongdee'],['Mali','Wongsa'],['Preecha','Somsri'],['Araya','Kittikul'],['Somchai','Rattanakul'],['Nicha','Boonmee'],['Thanawat','Kham'],['Pim','Chaiyo'],['Krit','Prasert'],['Nattaya','Inthong'],['Wichai','Meesuk'],['Darika','Suwan'],['Phan','Kongka'],['Siriporn','Kaew'],['Chai','Yim'],['Mayuree','Phrom'],['Teerapat','Sang'],['Lalita','Boonsong'],['Pakorn','Saeng'],['Chutima','Panya'],['Ekkachai','Wong'],['Benjawan','Chan'],['Rung','Siri'],['Kamon','Suk'],['Ploy','Arun'],['Somsak','Ngern'],['Narumon','Kla']
];
function seed(): State {
  const customers = names.map(([firstName, lastName], i) => ({
    id: i + 1, firstName, lastName, phone: `08${String(10000000 + i * 7919).slice(0, 8)}`,
    email: `customer${i + 1}@example.test`, latitude: bangkok.lat + (((i * 17) % 41) - 20) / 1000,
    longitude: bangkok.lon + (((i * 13) % 41) - 20) / 1000, createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString()
  }));
  const orders = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, customerId: (i % 30) + 1, boxes: (i % 8) + 1, createdAt: new Date(Date.UTC(2026, 1, 1 + i)).toISOString(), simulated: true }));
  return { customers, orders, nextCustomerId: 31, nextOrderId: 26 };
}
function load(): State {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as State; }
  catch { const initial = seed(); save(initial); return initial; }
}
function save(state: State): void { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(state, null, 2)); }
let db = load();
const num = (x: unknown): number => typeof x === 'string' || typeof x === 'number' ? Number(x) : NaN;
const finite = (x: unknown): boolean => Number.isFinite(num(x));
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function validLocation(req: Request, res: Response): { lat: number; lon: number; radius: number } | null {
  const lat = num(req.query.latitude), lon = num(req.query.longitude), radius = req.query.radiusKm === undefined ? NaN : num(req.query.radiusKm);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180 || (req.query.radiusKm !== undefined && (!Number.isFinite(radius) || radius <= 0))) {
    res.status(400).json({ error: 'Provide valid latitude (-90..90), longitude (-180..180), and positive radiusKm' }); return null;
  }
  return { lat, lon, radius: Number.isFinite(radius) ? radius : 1 };
}
function customerInput(body: any): Omit<Customer, 'id' | 'createdAt'> | null {
  if (!body || !['firstName','lastName','phone','email','latitude','longitude'].every(k => body[k] !== undefined)) return null;
  if (![body.firstName, body.lastName, body.phone, body.email].every(x => typeof x === 'string' && x.trim()) || !finite(body.latitude) || !finite(body.longitude) || num(body.latitude) < -90 || num(body.latitude) > 90 || num(body.longitude) < -180 || num(body.longitude) > 180) return null;
  return { firstName: body.firstName.trim(), lastName: body.lastName.trim(), phone: body.phone.trim(), email: body.email.trim(), latitude: num(body.latitude), longitude: num(body.longitude) };
}
function hydrated(order: Order) { const customer = db.customers.find(c => c.id === order.customerId); return { ...order, customer: customer ?? null }; }

export const api = {
  listCustomers: () => db.customers,
  searchCustomers(req: Request, res: Response) {
    const first = String(req.query.firstName ?? '').toLocaleLowerCase(); const last = String(req.query.lastName ?? '').toLocaleLowerCase();
    if (!first && !last) return res.status(400).json({ error: 'Provide firstName and/or lastName' });
    return res.json(db.customers.filter(c => c.firstName.toLocaleLowerCase().includes(first) && c.lastName.toLocaleLowerCase().includes(last)));
  },
  nearbyCustomers(req: Request, res: Response) {
    const p = validLocation(req, res); if (!p) return;
    const radius = req.query.radiusKm === undefined ? 1 : p.radius;
    return res.json(db.customers.map(c => ({ ...c, distanceKm: distanceKm(p.lat, p.lon, c.latitude, c.longitude) })).filter(c => c.distanceKm <= radius).sort((a,b) => a.distanceKm-b.distanceKm));
  },
  createCustomer(req: Request, res: Response) {
    const input = customerInput(req.body); if (!input) return res.status(400).json({ error: 'Required: firstName, lastName, phone, email, latitude, longitude (valid coordinates)' });
    const customer: Customer = { ...input, id: db.nextCustomerId++, createdAt: new Date().toISOString() }; db.customers.push(customer); save(db); return res.status(201).json(customer);
  },
  getCustomer(req: Request, res: Response) { const c = db.customers.find(x => x.id === num(req.params.id)); return c ? res.json(c) : res.status(404).json({ error: 'Customer not found' }); },
  updateCustomer(req: Request, res: Response) {
    const idx = db.customers.findIndex(x => x.id === num(req.params.id)); if (idx < 0) return res.status(404).json({ error: 'Customer not found' });
    const input = customerInput(req.body); if (!input) return res.status(400).json({ error: 'Provide all customer fields with valid values' });
    db.customers[idx] = { ...db.customers[idx], ...input }; save(db); return res.json(db.customers[idx]);
  },
  deleteCustomer(req: Request, res: Response) {
    const id = num(req.params.id), idx = db.customers.findIndex(x => x.id === id); if (idx < 0) return res.status(404).json({ error: 'Customer not found' });
    if (db.orders.some(o => o.customerId === id)) return res.status(409).json({ error: 'Customer has orders; delete those orders first' });
    const [deleted] = db.customers.splice(idx, 1); save(db); return res.json({ deleted });
  },
  listOrders: () => db.orders.map(hydrated),
  nearbyOrders(req: Request, res: Response) {
    const p = validLocation(req, res); if (!p) return;
    const radius = req.query.radiusKm === undefined ? 2 : p.radius;
    return res.json(db.orders.map(hydrated).map(o => ({ ...o, distanceKm: o.customer ? distanceKm(p.lat, p.lon, o.customer.latitude, o.customer.longitude) : Infinity })).filter(o => o.distanceKm <= radius).sort((a,b) => a.distanceKm-b.distanceKm));
  },
  createOrder(req: Request, res: Response) {
    const customerId = num(req.body?.customerId), boxes = num(req.body?.boxes);
    if (!Number.isInteger(customerId) || !Number.isInteger(boxes) || boxes < 1) return res.status(400).json({ error: 'customerId and positive integer boxes are required' });
    if (!db.customers.some(c => c.id === customerId)) return res.status(404).json({ error: 'Customer not found' });
    const order: Order = { id: db.nextOrderId++, customerId, boxes, createdAt: new Date().toISOString(), simulated: false }; db.orders.push(order); save(db); return res.status(201).json(hydrated(order));
  },
  getOrder(req: Request, res: Response) { const o = db.orders.find(x => x.id === num(req.params.id)); return o ? res.json(hydrated(o)) : res.status(404).json({ error: 'Order not found' }); },
  updateOrder(req: Request, res: Response) {
    const o = db.orders.find(x => x.id === num(req.params.id)); if (!o) return res.status(404).json({ error: 'Order not found' });
    const boxes = num(req.body?.boxes); if (!Number.isInteger(boxes) || boxes < 1) return res.status(400).json({ error: 'boxes must be a positive integer' });
    o.boxes = boxes; save(db); return res.json(hydrated(o));
  },
  deleteOrder(req: Request, res: Response) { const idx = db.orders.findIndex(x => x.id === num(req.params.id)); if (idx < 0) return res.status(404).json({ error: 'Order not found' }); const [o] = db.orders.splice(idx,1); save(db); return res.json({ deleted: hydrated(o) }); },
  simulateOrders(res: Response) {
    if (db.customers.length === 0) return res.status(409).json({ error: 'Create at least one customer before simulating orders' });
    db.orders = db.orders.filter(o => !o.simulated);
    for (let i=0;i<25;i++) db.orders.push({ id: db.nextOrderId++, customerId: db.customers[i % db.customers.length].id, boxes: (i % 10) + 1, createdAt: new Date().toISOString(), simulated: true });
    save(db); return res.status(201).json({ message: 'Created 25 simulated orders', count: 25, orders: db.orders.filter(o => o.simulated).map(hydrated) });
  },
  clearSimulatedOrders(res: Response) { const before = db.orders.length; db.orders = db.orders.filter(o => !o.simulated); save(db); return res.json({ deletedCount: before - db.orders.length }); }
};
