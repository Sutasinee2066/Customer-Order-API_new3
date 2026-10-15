"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const dbconnect_1 = require("../dbconnect");
const names = [
    ['Anan', 'Sukjai'], ['Suda', 'Jaidee'], ['Kanya', 'Srisawat'], ['Niran', 'Thongdee'], ['Mali', 'Wongsa'], ['Preecha', 'Somsri'], ['Araya', 'Kittikul'], ['Somchai', 'Rattanakul'], ['Nicha', 'Boonmee'], ['Thanawat', 'Kham'], ['Pim', 'Chaiyo'], ['Krit', 'Prasert'], ['Nattaya', 'Inthong'], ['Wichai', 'Meesuk'], ['Darika', 'Suwan'], ['Phan', 'Kongka'], ['Siriporn', 'Kaew'], ['Chai', 'Yim'], ['Mayuree', 'Phrom'], ['Teerapat', 'Sang'], ['Lalita', 'Boonsong'], ['Pakorn', 'Saeng'], ['Chutima', 'Panya'], ['Ekkachai', 'Wong'], ['Benjawan', 'Chan'], ['Rung', 'Siri'], ['Kamon', 'Suk'], ['Ploy', 'Arun'], ['Somsak', 'Ngern'], ['Narumon', 'Kla']
];
async function seed() {
    const connection = await dbconnect_1.conn.getConnection();
    try {
        await connection.beginTransaction();
        const [existing] = await connection.query('SELECT COUNT(*) AS total FROM customer');
        if (Number(existing[0].total) > 0) {
            await connection.rollback();
            console.log('Seed skipped: customer table already has records.');
            return;
        }
        for (let i = 0; i < names.length; i++) {
            const [firstName, lastName] = names[i];
            const latitude = 13.7563 + (((i * 17) % 41) - 20) / 1000, longitude = 100.5018 + (((i * 13) % 41) - 20) / 1000;
            await connection.execute('INSERT INTO customer(first_name,last_name,phone,address,email,latitude,longitude) VALUES(?,?,?,?,?,?,?)', [firstName, lastName, `08${String(10000000 + i * 7919).slice(0, 8)}`, `${i + 1} ถนนสุขุมวิท เขต${['คลองเตย', 'วัฒนา', 'พระโขนง', 'บางนา', 'สาทร'][i % 5]} กรุงเทพฯ`, `customer${i + 1}@example.test`, latitude, longitude]);
        }
        const statuses = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
        for (let i = 0; i < 25; i++)
            await connection.execute('INSERT INTO `order`(customer_id,box_quantity,order_date,status,simulated) VALUES(?,?,?,?,TRUE)', [(i % names.length) + 1, (i % 8) + 1, new Date(Date.UTC(2026, 1, 1 + i)), statuses[i % statuses.length]]);
        await connection.commit();
        console.log('Seed complete: 30 customers and 25 simulated orders.');
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
        await dbconnect_1.conn.end();
    }
}
seed().catch(async (error) => { console.error(error); await dbconnect_1.conn.end(); process.exitCode = 1; });
