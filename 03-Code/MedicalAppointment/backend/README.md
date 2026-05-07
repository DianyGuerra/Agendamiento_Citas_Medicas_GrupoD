# Medical Appointment System - Backend Architecture

## 🏗️ Architecture Overview

This backend follows a **microservices architecture** with 3 independent APIs:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Application                          │
│                    (Vanilla JS / React / Vue)                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   CRUD API    │   │ Business API  │   │ External API  │
│   Port 3001   │   │   Port 3002   │   │   Port 3003   │
│               │   │               │   │               │
│ • Users       │   │ • Availability│   │ • Auth        │
│ • Patients    │   │ • Scheduling  │   │ • Email       │
│ • Doctors     │   │ • Consultation│   │ • QR Codes    │
│ • Appointments│   │ • Billing     │   │ • Reminders   │
│ • Specialties │   │ • Reports     │   │               │
│ • Schedules   │   │ • Validation  │   │               │
│ • Records     │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │    Shared Module        │
              │                         │
              │ • Config (DB, JWT, CORS)│
              │ • Middleware (Auth, Err)│
              │ • Utils (Response, Help)│
              │ • Errors (Custom types) │
              │ • Repositories (Base)   │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │   Supabase PostgreSQL   │
              └─────────────────────────┘
```

## 🎯 SOLID Principles Applied

### Single Responsibility (S)
- Each API has a single purpose
- Controllers only handle HTTP requests/responses
- Services contain business logic
- Repositories handle data access

### Open/Closed (O)
- BaseRepository can be extended without modification
- Middleware can be composed without changing core

### Liskov Substitution (L)
- All repositories inherit from BaseRepository
- Custom errors extend base AppError

### Interface Segregation (I)
- APIs expose only relevant endpoints
- Clients use only what they need

### Dependency Inversion (D)
- High-level modules depend on abstractions
- Database access through repository pattern

## 🌐 REST Constraints

### 1. Client-Server
- Frontend and backend are completely separated
- APIs can be developed/deployed independently

### 2. Stateless
- JWT authentication - no server-side sessions
- Each request contains all needed information

### 3. Cacheable
- ETags and Cache-Control headers where appropriate
- Response includes cacheability indicators

### 4. Uniform Interface
- Consistent resource naming (`/api/v1/resources`)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- HATEOAS links in responses where applicable

### 5. Layered System
- 3-tier architecture (API → Service → Repository)
- Each layer only knows about adjacent layers

### 6. Code on Demand (Optional)
- Not implemented - static client

## 📁 Project Structure

```
backend/
├── shared/                      # Shared module (used by all APIs)
│   ├── config/
│   │   ├── cors.config.js      # CORS configuration
│   │   ├── database.config.js  # Supabase connection
│   │   └── jwt.config.js       # JWT settings
│   ├── constants/
│   │   ├── httpStatus.constants.js
│   │   └── roles.constants.js
│   ├── errors/
│   │   ├── index.js
│   │   ├── AppError.js
│   │   ├── ValidationError.js
│   │   ├── NotFoundError.js
│   │   ├── AuthorizationError.js
│   │   └── BusinessError.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── logger.middleware.js
│   │   └── validation.middleware.js
│   ├── repositories/
│   │   └── base.repository.js
│   └── utils/
│       ├── responseBuilder.utils.js
│       └── helpers.utils.js
│
├── crud-api/                    # CRUD Operations API (Port 3001)
│   ├── server.js
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── patient.controller.js
│   │   ├── doctor.controller.js
│   │   ├── appointment.controller.js
│   │   ├── specialty.controller.js
│   │   ├── schedule.controller.js
│   │   ├── medicalRecord.controller.js
│   │   ├── consultationNote.controller.js
│   │   ├── prescription.controller.js
│   │   ├── billing.controller.js
│   │   └── consultationRoom.controller.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── patient.repository.js
│   │   ├── doctor.repository.js
│   │   ├── appointment.repository.js
│   │   ├── specialty.repository.js
│   │   ├── schedule.repository.js
│   │   ├── scheduleException.repository.js
│   │   ├── medicalRecord.repository.js
│   │   ├── consultationNote.repository.js
│   │   ├── prescription.repository.js
│   │   ├── billing.repository.js
│   │   └── consultationRoom.repository.js
│   └── routes/
│       ├── index.js
│       ├── user.routes.js
│       ├── patient.routes.js
│       ├── doctor.routes.js
│       ├── appointment.routes.js
│       ├── specialty.routes.js
│       ├── schedule.routes.js
│       ├── medicalRecord.routes.js
│       ├── consultationNote.routes.js
│       ├── prescription.routes.js
│       ├── billing.routes.js
│       └── consultationRoom.routes.js
│
├── business-api/                # Business Rules API (Port 3002)
│   ├── server.js
│   ├── services/
│   │   ├── availability.service.js
│   │   ├── scheduling.service.js
│   │   ├── consultation.service.js
│   │   ├── billingCalculation.service.js
│   │   ├── report.service.js
│   │   └── validation.service.js
│   ├── controllers/
│   │   ├── availability.controller.js
│   │   ├── scheduling.controller.js
│   │   ├── consultation.controller.js
│   │   ├── billingCalculation.controller.js
│   │   ├── report.controller.js
│   │   └── validation.controller.js
│   └── routes/
│       ├── availability.routes.js
│       ├── scheduling.routes.js
│       ├── consultation.routes.js
│       ├── billingCalculation.routes.js
│       ├── report.routes.js
│       └── validation.routes.js
│
├── external-api/                # External Services API (Port 3003)
│   ├── server.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── qrCode.service.js
│   │   └── reminder.service.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── notification.controller.js
│   │   ├── reminder.controller.js
│   │   └── qrCode.controller.js
│   └── routes/
│       ├── index.js
│       ├── auth.routes.js
│       ├── notification.routes.js
│       ├── reminder.routes.js
│       └── qrCode.routes.js
│
├── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Running the APIs

```bash
# Run all APIs simultaneously
npm run start:all

# Run individual APIs
npm run start:crud      # Port 3001
npm run start:business  # Port 3002
npm run start:external  # Port 3003

# Development mode with hot reload
npm run dev:crud
npm run dev:business
npm run dev:external
```

## 📡 API Endpoints

### CRUD API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:id` | Get user by ID |
| PUT | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Soft delete user |
| GET | `/api/v1/patients` | List all patients |
| GET | `/api/v1/doctors` | List all doctors |
| GET | `/api/v1/appointments` | List appointments |
| GET | `/api/v1/specialties` | List specialties |
| GET | `/api/v1/schedules` | List schedules |

### Business API (Port 3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/availability/doctors/:id/slots` | Get available slots |
| POST | `/api/v1/scheduling/book` | Book appointment |
| POST | `/api/v1/scheduling/appointments/:id/cancel` | Cancel appointment |
| POST | `/api/v1/consultation/appointments/:id/start` | Start consultation |
| POST | `/api/v1/consultation/appointments/:id/end` | End consultation |
| GET | `/api/v1/reports/dashboard` | Get dashboard stats |
| GET | `/api/v1/billing/appointments/:id/calculate` | Calculate billing |

### External API (Port 3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/password-reset/request` | Request password reset |
| POST | `/api/v1/notifications/appointment-confirmation` | Send confirmation email |
| POST | `/api/v1/qr-codes/prescription/:id` | Generate prescription QR |
| POST | `/api/v1/reminders/process` | Process pending reminders |

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/v1/auth/login` on the External API.

## 🗄️ Database Schema

### Tables
- `users` - User accounts
- `patients` - Patient profiles
- `doctors` - Doctor profiles
- `specialties` - Medical specialties
- `appointments` - Appointment bookings
- `doctor_schedules` - Weekly schedules
- `schedule_exceptions` - Vacations/exceptions
- `medical_records` - Patient medical records
- `consultation_notes` - Consultation notes
- `prescriptions` - Medical prescriptions
- `billings` - Invoice/billing records
- `consultation_rooms` - Physical rooms

### Soft Delete
All tables use soft delete via `is_active` or `deleted_at` columns.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test individual API health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## 📝 License

ISC
