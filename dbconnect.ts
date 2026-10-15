import { createPool } from 'mysql2/promise';

export const conn = createPool({
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'customer_order_api',
  waitForConnections: true,
  queueLimit: 0,
  timezone: 'Z',
  decimalNumbers: true
});
