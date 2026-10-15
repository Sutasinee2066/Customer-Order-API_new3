import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as customerRouter } from './controller/customer';
import { router as orderRouter } from './controller/order';
import { conn } from './dbconnect';

export const app=express();
app.use(cors());
app.use(express.json({limit:'100kb'}));
app.get('/',(_req,res)=>res.json({name:'Customer & Order API',version:'1.0.0',docs:'/api'}));
app.get('/health',async(_req,res)=>{
  try{await conn.query('SELECT 1 FROM customer LIMIT 0');res.json({status:'ok',database:'connected'});}
  catch{res.status(503).json({status:'unavailable',database:'disconnected'});}
});
app.get('/api',(_req,res)=>res.json({
  customers:['GET /api/customers','POST /api/customers','GET /api/customers/:id','PUT /api/customers/:id','DELETE /api/customers/:id','GET /api/customers/search?firstName=&lastName=','GET /api/customers/nearby?latitude=&longitude=&radiusKm=1'],
  orders:['GET /api/orders','POST /api/orders','GET /api/orders/:id','PUT /api/orders/:id','DELETE /api/orders/:id','GET /api/orders/nearby?latitude=&longitude=&radiusKm=2','POST /api/orders/simulate','DELETE /api/orders/simulated']
}));
app.use('/api/customers',customerRouter);
app.use('/api/orders',orderRouter);
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  console.error(err);
  const e=err as {code?:string;status?:number};
  if(e.code==='ER_ROW_IS_REFERENCED_2')return res.status(409).json({error:'Customer has orders; delete those orders first'});
  if(e.code==='ER_NO_SUCH_TABLE')return res.status(503).json({error:'Database schema not imported; import database.sql first'});
  if(e.code==='ECONNREFUSED'||e.code==='ENOTFOUND'||e.code==='ETIMEDOUT')return res.status(503).json({error:'Database unavailable; check MySQL and DB_* configuration'});
  return res.status(e.status||500).json({error:e.status===409?String((err as Error).message):e.status===400?'Invalid request body':'Internal server error'});
});
