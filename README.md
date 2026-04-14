# Aircraft Maintenance Tracker v2

Aircraft Maintenance Tracker v2 is a full-stack maintenance-control web application for airline engineering teams. It keeps the original React + Express + MongoDB structure, but upgrades the project from a basic CRUD demo toward a more company-usable operational tool.

## What changed in v2

The original version already covered authentication, fleet status, maintenance tasks, defect logging, aircraft history, and overdue alerts. v2 keeps all of that and adds more realistic airline-style controls:

- role-aware access control for aircraft master data
- richer aircraft technical records
- task reference numbers and sign-off aware completion flow
- defect reference numbers, ATA chapter, operational impact, and deferral fields
- broader operational alerts beyond simple overdue tasks
- improved technical history / audit trail entries
- stronger backend hardening with Helmet, rate limiting, better validation, and token expiry
- demo seed script for faster local validation

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT
- API style: REST

## Folder structure

```text
aircraft-maintenance-tracker/
├── render.yaml
├── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── docs/
│   └── PRODUCTION_READINESS.md
└── README.md
```

## Step-by-step setup

### 1) Prerequisites

Install the following first:

- Node.js 18+
- npm 9+
- MongoDB Community Server or MongoDB Atlas

### 2) Backend setup

Open a terminal in `backend`:

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` if needed:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/aircraft_maintenance_tracker_v2
JWT_SECRET=change_this_to_a_long_secret
JWT_EXPIRES_IN=12h
CLIENT_URL=http://localhost:5173
ALLOW_OPEN_ROLE_SIGNUP=false
TASK_DUE_SOON_DAYS=7
CHECK_DUE_SOON_DAYS=14
HOURS_DUE_SOON_MARGIN=5
CYCLES_DUE_SOON_MARGIN=3
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

### 3) Frontend setup

Open a second terminal in `frontend`:

```bash
cd frontend
npm install
cp .env.example .env
```

Default frontend env:

```env
VITE_API_BASE_URL=/api
```

Start the frontend:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

The frontend dev server proxies `/api` requests to the backend automatically, so the same frontend env value also works for production.

### 4) Optional demo data

To populate the app quickly:

```bash
cd backend
npm run seed
```

Demo account:

```text
Email: admin@demoairline.com
Password: Admin1234
```

## Publishing to Render

This repository is now set up for a single-service Render deployment:

- Render runs the Node backend
- the backend serves the built Vite frontend
- MongoDB Atlas is used for the database

### 1) Create the database

Create a MongoDB Atlas cluster and copy the connection string.

### 2) Push this folder to GitHub

Render deploys from a Git repository, so publish this project to GitHub first.

### 3) Create the Render web service

This repo includes `render.yaml`, so you can use Render Blueprint deploy.

Render build/start behavior:

- build command: `npm run build`
- start command: `npm run start`
- health check: `/api/health`

### 4) Set production environment variables

Set these in Render before the first successful deploy:

```env
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random secret>
JWT_EXPIRES_IN=12h
NODE_ENV=production
ALLOW_OPEN_ROLE_SIGNUP=false
TASK_DUE_SOON_DAYS=7
CHECK_DUE_SOON_DAYS=14
HOURS_DUE_SOON_MARGIN=5
CYCLES_DUE_SOON_MARGIN=3
```

Optional:

```env
CLIENT_URL=https://your-render-service.onrender.com
VITE_API_BASE_URL=/api
```

After deployment, the site and API will be served from the same public Render URL.

## Roles and access

v2 introduces practical role behavior:

- **Admin**: full access
- **Maintenance Manager**: can manage aircraft records and operational control actions
- **Quality Inspector**: suited for sign-off and high-risk review workflows
- **Engineer**: can work with tasks and defects, but aircraft master data is restricted

Rules:

- the first signed-up user becomes `Admin`
- later open role selection is only honored if `ALLOW_OPEN_ROLE_SIGNUP=true`
- aircraft create/update routes are restricted to Admin and Maintenance Manager roles
- critical or service-impacting defect defer/resolve actions require supervisory roles

## Main features in v2

### Authentication

- login and signup
- JWT session handling
- password policy improved over the original MVP
- optional staff certificate number and station metadata

### Fleet dashboard

- serviceable / unserviceable / AOG counts
- grounded aircraft count
- open tasks and open defects
- overdue tasks and due-soon tasks
- critical defects
- upcoming and overdue checks

### Aircraft records

Each aircraft now supports:

- registration
- manufacturer
- model
- serial number
- aircraft status
- airworthiness status
- location
- base station
- last inspection date
- next check type and due date
- total flight hours
- total flight cycles
- technical history log

### Maintenance tasks

Each task now supports:

- task reference number
- category
- priority
- due date
- optional due flight hours / cycles
- assigned engineer
- work package reference
- estimated / actual hours
- completion notes
- optional sign-off requirement
- status flow including `Completed Pending Sign-off`

### Defect reporting

Each defect now supports:

- defect reference number
- priority
- ATA chapter
- operational impact
- root cause
- corrective action
- deferred-until date
- controlled handling for critical or service-impacting defects

### Alerts

The original project had overdue task alerts only. v2 expands this to:

- overdue tasks
- due-soon tasks
- critical or service-impacting defects
- overdue checks
- upcoming checks
- grounded aircraft list

## REST API overview

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Aircraft

- `GET /api/aircraft/dashboard`
- `GET /api/aircraft`
- `POST /api/aircraft`
- `GET /api/aircraft/:id`
- `PUT /api/aircraft/:id`
- `GET /api/aircraft/:id/history`

### Maintenance tasks

- `GET /api/tasks`
- `GET /api/tasks?aircraftId=...`
- `POST /api/tasks`
- `PUT /api/tasks/:id`

### Defects

- `GET /api/defects`
- `GET /api/defects?aircraftId=...`
- `POST /api/defects`
- `PUT /api/defects/:id`

### Alerts

- `GET /api/alerts/overdue-maintenance`
- `GET /api/alerts/operational`

## How each part works

### Backend architecture

The backend uses a layered Express structure:

- **models** define MongoDB collections and field rules
- **controllers** contain business logic
- **routes** map HTTP endpoints to controller functions
- **middleware** handles auth, authorization, and error formatting
- **utils/constants** hold domain logic such as references, alert windows, and sign-off rules
- **scripts** contain utility workflows like seeding demo data

### Frontend architecture

The frontend remains simple React:

- `App.jsx` handles session entry and auth screen switching
- `DashboardPage.jsx` loads summary data, selected aircraft details, and alerts
- `components/` contains reusable UI blocks for aircraft, tasks, defects, alerts, and history
- `services/api.js` keeps fetch logic centralized

### Task sign-off flow

v2 introduces a controlled closure workflow:

1. Engineers or supervisors create a task.
2. If `requiresSignOff=false`, the task can go straight to `Completed`.
3. If `requiresSignOff=true` and a non-approval user completes it, the task moves to `Completed Pending Sign-off`.
4. A supervisory role can later move it to `Completed` with sign-off metadata recorded.

### Defect impact flow

1. A defect is raised against an aircraft.
2. The defect carries both priority and operational impact.
3. High-risk defects can automatically escalate aircraft operational status conservatively.
4. Resolving the defect does **not** blindly return the aircraft to serviceable state; recovery is a deliberate manual action.

That last point is intentional, because operational recovery in real maintenance control should not be assumed automatically.

## Build status checked during this upgrade

These checks were completed:

- frontend production build completed successfully with `npm run build`
- backend module import and syntax checks completed successfully

A full database-backed end-to-end smoke test was partially blocked in this environment because an in-memory MongoDB binary could not be downloaded here. The code package is still ready for local validation on a normal developer machine with MongoDB available.

## Is this already at giant-airline standard?

Not fully.

v2 is **much stronger than the original** and is reasonable as a serious company demo / internal pilot / MVP foundation, but large airline platforms still go significantly further with items such as:

- maintenance program compliance (AD/SB, EO, revision control)
- digital technical logbook and crew-maintenance integration
- inventory / tooling / parts traceability
- reliability analytics and predictive maintenance
- work package optimization and manpower planning
- e-signatures, deeper approvals, and regulator-grade audit controls
- integrations with ERP, flight ops, document systems, and OEM data

Use `docs/PRODUCTION_READINESS.md` to see the remaining gap more clearly.
