# Customer & Order Web API

TypeScript + Express + MySQL course project. The structure follows the supplied lessons: `server.ts` starts the server, `app.ts` wires routers, `src/controller/` handles routes and validation, `src/model/` contains typed data models and parameterized MySQL queries, and `dbconnect.ts` creates the MySQL connection pool.

## Requirements

- Node.js 20 or newer
- MySQL 8.0 or compatible MariaDB

## Setup on Windows PowerShell

Open PowerShell in this project folder (the folder containing `package.json`), then run:

```powershell
npm install
Copy-Item .env.example .env
```

Create the database and tables by importing `database.sql` in MySQL Workbench or phpMyAdmin. Then edit `.env` with your MySQL connection settings. For a local default MySQL installation, `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, and `DB_PASSWORD=` may work if your root account has no password.

Add example records once:

```powershell
npm run seed
```

This adds 30 customers and 25 simulated orders only when the customer table is empty. Then start the API:

```powershell
npm run dev
```

Open `http://localhost:3000/api`. The `/health` endpoint reports whether the MySQL connection is available. The API returns HTTP 503 for data routes if MySQL is not configured or running.

## API routes

All bodies and responses are JSON. Coordinates use decimal degrees; distances are calculated with the Haversine formula in kilometers. Customer proximity defaults to 1 km; order proximity defaults to 2 km and uses the associated customer's coordinates. `radiusKm` can override either default.

| Method | Route | Description |
|---|---|---|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/:id` | Get one customer |
| POST | `/api/customers` | Add a customer |
| PUT | `/api/customers/:id` | Replace all customer fields |
| DELETE | `/api/customers/:id` | Delete a customer; 409 if orders remain |
| GET | `/api/customers/search?firstName=an&lastName=suk` | Case-insensitive partial name search; either filter is optional, but at least one is required |
| GET | `/api/customers/nearby?latitude=13.7563&longitude=100.5018` | Customers within 1 km |
| GET | `/api/orders` | List orders with the customer who placed each one |
| GET | `/api/orders/:id` | Get one order and its customer |
| POST | `/api/orders` | Add a non-simulated order |
| PUT | `/api/orders/:id` | Change the order's box quantity |
| DELETE | `/api/orders/:id` | Delete one order |
| POST | `/api/orders/simulate` | Replace existing simulated rows with 25 simulated orders (transactional) |
| DELETE | `/api/orders/simulated` | Delete all simulated rows; manually created orders remain |
| GET | `/api/orders/nearby?latitude=13.7563&longitude=100.5018` | Orders within 2 km of each ordering customer's location |

Example customer body:

```json
{"firstName":"Nicha","lastName":"Sukjai","phone":"0812345678","address":"12 Sukhumvit Road, Bangkok","email":"nicha@example.com","latitude":13.7563,"longitude":100.5018}
```

Example order body: `{"customerId":1,"boxes":3}`. Order updates accept `{"boxes":5}`. Status codes include 201 for create, 400 for invalid input, 404 for missing records, 409 for relationship conflicts, and 503 when the database is unavailable.

## ER diagram and delivery

The customer table includes address and coordinates. Orders include order date, box quantity, status, and a `simulated` flag used by the reset endpoint. See `docs/erd.md` for the Chen notation specification to draw in ERDPlus (entity rectangles, relationship diamond, attribute ovals, underlined keys). `database.sql` is the matching relational schema. `docs/deployment.md` describes deployment configuration.

The group does not yet have a MySQL host or Render account. The API has not been deployed publicly; a MySQL service and web host must be provisioned and their environment variables entered before internet testing is possible. Fill member names and IDs in the submission PDF before uploading.
