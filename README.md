# 💸 SplitWise — Smart Expense Splitter

A full-stack **MERN** application to track shared expenses, automatically calculate debts, and settle up with minimum transactions.

---

## ✨ Features

- **JWT Authentication** — Register, login, protected routes, persistent sessions
- **Group Management** — Create groups, invite members by email, manage roles
- **Expense Tracking** — Add expenses with equal / exact / percentage splits
- **Debt Simplification Algorithm** — Minimizes the number of transactions to settle all debts
- **Settlement Recording** — Mark payments as settled, full payment history
- **Dashboard Analytics** — Monthly bar chart, category doughnut chart, balance overview
- **Real-time Updates** — Socket.io for live expense and payment notifications
- **Dark / Light Mode** — Full theme toggle with CSS variables
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Activity Log** — Per-group audit trail of all actions
- **Notifications** — In-app notification center for group events

---

## 🗂 Project Structure

```
splitwise/
├── backend/                  # Node.js + Express API
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── expenseController.js
│   │   └── paymentController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Expense.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── paymentRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── debtSimplifier.js   # Core algorithm
│   │   └── generateToken.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   └── Charts.jsx
│   │   │   ├── common/
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   ├── expenses/
│   │   │   │   ├── AddExpenseForm.jsx
│   │   │   │   ├── BalanceSummary.jsx
│   │   │   │   └── ExpenseCard.jsx
│   │   │   └── groups/
│   │   │       ├── CreateGroupForm.jsx
│   │   │       └── GroupCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GroupDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json              # Root — run both servers
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas URI

### 1. Clone & Install

```bash
git clone <repo-url>
cd splitwise

# Install all dependencies (root + backend + frontend)
npm install
npm run install:all
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-splitter
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` (only needed for production; dev uses Vite proxy):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Servers

From the **root** directory:
```bash
npm run dev
```

This starts both:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

---

## 🔌 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |
| PUT | `/api/auth/profile` | Update name/avatar |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/notifications` | Get notifications |
| PUT | `/api/auth/notifications/read` | Mark all as read |
| GET | `/api/auth/search?email=` | Search users by email |

### Groups
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/groups` | Get all user's groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:id` | Get group details + balances |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |
| POST | `/api/groups/:id/members` | Add member by email |
| DELETE | `/api/groups/:id/members/:userId` | Remove member |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/expenses/dashboard` | Dashboard stats + charts data |
| POST | `/api/expenses` | Add expense |
| GET | `/api/expenses/group/:groupId` | Get group expenses (paginated, filterable) |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Soft-delete expense |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/payments` | Record settlement |
| GET | `/api/payments/group/:groupId` | Get group payments |
| DELETE | `/api/payments/:id` | Delete payment |

---

## 🧮 Debt Simplification Algorithm

Located in `backend/utils/debtSimplifier.js`.

**Problem:** Given N people with various debts, find the minimum number of transactions to settle everything.

**Algorithm:**
1. Calculate each person's **net balance** (amount paid - amount owed)
2. Separate into **creditors** (positive balance) and **debtors** (negative balance)
3. Greedily match the largest debtor with the largest creditor
4. Record transaction, reduce both balances, repeat

**Example:**
```
A paid for B and C: B owes A ₹200, C owes A ₹300
B paid for C:        C owes B ₹150

Net balances: A=+500, B=-50, C=-450

Simplified (2 transactions instead of 3):
  C pays A ₹450
  B pays A ₹50
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Deploy with Vercel CLI
npx vercel --prod
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL = https://your-backend.onrender.com/api
```

### Backend → Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Strong random secret
   - `CLIENT_URL` — Your Vercel frontend URL
   - `NODE_ENV` — `production`

### Database → MongoDB Atlas

1. Create cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (allow all, for Render)
4. Copy connection string to `MONGO_URI`

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- **JWT** tokens with configurable expiry
- Auth middleware protects all private routes
- Input validation with **express-validator**
- CORS restricted to frontend origin
- Soft-delete for expenses (audit trail preserved)
- Group membership verified on every group action

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| State | Context API |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios |
| Real-time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Validation | express-validator |
| Dev | Nodemon, Concurrently |

---

## 📱 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT auth with show/hide password |
| Register | `/register` | Password strength indicator |
| Dashboard | `/dashboard` | Stats, charts, groups, recent expenses |
| Group Details | `/groups/:id` | Expenses, balances, activity tabs |
| Profile | `/profile` | Edit name, avatar picker, change password |

---

## 🎨 Design System

- **Font:** Outfit (display) + JetBrains Mono (numbers)
- **Primary color:** Brand green `#34986a`
- **Themes:** Light and dark with CSS variables
- **Components:** Cards, badges, buttons, modals — all reusable
- **Animations:** fade-in, slide-up, slide-in via Tailwind keyframes

---

## 📄 License

MIT — free to use and modify.
