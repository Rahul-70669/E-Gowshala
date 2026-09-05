# 🐄 E-Gowshala — Smart Gaushala Management System

A comprehensive digital platform for managing Indian cow shelters (Gaushalas) with AI-powered health monitoring, donation management with 80G tax receipts, and real-time operational tracking.

## 🌟 Features

| Module | Description |
|---|---|
| 🔐 **Auth & RBAC** | Multi-role authentication (Admin, Vet, Caretaker, Donor, Volunteer, Government) |
| 🐄 **Cow Management** | Register, track, search cows with QR codes, breed data, shed assignments |
| 🩺 **Health Monitoring** | Medical records, vaccination schedules, pregnancy tracking |
| 📋 **Daily Operations** | Kanban task board, feed logging, attendance tracking |
| 💰 **Donation & 80G** | Payment processing, 80G tax receipt PDF generation, Adopt-a-Cow |
| 👥 **Visitor Management** | Visit scheduling, check-in/out, feedback collection |
| 💹 **Financial Management** | Expense tracking, income vs expense analytics, category breakdown |
| 🧠 **AI Health Intelligence** | Disease prediction, behavior analysis, treatment recommendations |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MongoDB (Atlas M0 free tier) |
| **AI Service** | Python + FastAPI |
| **Deployment** | Vercel (client) + Render (server) |
| **Auth** | JWT + bcryptjs |
| **PWA** | Vite PWA Plugin + Service Worker |

## 🚀 Getting Started

### ⚡ Quick Start (All Services in 1 Step)
You can start the Backend API, AI Service, and Frontend together with **one command**:

```bash
# Option 1: Double-click start.bat in the project folder (Windows)
# Option 2: Run from terminal:
npm run start
```
This automatically boots:
- 🖥️ **Frontend:** `http://localhost:5173`
- ⚙️ **Backend API:** `http://localhost:5000` (auto-connects to MongoDB with embedded fallback + auto-seeding)
- 🤖 **AI Service:** `http://localhost:8000`

### 🔑 Default Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@egowshala.org` | `admin123` |
| **Veterinarian** | `vet@egowshala.org` | `admin123` |
| **Caretaker** | `caretaker@egowshala.org` | `admin123` |
| **Donor** | `donor@egowshala.org` | `admin123` |
git clone https://github.com/yourusername/e-gowshala.git
cd e-gowshala

# Install server dependencies
cd server
npm install
cp .env.example .env  # Edit with your MongoDB URI & JWT secret

# Install client dependencies
cd ../client
npm install
cp .env.example .env

# Install AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

### Running Locally

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev

# Terminal 3 — AI Service (optional)
cd ai-service
uvicorn main:app --reload
```

### Database Seeding

```bash
cd server
npm run seed
```

This creates:
- 6 users (all passwords: `admin123`)
- 20 cows with Indian breeds
- 6 sheds, health records, vaccinations, pregnancies
- 30 days of feed logs, tasks, attendance
- Donations, adoptions, visitors, 3 months of expenses

### Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@egowshala.org | admin123 |
| Veterinarian | vet@egowshala.org | admin123 |
| Caretaker | caretaker@egowshala.org | admin123 |
| Donor | donor@egowshala.org | admin123 |
| Volunteer | volunteer@egowshala.org | admin123 |
| Government | govt@egowshala.org | admin123 |

## 📁 Project Structure

```
E-Gowshala/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── features/     # Module pages (cows, health, operations, etc.)
│   │   ├── components/   # Shared UI components
│   │   ├── store/        # Zustand auth store
│   │   └── lib/          # API client, utilities
│   └── vercel.json       # Vercel deployment config
├── server/               # Express + TypeScript backend
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, cow, health, etc.)
│   │   ├── middleware/    # Auth, RBAC, error handling
│   │   ├── config/       # Environment config
│   │   └── utils/        # PDF generator, query helpers
│   └── render.yaml       # Render deployment config
└── ai-service/           # Python FastAPI microservice
    ├── main.py           # Disease prediction & behavior analysis
    └── requirements.txt
```

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control (6 roles)
- Rate limiting (200 req/15min, 20/15min for auth)
- NoSQL injection prevention
- HTTP Parameter Pollution protection
- Helmet security headers
- Input validation & sanitization

## 📊 API Endpoints

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Cows | `GET/POST /api/cows`, `GET /api/cows/:id`, `GET /api/cows/stats` |
| Health | `GET/POST /api/health/records`, `GET /api/health/vaccinations/due` |
| Operations | `GET/POST /api/operations/tasks`, `GET/POST /api/operations/feed` |
| Donations | `GET/POST /api/donations`, `POST /api/donations/:id/complete` |
| Visitors | `GET/POST /api/visitors`, `POST /api/visitors/:id/check-in` |
| Finance | `GET/POST /api/finance/expenses`, `GET /api/finance/summary` |
| AI | `POST /predict/disease`, `POST /analyze/behavior`, `GET /diseases` |

## 📄 License

MIT

---

Built with ❤️ for the welfare of Gau Mata 🙏
