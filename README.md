# 🌙 Bro Code — Hostel-Focused Midnight Snack Delivery

Bro Code is a full-stack MERN e-commerce application designed specifically for hostel campus life. Students can satisfy late-night hunger cravings (10:00 PM – 4:30 AM) by ordering hot noodles, chilled beverages, chips, and study combos directly to their hostel room.

An authenticated admin and warden portal allows managing products, live inventory, customer orders, store open/closed states, and campus delivery zones.

---

## 🏗️ Architecture & Technology Stack

### Frontend (`client/`)
- **Core:** React 18 with Vite (ES modules)
- **Styling:** Tailwind CSS with rich midnight-neon aesthetics and glassmorphism
- **Routing:** React Router DOM v6
- **State Management:** React Context API & `useReducer` with `localStorage` persistence
- **HTTP Client:** Axios with bearer token interceptors
- **Icons & Alerts:** Lucide React & React Hot Toast
- **Testing:** Vitest + React Testing Library + jsdom

### Backend (`server/`)
- **Runtime:** Node.js with Express (ES modules)
- **Database:** MongoDB with Mongoose ODM
- **Security:** Helmet, CORS, express-rate-limit, express JSON parser
- **Validation:** Zod schema validation
- **Authentication:** JWT (JSON Web Tokens) with bcryptjs password hashing
- **Testing:** Supertest + Vitest

---

## 📁 Repository Layout

```
BROCODE/
├── .gitignore
├── package.json               # Root workspace scripts (concurrently)
├── README.md                  # System documentation & setup manual
│
├── client/                    # React + Vite Frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── assets/            # Static media
│       ├── components/        # Reusable UI components (SnackCard, Modal, StatusBadge, etc.)
│       ├── context/           # CartContext, AuthContext
│       ├── data/              # Static hostel config (blocks, categories, payment methods)
│       ├── hooks/             # useCart, useAuth
│       ├── layouts/           # Navbar, Footer, MainLayout
│       ├── pages/             # Home, Menu, Cart, Checkout, OrderSuccess, TrackOrder
│       │   └── admin/         # AdminLogin, Dashboard, Products, Orders, Settings
│       ├── routes/            # AppRoutes router definition
│       ├── services/          # Axios apiService
│       ├── styles/            # Tailwind index.css
│       ├── test/              # Vitest + RTL setup and component tests
│       └── utils/             # Formatters (INR currency, dates)
│
└── server/                    # Express + MongoDB Backend
    ├── .env.example
    ├── package.json
    └── src/
        ├── config/            # Database connection & environment loader
        ├── controllers/       # Health, Auth, Product, Order, Setting controllers
        ├── middleware/        # JWT auth, rateLimiter, Zod validator, errorMiddleware
        ├── models/            # Mongoose schemas: User, Product, Order, StoreSetting
        ├── routes/            # API v1 routes (/health, /auth, /products, /orders, /settings)
        ├── scripts/           # seedAdmin.js bootstrap script
        ├── services/          # Business logic: productService, orderService, storeSettingService
        ├── tests/             # Backend integration test suite
        ├── utils/             # apiResponse helpers, JWT token utils
        ├── validators/        # Zod validation schemas
        ├── app.js             # Express app instance
        └── server.js          # HTTP server bootstrap & graceful shutdown
```

---

## ⚙️ Environment Variables

### Server (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bro_code
JWT_SECRET=your_jwt_secret_key_min_32_characters_long_for_security
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173


```

### Client (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Bro Code
```

---

## 🚀 Installation & Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection string)

### 2. Install Dependencies
Run from the root directory:
```bash
npm install
```
*(This automatically links and installs root, client, and server dependencies via npm workspaces).*

### 3. Initialize an Admin Account
To create your initial admin account without hardcoding credentials, run:
```bash
npm run seed:admin --prefix server
```
*Or simply visit `/admin/login` in the browser — if no admin exists yet, Bro Code displays a first-run setup form to initialize the account securely.*

### 4. Run Development Servers
To start both backend and frontend concurrently:
```bash
npm run dev
```

Alternatively, start them individually:
```bash
# Terminal 1 - Backend (Port 5000)
npm run dev:server

# Terminal 2 - Frontend (Port 5173)
npm run dev:client
```

### 5. Access the Application
- **Student Store:** [http://localhost:5173](http://localhost:5173)
- **Full Menu:** [http://localhost:5173/menu](http://localhost:5173/menu)
- **Live Order Tracker:** [http://localhost:5173/track](http://localhost:5173/track)
- **Admin Hub:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Backend Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🧪 Testing

Execute both test suites from the root directory:
```bash
npm test
```

Or run them individually:
```bash
# Backend Supertest Integration Suite
npm run test:server

# Frontend Vitest & React Testing Library Suite
npm run test:client
```

---

## 🛡️ Security Features
- **Centralized Error Handling:** Formats standardized JSON errors without leaking stack traces in production.
- **Rate Limiting:** Protects `/api/v1` and sensitive `/api/v1/auth` routes from brute-force attempts.
- **Helmet Security Headers:** Guard against cross-site scripting and framing.
- **Zod Request Validation:** Strictly parses incoming payloads on all order, product, and auth endpoints.
- **Atomic Stock Deductions:** Ensures real-time inventory deductions prevent over-ordering during high-volume hostel midnight rushes.
