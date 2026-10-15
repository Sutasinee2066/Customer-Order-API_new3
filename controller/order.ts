import express from 'express';
import * as OrderModel from '../model/order';
import * as CustomerModel from '../model/customer';

export const router=express.Router();
function idParam(value:string):number|null { const id=Number(value); return Number.isInteger(id)&&id>0?id:null; }
function location(req:express.Request):{latitude:number;longitude:number;radiusKm:number}|null {
  const latitude=Number(req.query.latitude),longitude=Number(req.query.longitude),radiusKm=req.query.radiusKm===undefined?2:Number(req.query.radiusKm);
  if(!Number.isFinite(latitude)||latitude < -90||latitude>90||!Number.isFinite(longitude)||longitude < -180||longitude>180||!Number.isFinite(radiusKm)||radiusKm<=0)return null;
  return {latitude,longitude,radiusKm};
}
router.get('/nearby',async(req,res,next)=>{
  const p=location(req);if(!p)return res.status(400).json({error:'Provide valid latitude, longitude, and positive radiusKm'});
  try{res.json(await OrderModel.nearby(p.latitude,p.longitude,p.radiusKm));}catch(e){next(e);}
});
router.post('/simulate',async(_req,res,next)=>{try{const count=await OrderModel.simulate();res.status(201).json({message:`Created ${count} simulated orders`,count});}catch(e){next(e);}});
router.delete('/simulated',async(_req,res,next)=>{try{res.json({deletedCount:await OrderModel.clearSimulated()});}catch(e){next(e);}});
router.get('/',async(_req,res,next)=>{try{res.json(await OrderModel.getAll());}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{
  const customerId=Number(req.body?.customerId),boxes=Number(req.body?.boxes);
  if(!Number.isInteger(customerId)||customerId<=0||!Number.isInteger(boxes)||boxes<=0)return res.status(400).json({error:'customerId and positive integer boxes are required'});
  try{if(!await CustomerModel.getById(customerId))return res.status(404).json({error:'Customer not found'});const id=await OrderModel.create(customerId,boxes);res.status(201).json(await OrderModel.getById(id));}catch(e){next(e);}
});
router.get('/:id',async(req,res,next)=>{
  const id=idParam(req.params.id);if(!id)return res.status(400).json({error:'id must be a positive integer'});
  try{const order=await OrderModel.getById(id);order?res.json(order):res.status(404).json({error:'Order not found'});}catch(e){next(e);}
});
router.put('/:id',async(req,res,next)=>{
  const id=idParam(req.params.id),boxes=Number(req.body?.boxes);if(!id)return res.status(400).json({error:'id must be a positive integer'});if(!Number.isInteger(boxes)||boxes<=0)return res.status(400).json({error:'boxes must be a positive integer'});
  try{const found=await OrderModel.updateBoxes(id,boxes);found?res.json(await OrderModel.getById(id)):res.status(404).json({error:'Order not found'});}catch(e){next(e);}
});
router.delete('/:id',async(req,res,next)=>{
  const id=idParam(req.params.id);if(!id)return res.status(400).json({error:'id must be a positive integer'});
  try{const deleted=await OrderModel.remove(id);deleted?res.json({deletedId:id}):res.status(404).json({error:'Order not found'});}catch(e){next(e);}
});
