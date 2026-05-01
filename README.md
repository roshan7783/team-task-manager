# Team Task Manager

A production-ready full-stack project management app built with React + Node.js + MongoDB.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/xdH2XA?referralCode=YCY2ky&utm_medium=integration&utm_source=template&utm_campaign=generic)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React (Vite) + Tailwind CSS v4      |
| Backend    | Node.js + Express                   |
| Database   | MongoDB (Mongoose)                  |
| Auth       | JWT + bcryptjs                      |
| Deployment | Railway (backend) + Vercel (frontend)|

---

## Features

- JWT-based authentication with role support (Admin / Member)
- Admin: create projects, add/remove members, create & assign tasks, delete tasks
- Member: view assigned tasks, update task status only
- Dashboard with live stats — total, completed, in-progress, pending, overdue tasks
- Overdue detection (dueDate < today and not completed)
- Responsive UI with mobile navbar
- Protected routes with role-based rendering
- Toast notifications for all actions
- Centralized error handling on backend

---

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js                  ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js                ← JWT protect + authorizeRoles
│   │   ├── errorHandler.js        ← Centralized error handler
│   │   └── validate.js            ← express-validator helper
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── dashboardRoutes.js
│   ├── .env
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── StatCard.jsx
    │   │   └── TaskCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx     ← Auth state + JWT persistence
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   └── Tasks.jsx
    │   ├── services/
    │   │   └── api.js              ← Axios instance + all API calls
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    └── vite.config.js
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- MongoDB running locally (`mongod`) or MongoDB Atlas URI
- npm

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment variables

**backend/.env**
```
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ethara
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> Note: Port 5000 is reserved by macOS AirPlay Receiver. Use 5001.

**frontend/.env**
```
VITE_API_URL=http://localhost:5001/api
```

### 3. Run both servers

**Option A — Single command (recommended)**
```bash
cd backend
npm run dev:all
```
This starts both backend (port 5001) and frontend (port 5173) together.

**Option B — Separate terminals**
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

App runs at: **http://localhost:5173**

---

## Test Accounts

These accounts are pre-created in the local database during testing:

| Role   | Name        | Email             | Password  |
|--------|-------------|-------------------|-----------|
| Admin  | Admin User  | admin@test.com    | admin123  |
| Member | Roshan      | member@test.com   | member123 |

Or create your own via the Signup page.

---

## API Documentation

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint         | Access  | Description       |
|--------|------------------|---------|-------------------|
| POST   | /api/auth/signup | Public  | Register new user |
| POST   | /api/auth/login  | Public  | Login             |
| GET    | /api/auth/me     | Private | Get current user  |

**POST /api/auth/signup — Request body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "admin"
}
```

**Response**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "_id": "...", "name": "John Doe", "email": "...", "role": "admin" }
}
```

---

### Projects

| Method | Endpoint                          | Access  | Description       |
|--------|-----------------------------------|---------|-------------------|
| GET    | /api/projects                     | Private | Get all projects  |
| POST   | /api/projects                     | Admin   | Create project    |
| GET    | /api/projects/:id                 | Private | Get project by ID |
| POST   | /api/projects/:id/members         | Admin   | Add member        |
| DELETE | /api/projects/:id/members/:userId | Admin   | Remove member     |
| GET    | /api/projects/users               | Admin   | List all users    |

**POST /api/projects — Request body**
```json
{
  "name": "Website Redesign",
  "description": "Redesign the company website"
}
```

---

### Tasks

| Method | Endpoint       | Access  | Description                        |
|--------|----------------|---------|------------------------------------|
| GET    | /api/tasks     | Private | Get tasks (filter: ?projectId=xxx) |
| POST   | /api/tasks     | Admin   | Create task                        |
| GET    | /api/tasks/:id | Private | Get task by ID                     |
| PUT    | /api/tasks/:id | Private | Update (members: status only)      |
| DELETE | /api/tasks/:id | Admin   | Delete task                        |

**POST /api/tasks — Request body**
```json
{
  "title": "Design homepage",
  "description": "Create wireframes",
  "projectId": "<project_id>",
  "assignedTo": "<user_id>",
  "dueDate": "2026-06-01",
  "priority": "High"
}
```

**PUT /api/tasks/:id — Member (status only)**
```json
{ "status": "In Progress" }
```

**PUT /api/tasks/:id — Admin (full update)**
```json
{
  "title": "Updated title",
  "status": "Completed",
  "priority": "Low",
  "dueDate": "2026-07-01",
  "assignedTo": "<user_id>"
}
```

Task status values: `Pending` | `In Progress` | `Completed`
Priority values: `Low` | `Medium` | `High`

---

### Dashboard

| Method | Endpoint       | Access  | Description         |
|--------|----------------|---------|---------------------|
| GET    | /api/dashboard | Private | Get stats + recent tasks |

**Response**
```json
{
  "success": true,
  "stats": {
    "totalTasks": 5,
    "completedTasks": 2,
    "pendingTasks": 1,
    "inProgressTasks": 1,
    "overdueTasks": 1,
    "totalProjects": 2
  },
  "recentTasks": [...]
}
```

---

### Health Check

```
GET /api/health  →  { "success": true, "message": "Team Task Manager API is running 🚀" }
```

---

## Role-Based Access

| Feature                   | Admin | Member          |
|---------------------------|-------|-----------------|
| Create project            | ✅    | ❌              |
| Add / remove members      | ✅    | ❌              |
| Create task               | ✅    | ❌              |
| Assign task to member     | ✅    | ❌              |
| Delete task               | ✅    | ❌              |
| View projects & tasks     | ✅    | ✅              |
| Update task status        | ✅    | ✅ (own tasks)  |

---

## Deployment

### How it works on Railway
The backend builds the frontend and serves it as static files. **One Railway service = full app.**

```
Railway runs:
  1. npm install && npm run build   ← installs deps + builds React app into frontend/dist
  2. npm start                      ← Express serves API + React static files on same port
```

### Backend → Railway

1. Push the entire repo to GitHub (both `backend/` and `frontend/` folders)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Set **Root Directory** to `backend` in Railway settings
4. Add these environment variables in Railway dashboard:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/team-task-manager
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.railway.app
```

5. Railway auto-runs `npm run build` then `npm start`
6. Your app is live at `https://your-app.railway.app`

> No separate Vercel deployment needed — Railway serves both frontend and backend.

### MongoDB Atlas (for production)

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user with read/write access
3. Network Access → Add IP: `0.0.0.0/0` (required for Railway)
4. Copy the connection string into `MONGO_URI`

---

## Scripts

| Location | Command           | Description                          |
|----------|-------------------|--------------------------------------|
| backend  | `npm run dev:all` | Start backend + frontend together    |
| backend  | `npm run dev`     | Start backend only (nodemon)         |
| backend  | `npm run build`   | Build frontend for production        |
| backend  | `npm start`       | Start backend for production         |
| frontend | `npm run dev`     | Vite dev server only                 |
| frontend | `npm run build`   | Build frontend only                  |
