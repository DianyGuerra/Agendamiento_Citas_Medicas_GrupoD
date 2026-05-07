# Medical Appointment Web System - AI Coding Agent Instructions

## Architecture Overview

This is a **full-stack medical appointment system** with a Node.js/Express backend and vanilla JavaScript frontend deployed separately (backend: Render, frontend: Vercel).

### Key Components

- **Backend** (`backend/`): Express server with Supabase PostgreSQL database, JWT authentication, role-based access control (admin, doctor, patient)
- **Frontend** (`panels/`, `js/`, `css/`): Static HTML pages with vanilla JS client. Three role-specific dashboards in `panels/Admin/`, `panels/doctor/`, `panels/patient/`
- **Database**: Supabase (PostgreSQL) - schemas: users, roles, patients, doctors, appointments, doctor_schedules, schedule_exceptions, medical_records, specialties

### Data Flow

1. **Login** → User credentials sent to `/api/auth/login` → JWT token + user role returned → stored in localStorage
2. **Authenticated Requests** → All API calls include `Authorization: Bearer <token>` header → backend validates JWT and checks role
3. **Role-based Access** → Each route protected by `requireRole()` middleware. Frontend redirects post-login based on `user.role`
4. **Backend Errors** → Trigger 401 redirect in frontend (see `api.js` `fetchWithAuth`)

## Critical Patterns

### Authentication & Authorization

- **JWT Flow**: `server.js` login endpoint creates JWT token with `process.env.JWT_SECRET`
- **Middleware Chain**: `authMiddleware` verifies token, fetches full user object from DB, checks `is_active`. Then `requireRole('patient'|'doctor'|'admin')` validates role
- **Frontend**: `js/auth.js` manages login redirects; `js/utils/helpers.js` exports `getAuthToken()`, `getCurrentUser()`, `checkAuth()` used across pages
- **Session Management**: localStorage stores `token` and `user` JSON. 401 responses clear both and redirect to login
- **CORS Config**: `server.js` hardcodes allowed frontend origins (localhost:5500, Vercel production URL)

### Controller Pattern

Controllers are objects with method properties (e.g., `patientController.getProfile`). Each:
1. Extracts user ID from `req.user` (set by authMiddleware)
2. Queries Supabase directly
3. Returns JSON response or error (never throws to middleware - must catch internally)
4. Example: `patientController.js` queries `users` table, then `patients` table, auto-creates patient record if missing

### API Endpoints

All routes imported into `server.js` at lines 27-31:
- `/api/patients/*` → patientController, requires patient role
- `/api/doctors/*` → doctorController, requires doctor role
- `/api/appointments/*` → appointmentController
- `/api/specialties/*` → specialtyController
- `/api/medical-records/*` → medicalRecordController
- `/api/auth/login` → standalone, no auth required

### Frontend API Layer

`js/api.js` provides namespace objects (`window.PatientAPI`, `window.DoctorAPI`, etc.) wrapping fetch calls. Key behavior:
- `fetchWithAuth()` helper injects JWT from localStorage
- Detects 401 responses and clears auth, redirects to login
- All URLs use dynamic `API_URL` (localhost:3000 dev, Render URL production)
- Methods return parsed JSON or throw errors for caller to handle

### Availability Service

`availabilityService.js` calculates available appointment slots by:
1. Checking `schedule_exceptions` table for doctor on date (vacations, day-offs override)
2. Querying `doctor_schedules` for day-of-week working hours
3. Fetching existing appointments for that day from DB
4. Computing 30-min slots in working hours, excluding booked times

## Development Workflows

### Running Backend

```bash
cd backend
npm install  # Install dependencies (express, bcrypt, jwt, supabase client, cors, dotenv)
npm start    # Runs server.js on port 3000 (from .env)
```

Requires `.env` file with:
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=your_secret_key
PORT=3000
```

### Testing API Locally

Backend has `test-backend.js` for manual endpoint testing. No automated test suite in `package.json` (scripts only has start).

### Frontend Development

No build process - serve `index.html` via local server (e.g., Live Server on port 5500). Frontend auto-detects environment by checking `window.location.hostname`.

## Project-Specific Conventions

### Naming

- Route files plural (`patients.js`, `appointments.js`), controller files singular (`patientController.js`)
- Frontend JS uses camelCase classes and methods (`AppointmentManager`, `availableSlots`)
- Tables in Supabase use snake_case (`doctor_schedules`, `schedule_exceptions`, `medical_records`)

### Error Handling

- **Backend**: Catch all errors in controllers, never throw to middleware. Return `res.status(500).json({ error: 'message' })`
- **Frontend**: API methods throw errors on non-200 responses. Callers must catch; 401 auto-handled by `fetchWithAuth`

### LocalStorage Usage

Frontend stores critical auth data:
- `token` → JWT for Authorization header
- `user` → JSON with id, email, role, first_name, last_name
- Some pages may store additional transient data (see `appointmentManager.js` for example)

### Supabase Integration

- No migrations or schema files - schema exists in Supabase console
- All queries use RLS (Row Level Security) not enforced at query level - authorization happens in backend middleware
- Service key used in backend for unrestricted queries; don't expose to frontend

## Common Pitfalls

1. **CORS Issues**: If adding new frontend origin, update `server.js` line 11-16 allowed origins
2. **Expired Tokens**: Always test 401 handling in frontend - should clear storage and redirect
3. **Role Mismatch**: Verify `requireRole()` middleware applied to routes before controller
4. **Supabase Errors**: Catch `.error` objects from Supabase queries (e.g., code 'PGRST116' for not found)
5. **Async/Await**: All Supabase calls are async; wrap in try/catch in async context

## File Structure Reference

- `backend/server.js` → Entry point, route imports, CORS setup
- `backend/middleware/auth.js` → JWT verification, role checking
- `backend/controllers/*.js` → Business logic, DB queries
- `backend/services/availabilityService.js` → Appointment slot calculation
- `js/api.js` → Frontend API client wrapper
- `js/auth.js` → Login/logout, role-based redirects
- `js/utils/helpers.js` → Shared utilities (auth getters, date formatting, age calc)
