# Deployment checklist (MySQL + Render)

The Web Service and MySQL database are separate services. Provision an internet-accessible MySQL 8/MariaDB database with a database name, host, port, username, password, and TLS requirements. Import `database.sql`, then run `npm run seed` once with the same DB settings. Never commit real credentials.

1. Push this project to a GitHub repository; omit `node_modules`, `.env`, and credentials.
2. Create a Render Web Service from the repository.
3. Build Command: `npm install && npm run build`.
4. Start Command: `npm start`.
5. Add Render Environment Variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and optionally `DB_CONNECTION_LIMIT`. Set `PORT` through the platform.
6. If the MySQL host requires TLS, configure its provider's CA/SSL settings in `dbconnect.ts` before deployment.
7. Deploy; verify `https://<service>.onrender.com/health` returns `{"status":"ok","database":"connected"}` and test `/api/customers`.
8. Put the public API URL in the submission PDF.

The group has not provided MySQL or Render accounts/credentials, so this project is configured for deployment but is not publicly deployed. The API binds to `0.0.0.0` and uses the platform's `PORT`.
