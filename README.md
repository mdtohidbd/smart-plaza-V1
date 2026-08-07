# DemoERP — Business Management System & E-Commerce Platform

> **Lightning-Fast Cloud-based ERP + Custom-coded E-Commerce for Electronics Retail**
> Developed by Skybridge systems for **DemoERP**, Khulna, Bangladesh.

---

## 🚀 Performance First
**Our main net goal is extreme performance and fast loading times.**
Both the E-Commerce storefront and the ERP system are hyper-optimized to ensure lightning-fast loading speeds. **Especially for the ERP**, fast load times are prioritized to facilitate rapid data entry, real-time metrics tracking, and zero-latency day-to-day operations for staff.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [License](#license)

---

## 🏢 Overview

DemoERP is a comprehensive, cloud-based Business Management System and custom-coded E-Commerce website built for an electronics retailer. It gives the owner **full real-time visibility and control** over inventory, sales, finance, and online operations — all from a single platform.

**Core Objectives:**
- ⚡ **Lightning Fast Performance** — Zero-latency loading across the ERP and E-Commerce.
- ⚡ **POS-Style Sales** — Fast and efficient daily sales operations.
- 📊 **Centralized Dashboard** — Real-time KPIs for Owners, Investors, and Staff.
- 🔐 **Secure Role-Based Access** — Granular permission control per role.
- 🛒 **Integrated E-Commerce** — Live-synced online store connected to the ERP.

---

## 🎯 Core Features

### 📦 ERP & Management System (Hyper-Optimized for Speed)

#### Dashboard
- Owner, Investor, and Staff role-specific dashboards.
- Real-time metrics: Today's Revenue, Sales Count, Inventory Value, Active Customers.
- Profit/Loss overview (Daily / Weekly / Monthly).
- EMI Outstanding & Collection Overview.
- Alerts: Low Stock, EMI Overdue.
- **Quick Actions:** Instant shortcuts for Stock In, Collect EMI, etc.

#### Inventory Control
- **Serial Number Tracking** — Mandatory for high-value products (TVs, fridges, washing machines).
- Multi-supplier management with brand and model tracking.
- Stock In / Stock Out / Adjustment workflows.
- Low stock alerts & inventory reports.

#### Sales & Invoice Management
- Cash and EMI invoice generation.
- **Dual Invoice System** — Original sale invoice + alternate fabricated invoice.
- Invoice enhancements: Delivery charge, Installation cost, Card charge.
- Automatic stock deduction on sale.
- Sales reports by date, product, and employee.
- **PDF & Excel Exports** — Fast generation for all financial and invoice data.

#### Customer & EMI Management
- Customer profile management (showroom-based).
- EMI installment tracking with due/paid status.
- Outstanding balance view and EMI reports.

#### Finance & Profit-Loss
- Cash flow tracking by method (Cash, Bkash, Card, etc.).
- Daily/Monthly sales summaries.
- Profit and loss calculations.
- Expense entry and income categorization.
- Investor equity-based profit distribution.

#### Communications (SMS Module)
- **Individual SMS** — Merged interface for Customer and Supplier messaging.
- **Bulk SMS** — Paste lists, compose promotional messages, integrated with MimSMS API.
- **SMS Reports & Logs** — Track messaging statistics and automated logs.

#### Employee Management
- Employee profiles with role-based access control.
- **Strict Registration Control** — Mandatory admin approval stage for new user registrations.
- Inline sales performance tracking.
- Employee-wise sales reports.

---

### 🛒 E-Commerce Platform (Fast & Responsive)

- **Dynamic Product Management** — Real-time sync with ERP inventory.
- **Guest Checkout** — Low-friction ordering with COD and advance payment.
- **Local Payment Gateways** — Bkash, Nagad.
- **Courier Selection** — Integration with Pathao, Steadfast, Paperfly, RedX.
- **Order Tracking** — Real-time status updates for customers.
- **Customer Portal** — Order history, invoices, wishlist, return requests.

#### 🛡️ Bonus: Customer Fraud Detection
Auto-detects high-risk customers via mobile number lookup across courier APIs (Pathao, Steadfast, Paperfly, RedX) — **before you ship a single product**.

---

## 👥 User Roles

| Role | Access Level |
|------|-------------|
| **Owner (Super Admin)** | Full system access — all reports, users, settings |
| **Investor** | Profit/loss distribution and equity reports |
| **Staff (SR / DSR)** | Sales operations, EMI collections, customer management |
| **Customer** | Online shopping, order tracking, profile management |

---

## 🔧 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT — Role-Based |
| PDF Generation | Puppeteer |
| Excel Exports | ExcelJS |
| File Uploads | Multer |
| Communication | MimSMS API |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite) — Optimized for fast loading |
| UI Library | Material-UI (MUI) v5, Emotion React |
| Routing | React Router v6 |
| Data Fetching | React Query + Axios |
| State | React Context API |
| Charts | Recharts |

### Third-Party Integrations
- **Payment Gateways**: Bkash, Nagad
- **Courier APIs**: Pathao, Steadfast, Paperfly, RedX
- **SMS API**: MimSMS

---

## 📁 Project Structure

```text
DemoERP/
├── frontend/               # React (Vite) frontend (Extremely Fast Load)
│   ├── src/
│   │   ├── assets/         # Images, fonts
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # React Context providers
│   │   ├── layouts/        # Dashboard & page layouts
│   │   ├── utils/          # Helper functions
│   │   └── views/          # Pages & routes
│   │       ├── Dashboard/
│   │       ├── Inventory/
│   │       ├── Sales/
│   │       ├── Finance/
│   │       ├── Ecommerce/
│   │       ├── EMI/
│   │       └── ...
│   └── package.json
├── backend/                # Node.js + Express API
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── utils/              # PDF, invoice generators
│   └── server.js
├── .agent/                 # Agent specific configuration
├── Updates.txt             # Changelog for all updates
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/DemoERP.git
cd DemoERP

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Running in Development

```bash
# Backend (from /backend directory)
npm run dev
# → API available at http://localhost:5001/api

# Frontend (from /frontend directory)
npm run dev
# → App available at http://localhost:5173
```

### Access Points

| Service | URL |
|---------|-----|
| ERP Dashboard | `http://localhost:5173/dashboard` |
| E-Commerce Store | `http://localhost:5173/shop` |
| Backend API | `http://localhost:5001/api` |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/DemoERP
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5001/api
```

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`.

---

## 📦 Deployment

### Build for Production

```bash
# Build frontend
cd frontend
npm run build
# Output: frontend/dist/

# Start backend in production mode
cd backend
NODE_ENV=production npm start
```

### Deployment Checklist
- [ ] Set all environment variables on the server
- [ ] Configure MongoDB Atlas URI
- [ ] Set up domain & SSL certificate
- [ ] Serve the `frontend/dist/` folder via a reverse proxy (Nginx / Apache)
- [ ] Point the backend API on the configured port
- [ ] Optimize caching for maximum load speed

---

## 📄 License

**Proprietary Software — All Rights Reserved**

Upon full payment, DemoERP owns all rights to this system, its content, and all associated documented services.

Developed by **SoftEngineLab** · January 2026
Contact: [admin@yourskybridge.com](mailto:admin@yourskybridge.com)
Address: 2 KDA Ave, Khulna, Bangladesh

---

*Version: 1.0.0 · Last Updated: July 2026*
#   s m a r t - p l a z a - V 1  
 