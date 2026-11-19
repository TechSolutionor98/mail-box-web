# TechSolutionor Mail & Hosting Control Panel

A production-ready, multi-tenant Webmail and Hosting Management System built with Next.js 14, Tailwind CSS, and Node.js / Express.

## 🚀 Subdomain Routing Architecture

- **`tpanel.techsolutionor.com`**: Client / Domain Owner Panel (DNS Zone Editor, Domain Provisioning, Mailbox Creation, Package Management).
- **`mail.techsolutionor.com`**: Dedicated Webmail Client (Direct IMAP/SMTP/Webmail login for individual mailboxes).
- **`superadminpane.techsolutionor.com`**: Super Admin Management Console (Global telemetry, User directory, Tenant controls).
- **`/api/v1`**: Unified Express REST API (reverse-proxied via Nginx and Next.js).

## 🔑 Default Seeded Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@techsolutionor.com` | `Admin@123456` |
| **Domain Owner (Client)** | `user@apexdesign.io` | `User@123456` |
| **Webmail User** | `alex@apexdesign.io` | `Alex@123456` |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Express, Sequelize ORM (PostgreSQL & SQLite supported)
- **Security**: Bcrypt password hashing, JWT authentication with role-based middleware, TOTP 2FA
- **Process Manager**: PM2 (`ecosystem.config.js`)
- **Web Server**: Nginx Reverse Proxy (`deploy/nginx-techsolutionor.conf`)

## 📦 Quick Start (Development)

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run backend (Port 4000)
npm run backend:dev

# Run frontend (Port 3000)
npm run dev

# Run full backend test suite
npm run backend:test
```

## 🌐 Production VPS Deployment

See `deploy/deploy.sh` and `deploy/nginx-techsolutionor.conf` for 1-click deployment on Ubuntu/Debian VPS.
