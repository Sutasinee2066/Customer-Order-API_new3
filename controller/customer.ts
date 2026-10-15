import express from 'express';
import * as CustomerModel from '../model/customer';
import type { CustomerInput } from '../model/customer';

export const router = express.Router();
function idParam(value: string): number | null { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function input(body: any): CustomerInput | null {
  const fields = ['firstName','lastName','phone','address','email'];
  if (!body || fields.some(k => typeof body[k] !== 'string' || !body[k].trim())) return null;
  if (body.latitude === undefined || body.longitude === undefined || String(body.latitude).trim() === '' || String(body.longitude).trim() === '') return null;
  const lat = Number(body.latitude), lon = Number(body.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) return null;
  return { firstName: body.firstName.trim(), lastName: body.lastName.trim(), phone: body.phone.trim(), address: body.address.trim(), email: body.email.trim(), latitude: lat, longitude: lon };
}
function location(req: express.Request): { latitude:number; longitude:number; radiusKm:number } | null {
  const latitude=Number(req.query.latitude), longitude=Number(req.query.longitude);
  const radiusKm=req.query.radiusKm===undefined ? 1 : Number(req.query.radiusKm);
  if (!Number.isFinite(latitude)||latitude < -90||latitude>90||!Number.isFinite(longitude)||longitude < -180||longitude>180||!Number.isFinite(radiusKm)||radiusKm<=0) return null;
  return {latitude,longitude,radiusKm};
}
router.get('/search', async (req,res,next) => {
  try {
    const firstName=String(req.query.firstName ?? '').trim(), lastName=String(req.query.lastName ?? '').trim();
    if (!firstName && !lastName) return res.status(400).json({error:'Provide firstName and/or lastName'});
    res.json(await CustomerModel.search(firstName,lastName));
  } catch(e) { next(e); }
});
router.get('/nearby', async (req,res,next) => {
  const p=location(req); if(!p) return res.status(400).json({error:'Provide valid latitude, longitude, and positive radiusKm'});
  try { res.json(await CustomerModel.nearby(p.latitude,p.longitude,p.radiusKm)); } catch(e) { next(e); }
});
router.get('/', async (_req,res,next) => { try { res.json(await CustomerModel.getAll()); } catch(e) { next(e); } });
router.post('/', async (req,res,next) => {
  const data=input(req.body); if(!data) return res.status(400).json({error:'Required: firstName, lastName, phone, address, email, latitude, longitude'});
  try { const id=await CustomerModel.create(data); res.status(201).json(await CustomerModel.getById(id)); } catch(e) { next(e); }
});
router.get('/:id', async (req,res,next) => {
  const id=idParam(req.params.id); if(!id) return res.status(400).json({error:'id must be a positive integer'});
  try { const customer=await CustomerModel.getById(id); customer ? res.json(customer) : res.status(404).json({error:'Customer not found'}); } catch(e) { next(e); }
});
router.put('/:id', async (req,res,next) => {
  const id=idParam(req.params.id), data=input(req.body); if(!id) return res.status(400).json({error:'id must be a positive integer'}); if(!data) return res.status(400).json({error:'Provide all customer fields with valid values'});
  try { const found=await CustomerModel.update(id,data); found ? res.json(await CustomerModel.getById(id)) : res.status(404).json({error:'Customer not found'}); } catch(e) { next(e); }
});
router.delete('/:id', async (req,res,next) => {
  const id=idParam(req.params.id); if(!id) return res.status(400).json({error:'id must be a positive integer'});
  try {
    const deleted=await CustomerModel.remove(id);
    if(deleted) return res.json({deletedId:id});
    return res.status(404).json({error:'Customer not found'});
  } catch(e) { next(e); }
});
