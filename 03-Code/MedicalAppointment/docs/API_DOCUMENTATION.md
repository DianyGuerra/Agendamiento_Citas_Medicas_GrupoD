# 📋 API Documentation - Medical Appointment System

**Version:** 2.0  
**Date:** February 2026  
**Architecture:** RESTful Microservices

---

## 📌 Table of Contents

1. [Introduction](#1-introduction)
2. [Production Base URLs](#2-production-base-urls)
3. [Authentication](#3-authentication)
4. [HTTP Response Codes](#4-http-response-codes)
5. [CRUD API - Data Operations](#5-crud-api---data-operations)
   - [5.1 Users](#51-users)
   - [5.2 Patients](#52-patients)
   - [5.3 Doctors](#53-doctors)
   - [5.4 Appointments](#54-appointments)
   - [5.5 Specialties](#55-specialties)
   - [5.6 Schedules](#56-schedules)
   - [5.7 Medical Records](#57-medical-records)
   - [5.8 Consultation Notes](#58-consultation-notes)
   - [5.9 Prescriptions](#59-prescriptions)
   - [5.10 Prescription Renewals](#510-prescription-renewals)
   - [5.11 Billing](#511-billing)
   - [5.12 Billing Items](#512-billing-items)
   - [5.13 Medical Services](#513-medical-services)
   - [5.14 Insurance Providers](#514-insurance-providers)
   - [5.15 Consultation Rooms](#515-consultation-rooms)
   - [5.16 Doctor Ratings](#516-doctor-ratings)
   - [5.17 Satisfaction Surveys](#517-satisfaction-surveys)
   - [5.18 Waiting List](#518-waiting-list)
   - [5.19 Security](#519-security)
6. [Business API - Business Logic](#6-business-api---business-logic)
   - [6.1 Availability](#61-availability)
   - [6.2 Scheduling](#62-scheduling)
   - [6.3 Consultations](#63-consultations)
   - [6.4 Reports](#64-reports)
   - [6.5 Billing Calculations](#65-billing-calculations)
   - [6.6 Validations](#66-validations)
7. [External API - External Integrations](#7-external-api---external-integrations)
   - [7.1 Authentication](#71-authentication)
   - [7.2 Notifications](#72-notifications)
   - [7.3 QR Codes](#73-qr-codes)
   - [7.4 Reminders](#74-reminders)
8. [Data Models](#8-data-models)
9. [Usage Examples](#9-usage-examples)

---

## 1. Introduction

The Medical Appointment system uses a microservices architecture divided into three main APIs:

| API | Purpose | Local Port |
|-----|---------|------------|
| **CRUD API** | Basic data operations (Create, Read, Update, Delete) | 3001 |
| **Business API** | Complex business logic (availability, scheduling, reports) | 3002 |
| **External API** | External integrations (authentication, email, QR codes) | 3003 |

---

## 2. Production Base URLs

| API | Production URL |
|-----|----------------|
| CRUD API | `https://medical-crud-api.onrender.com` |
| Business API | `https://medical-business-api.onrender.com` |
| External API | `https://medical-external-api.onrender.com` |

**Local Development:**
| API | Local URL |
|-----|-----------|
| CRUD API | `http://localhost:3001` |
| Business API | `http://localhost:3002` |
| External API | `http://localhost:3003` |

---

## 3. Authentication

The system uses **JWT (JSON Web Tokens)** for authentication.

### Authorization Header
```
Authorization: Bearer <token>
```

### User Roles
| Role | Description |
|------|-------------|
| `patient` | System patient |
| `doctor` | Medical doctor |
| `admin` | System administrator |

### Get Token
```http
POST https://medical-external-api.onrender.com/auth/login
Content-Type: application/json
```

**Request Schema:**
```typescript
{
  email: string;      // Required - User email
  password: string;   // Required - User password
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  token: string;      // JWT token
  user: {
    id: number;
    email: string;
    role: "patient" | "doctor" | "admin";
    first_name: string;
    last_name: string;
  }
}
```

**Example Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Example Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "patient",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

## 4. HTTP Response Codes

| Code | Meaning |
|------|---------|
| `200` | OK - Successful request |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Request error |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - No permission for this action |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Conflict (e.g., schedule occupied) |
| `500` | Internal Server Error - Server error |

---

## 5. CRUD API - Data Operations

---

### 5.1 Users

#### GET All Users
```
GET https://medical-crud-api.onrender.com/api/v1/users
```
**Description:** Get all system users  
**Access:** `Admin`

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: "patient" | "doctor" | "admin";
    is_active: boolean;
    created_at: string;  // ISO 8601 date
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "admin@hospital.com",
      "first_name": "Admin",
      "last_name": "Principal",
      "role": "admin",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET Current User
```
GET https://medical-crud-api.onrender.com/api/v1/users/me
```
**Description:** Get authenticated user information  
**Access:** `Authenticated`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: "patient" | "doctor" | "admin";
    phone?: string;
    avatar_url?: string;
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "patient@email.com",
    "first_name": "Maria",
    "last_name": "Gonzalez",
    "role": "patient"
  }
}
```

---

#### GET User by ID
```
GET https://medical-crud-api.onrender.com/api/v1/users/:id
```
**Description:** Get user by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    is_email_verified: boolean;
    phone?: string;
    created_at: string;
    updated_at: string;
  }
}
```

---

#### POST Create User
```
POST https://medical-crud-api.onrender.com/api/v1/users
```
**Description:** Create a new user  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  email: string;       // Required - Unique email
  password: string;    // Required - Min 8 characters
  first_name: string;  // Required
  last_name: string;   // Required
  role: "patient" | "doctor" | "admin";  // Required
  phone?: string;      // Optional
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    created_at: string;
  }
}
```

**Example Request:**
```json
{
  "email": "newuser@email.com",
  "password": "password123",
  "first_name": "New",
  "last_name": "User",
  "role": "patient"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "email": "newuser@email.com",
    "first_name": "New",
    "last_name": "User",
    "role": "patient",
    "created_at": "2025-06-15T10:00:00Z"
  }
}
```

---

#### PUT Update Current User
```
PUT https://medical-crud-api.onrender.com/api/v1/users/me
```
**Description:** Update authenticated user information  
**Access:** `Authenticated`

**Request Schema:**
```typescript
{
  first_name?: string;   // Optional
  last_name?: string;    // Optional
  phone?: string;        // Optional
  avatar_url?: string;   // Optional
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    updated_at: string;
  }
}
```

---

#### PUT Update User by ID
```
PUT https://medical-crud-api.onrender.com/api/v1/users/:id
```
**Description:** Update user by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

**Request Schema:**
```typescript
{
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: "patient" | "doctor" | "admin";
  is_active?: boolean;
}
```

---

#### DELETE User
```
DELETE https://medical-crud-api.onrender.com/api/v1/users/:id
```
**Description:** Soft delete user  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

**Response Schema:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 5.2 Patients

#### GET All Patients
```
GET https://medical-crud-api.onrender.com/api/v1/patients
```
**Description:** Get all patients  
**Access:** `Admin, Doctor`  
**Query Parameters:**
- `page` (int): Page number
- `limit` (int): Items per page
- `search` (string): Search by name/email

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    user_id: number;
    date_of_birth: string;    // YYYY-MM-DD
    gender: "male" | "female" | "other";
    phone: string;
    address?: string;
    blood_type?: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

#### GET Patient Statistics
```
GET https://medical-crud-api.onrender.com/api/v1/patients/stats
```
**Description:** Get patient statistics  
**Access:** `Admin`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    active: number;
    new_this_month: number;
    by_gender: {
      male: number;
      female: number;
      other: number;
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 145,
    "new_this_month": 12,
    "by_gender": { "male": 70, "female": 75, "other": 5 }
  }
}
```

---

#### GET Current Patient Profile
```
GET https://medical-crud-api.onrender.com/api/v1/patients/me
```
**Description:** Get authenticated patient's profile  
**Access:** `Patient`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    user_id: number;
    date_of_birth: string;
    gender: "male" | "female" | "other";
    phone: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    allergies?: string[];
    insurance_provider?: {
      id: number;
      name: string;
    };
    policy_number?: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "date_of_birth": "1990-05-15",
    "gender": "female",
    "phone": "+503 7777-0000",
    "address": "Main Street 123",
    "emergency_contact_name": "John Doe",
    "emergency_contact_phone": "+503 7777-1111",
    "blood_type": "O+",
    "allergies": ["Penicillin"],
    "insurance_provider": { "id": 1, "name": "Social Security" }
  }
}
```

---

#### PUT Update Current Patient
```
PUT https://medical-crud-api.onrender.com/api/v1/patients/me
```
**Description:** Update authenticated patient's profile  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string[];
  insurance_provider_id?: number;
  policy_number?: string;
}
```

**Example Request:**
```json
{
  "phone": "+503 7777-0001",
  "address": "New Address 456",
  "emergency_contact_name": "Jane Smith"
}
```

---

#### POST Create Patient with User
```
POST https://medical-crud-api.onrender.com/api/v1/patients/with-user
```
**Description:** Create patient with user account  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  // User data
  email: string;           // Required
  password: string;        // Required
  first_name: string;      // Required
  last_name: string;       // Required
  // Patient data
  date_of_birth: string;   // Required - YYYY-MM-DD
  gender: "male" | "female" | "other";  // Required
  phone: string;           // Required
  address?: string;
  blood_type?: string;
  allergies?: string[];
  insurance_provider_id?: number;
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
    patient: {
      id: number;
      user_id: number;
      date_of_birth: string;
      gender: string;
    }
  }
}
```

---

#### GET Patient by User ID
```
GET https://medical-crud-api.onrender.com/api/v1/patients/user/:userId
```
**Description:** Get patient by user ID  
**Access:** `Admin, Doctor`  
**URL Parameters:** `userId` - User ID

---

#### GET Patient by ID
```
GET https://medical-crud-api.onrender.com/api/v1/patients/:id
```
**Description:** Get patient by ID  
**Access:** `Admin, Doctor`  
**URL Parameters:** `id` - Patient ID

---

#### PUT Update Patient by ID
```
PUT https://medical-crud-api.onrender.com/api/v1/patients/:id
```
**Description:** Update patient by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - Patient ID

---

#### DELETE Patient
```
DELETE https://medical-crud-api.onrender.com/api/v1/patients/:id
```
**Description:** Soft delete patient  
**Access:** `Admin`  
**URL Parameters:** `id` - Patient ID

---

### 5.3 Doctors

#### GET All Doctors
```
GET https://medical-crud-api.onrender.com/api/v1/doctors
```
**Description:** Get all active doctors  
**Access:** `Public`  
**Query Parameters:**
- `specialty_id` (int): Filter by specialty
- `is_active` (boolean): Filter by status

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    user_id: number;
    license_number: string;
    specialty: {
      id: number;
      name: string;
    };
    consultation_fee: number;
    average_rating?: number;
    total_ratings?: number;
    bio?: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    }
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 3,
      "license_number": "MED-12345",
      "specialty": { "id": 1, "name": "Cardiology" },
      "consultation_fee": 50.00,
      "average_rating": 4.8,
      "user": {
        "first_name": "Robert",
        "last_name": "Martinez"
      }
    }
  ]
}
```

---

#### GET Doctors by Specialty
```
GET https://medical-crud-api.onrender.com/api/v1/doctors/specialty/:specialtyId
```
**Description:** Get doctors by specialty  
**Access:** `Public`  
**URL Parameters:** `specialtyId` - Specialty ID

---

#### GET Current Doctor Profile
```
GET https://medical-crud-api.onrender.com/api/v1/doctors/me
```
**Description:** Get authenticated doctor's profile  
**Access:** `Doctor`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    user_id: number;
    license_number: string;
    specialty_id: number;
    specialty: {
      id: number;
      name: string;
    };
    consultation_fee: number;
    bio?: string;
    average_rating?: number;
    total_ratings?: number;
    is_active: boolean;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
    }
  }
}
```

---

#### PUT Update Current Doctor
```
PUT https://medical-crud-api.onrender.com/api/v1/doctors/me
```
**Description:** Update authenticated doctor's profile  
**Access:** `Doctor`

**Request Schema:**
```typescript
{
  consultation_fee?: number;
  bio?: string;
  phone?: string;
}
```

**Example Request:**
```json
{
  "consultation_fee": 55.00,
  "bio": "Specialist with 10 years of experience"
}
```

---

#### GET Doctor's Patients
```
GET https://medical-crud-api.onrender.com/api/v1/doctors/my-patients
```
**Description:** Get list of doctor's patients  
**Access:** `Doctor`

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    last_appointment?: string;
    total_appointments: number;
  }>
}
```

---

#### POST Create Doctor
```
POST https://medical-crud-api.onrender.com/api/v1/doctors
```
**Description:** Create new doctor (requires existing user)  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  user_id: number;         // Required - Existing user ID
  specialty_id: number;    // Required
  license_number: string;  // Required - Unique
  consultation_fee: number; // Required
  bio?: string;
}
```

---

#### POST Create Doctor with User
```
POST https://medical-crud-api.onrender.com/api/v1/doctors/with-user
```
**Description:** Create doctor with user account  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  // User data
  email: string;            // Required
  password: string;         // Required
  first_name: string;       // Required
  last_name: string;        // Required
  phone?: string;
  // Doctor data
  specialty_id: number;     // Required
  license_number: string;   // Required - Unique
  consultation_fee: number; // Required
  bio?: string;
}
```

**Example Request:**
```json
{
  "email": "doctor@hospital.com",
  "password": "password123",
  "first_name": "Anna",
  "last_name": "Garcia",
  "license_number": "MED-54321",
  "specialty_id": 2,
  "consultation_fee": 45.00
}
```

---

#### GET Doctor by ID
```
GET https://medical-crud-api.onrender.com/api/v1/doctors/:id
```
**Description:** Get doctor by ID  
**Access:** `Public`  
**URL Parameters:** `id` - Doctor ID

---

#### PUT Update Doctor by ID
```
PUT https://medical-crud-api.onrender.com/api/v1/doctors/:id
```
**Description:** Update doctor by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - Doctor ID

---

#### POST Reset Doctor Password
```
POST https://medical-crud-api.onrender.com/api/v1/doctors/:id/reset-password
```
**Description:** Reset doctor's password  
**Access:** `Admin`  
**URL Parameters:** `id` - Doctor ID

---

#### DELETE Doctor
```
DELETE https://medical-crud-api.onrender.com/api/v1/doctors/:id
```
**Description:** Soft delete doctor  
**Access:** `Admin`  
**URL Parameters:** `id` - Doctor ID

---

### 5.4 Appointments

#### GET All Appointments
```
GET https://medical-crud-api.onrender.com/api/v1/appointments
```
**Description:** Get all appointments  
**Access:** `Admin`  
**Query Parameters:**
- `status` (string): Filter by status (pending, confirmed, completed, cancelled)
- `date` (date): Filter by date (YYYY-MM-DD)
- `doctor_id` (int): Filter by doctor
- `patient_id` (int): Filter by patient

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    patient: {
      id: number;
      name: string;
    };
    doctor: {
      id: number;
      name: string;
    };
    specialty: {
      id: number;
      name: string;
    };
    appointment_date: string;  // YYYY-MM-DD
    start_time: string;        // HH:MM
    end_time: string;          // HH:MM
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
    reason?: string;
    consultation_room?: {
      id: number;
      name: string;
    };
    confirmation_code: string;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient": { "id": 1, "name": "Maria Gonzalez" },
      "doctor": { "id": 1, "name": "Dr. Robert Martinez" },
      "specialty": { "id": 1, "name": "Cardiology" },
      "appointment_date": "2025-06-15",
      "start_time": "09:00",
      "end_time": "09:30",
      "status": "confirmed",
      "reason": "Routine checkup",
      "consultation_room": { "id": 1, "name": "Office 101" }
    }
  ]
}
```

---

#### GET Unbilled Appointments
```
GET https://medical-crud-api.onrender.com/api/v1/appointments/unbilled
```
**Description:** Get completed appointments without billing  
**Access:** `Admin`

---

#### GET Patient's Appointments
```
GET https://medical-crud-api.onrender.com/api/v1/appointments/patient
```
**Description:** Get authenticated patient's appointments  
**Access:** `Patient`

---

#### GET Appointments by Patient
```
GET https://medical-crud-api.onrender.com/api/v1/appointments/by-patient/:patientUserId
```
**Description:** Get appointments of a specific patient  
**Access:** `Doctor`  
**URL Parameters:** `patientUserId` - Patient's User ID

---

#### GET Doctor's Appointments
```
GET https://medical-crud-api.onrender.com/api/v1/appointments/doctor
```
**Description:** Get authenticated doctor's appointments  
**Access:** `Doctor`

---

#### GET Appointment by ID
```
GET https://medical-crud-api.onrender.com/api/v1/appointments/:id
```
**Description:** Get appointment by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Appointment ID

---

#### POST Create Appointment
```
POST https://medical-crud-api.onrender.com/api/v1/appointments
```
**Description:** Create new appointment  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  doctor_id: number;          // Required
  appointment_date: string;   // Required - YYYY-MM-DD
  start_time: string;         // Required - HH:MM
  reason?: string;            // Optional
  notes?: string;             // Optional
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    confirmation_code: string;
  }
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "appointment_date": "2025-06-20",
  "start_time": "10:00",
  "reason": "Persistent headache",
  "notes": "First consultation"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "appointment_date": "2025-06-20",
    "start_time": "10:00",
    "end_time": "10:30",
    "status": "pending",
    "confirmation_code": "APT-2025-0625"
  }
}
```

---

#### PUT Update Appointment
```
PUT https://medical-crud-api.onrender.com/api/v1/appointments/:id
```
**Description:** Full update of appointment  
**Access:** `Admin`  
**URL Parameters:** `id` - Appointment ID

---

#### PATCH Partial Update Appointment
```
PATCH https://medical-crud-api.onrender.com/api/v1/appointments/:id
```
**Description:** Partial update of appointment  
**Access:** `Admin`  
**URL Parameters:** `id` - Appointment ID

---

#### PATCH Update Appointment Status
```
PATCH https://medical-crud-api.onrender.com/api/v1/appointments/:id/status
```
**Description:** Update appointment status  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Appointment ID

**Request Schema:**
```typescript
{
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
}
```

---

#### PATCH Confirm Appointment
```
PATCH https://medical-crud-api.onrender.com/api/v1/appointments/:id/confirm
```
**Description:** Confirm an appointment  
**Access:** `Admin`  
**URL Parameters:** `id` - Appointment ID

---

#### PATCH Check-in Appointment
```
PATCH https://medical-crud-api.onrender.com/api/v1/appointments/:id/check-in
```
**Description:** Register patient arrival (check-in)  
**Access:** `Admin`  
**URL Parameters:** `id` - Appointment ID

---

#### PATCH Cancel Appointment
```
PATCH https://medical-crud-api.onrender.com/api/v1/appointments/:id/cancel
```
**Description:** Cancel an appointment  
**Access:** `Admin`  
**URL Parameters:** `id` - Appointment ID

---

#### DELETE Appointment
```
DELETE https://medical-crud-api.onrender.com/api/v1/appointments/:id
```
**Description:** Cancel appointment (soft delete)  
**Access:** `Authenticated (owner or admin)`  
**URL Parameters:** `id` - Appointment ID

---

### 5.5 Specialties

#### GET All Specialties
```
GET https://medical-crud-api.onrender.com/api/v1/specialties
```
**Description:** Get all specialties  
**Access:** `Public`

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Cardiology", "description": "Heart specialty" },
    { "id": 2, "name": "Dermatology", "description": "Skin specialty" },
    { "id": 3, "name": "Pediatrics", "description": "Children specialty" }
  ]
}
```

---

#### GET Specialty Statistics
```
GET https://medical-crud-api.onrender.com/api/v1/specialties/stats
```
**Description:** Get specialty statistics  
**Access:** `Public`

---

#### GET Specialty by ID
```
GET https://medical-crud-api.onrender.com/api/v1/specialties/:id
```
**Description:** Get specialty by ID  
**Access:** `Public`  
**URL Parameters:** `id` - Specialty ID

---

#### POST Create Specialty
```
POST https://medical-crud-api.onrender.com/api/v1/specialties
```
**Description:** Create new specialty  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  name: string;         // Required - Unique
  description?: string; // Optional
}
```

**Example Request:**
```json
{
  "name": "Neurology",
  "description": "Nervous system specialty"
}
```

---

#### PUT Update Specialty
```
PUT https://medical-crud-api.onrender.com/api/v1/specialties/:id
```
**Description:** Update specialty  
**Access:** `Admin`  
**URL Parameters:** `id` - Specialty ID

---

#### DELETE Specialty
```
DELETE https://medical-crud-api.onrender.com/api/v1/specialties/:id
```
**Description:** Soft delete specialty  
**Access:** `Admin`  
**URL Parameters:** `id` - Specialty ID

---

### 5.6 Schedules

#### GET All Schedules
```
GET https://medical-crud-api.onrender.com/api/v1/schedules
```
**Description:** Get all schedules  
**Access:** `Public`  
**Query Parameters:**
- `doctor_id` (int): Filter by doctor

---

#### GET Doctor Schedule
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/doctor/:doctorId
```
**Description:** Get doctor's schedule  
**Access:** `Public`  
**URL Parameters:** `doctorId` - Doctor ID

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
    start_time: string;  // HH:MM
    end_time: string;    // HH:MM
    is_active: boolean;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "day_of_week": 1,
      "start_time": "08:00",
      "end_time": "12:00",
      "is_active": true
    },
    {
      "id": 2,
      "day_of_week": 1,
      "start_time": "14:00",
      "end_time": "18:00",
      "is_active": true
    }
  ]
}
```

---

#### GET Current Doctor Schedule
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/me
```
**Description:** Get authenticated doctor's schedule  
**Access:** `Doctor`

---

#### PUT Update Current Doctor Schedule
```
PUT https://medical-crud-api.onrender.com/api/v1/schedules/me
```
**Description:** Update authenticated doctor's schedule  
**Access:** `Doctor`

---

#### GET Schedule by ID
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/:id
```
**Description:** Get schedule by ID  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Schedule ID

---

#### POST Create Schedule
```
POST https://medical-crud-api.onrender.com/api/v1/schedules
```
**Description:** Create new schedule  
**Access:** `Doctor, Admin`

**Request Schema:**
```typescript
{
  doctor_id: number;      // Required
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // Required - 0=Sunday
  start_time: string;     // Required - HH:MM
  end_time: string;       // Required - HH:MM
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "day_of_week": 2,
  "start_time": "09:00",
  "end_time": "13:00"
}
```

---

#### POST Bulk Create Schedules
```
POST https://medical-crud-api.onrender.com/api/v1/schedules/bulk
```
**Description:** Bulk create/update schedules for a doctor  
**Access:** `Doctor, Admin`

**Request Schema:**
```typescript
{
  doctor_id: number;  // Required
  schedules: Array<{
    day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    start_time: string;
    end_time: string;
  }>;
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "schedules": [
    { "day_of_week": 1, "start_time": "08:00", "end_time": "12:00" },
    { "day_of_week": 1, "start_time": "14:00", "end_time": "18:00" },
    { "day_of_week": 2, "start_time": "08:00", "end_time": "12:00" }
  ]
}
```

---

#### PUT Update Schedule
```
PUT https://medical-crud-api.onrender.com/api/v1/schedules/:id
```
**Description:** Update schedule  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Schedule ID

---

#### DELETE Schedule
```
DELETE https://medical-crud-api.onrender.com/api/v1/schedules/:id
```
**Description:** Delete schedule  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Schedule ID

---

#### GET Doctor Exceptions
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/doctor/:doctorId
```
**Description:** Get doctor's schedule exceptions  
**Access:** `Public`  
**URL Parameters:** `doctorId` - Doctor ID

---

#### GET Current Doctor Exceptions
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/me
```
**Description:** Get authenticated doctor's exceptions  
**Access:** `Doctor`

---

#### POST Create Exception
```
POST https://medical-crud-api.onrender.com/api/v1/schedules/exceptions
```
**Description:** Create schedule exception  
**Access:** `Doctor, Admin`

**Request Schema:**
```typescript
{
  doctor_id: number;          // Required
  exception_date: string;     // Required - YYYY-MM-DD
  exception_type: "vacation" | "sick_leave" | "personal" | "other";  // Required
  reason?: string;            // Optional
  start_time?: string;        // Optional - for partial day
  end_time?: string;          // Optional - for partial day
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "exception_date": "2025-06-25",
  "exception_type": "vacation",
  "reason": "Annual vacation"
}
```

---

#### DELETE Exception
```
DELETE https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/:id
```
**Description:** Delete schedule exception  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Exception ID

---

#### POST Request Exception
```
POST https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/request
```
**Description:** Doctor requests exception (requires approval)  
**Access:** `Doctor`

---

#### GET My Exception Requests
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/my-requests
```
**Description:** Get doctor's exception requests  
**Access:** `Doctor`

---

#### DELETE Cancel Exception Request
```
DELETE https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/request/:id
```
**Description:** Cancel exception request  
**Access:** `Doctor`  
**URL Parameters:** `id` - Request ID

---

#### GET Pending Exception Requests
```
GET https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/pending
```
**Description:** Get pending exception requests for approval  
**Access:** `Admin`

---

#### PUT Approve Exception Request
```
PUT https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/:id/approve
```
**Description:** Approve exception request  
**Access:** `Admin`  
**URL Parameters:** `id` - Exception ID

---

#### PUT Reject Exception Request
```
PUT https://medical-crud-api.onrender.com/api/v1/schedules/exceptions/:id/reject
```
**Description:** Reject exception request  
**Access:** `Admin`  
**URL Parameters:** `id` - Exception ID

---

### 5.7 Medical Records

#### GET Current Patient Medical Record
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records
```
**Description:** Get authenticated patient's medical record  
**Access:** `Patient`

---

#### GET Medical Record by Patient ID
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records/:patientId
```
**Description:** Get medical record by patient ID  
**Access:** `Doctor, Admin`  
**URL Parameters:** `patientId` - Patient ID

---

#### POST Create Medical Record Entry
```
POST https://medical-crud-api.onrender.com/api/v1/medical-records
```
**Description:** Create medical record entry (lab orders, notes, etc.)  
**Access:** `Doctor`

---

#### PUT Update Current Patient Medical Record
```
PUT https://medical-crud-api.onrender.com/api/v1/medical-records
```
**Description:** Update authenticated patient's medical record  
**Access:** `Patient`

---

#### PUT Update Medical Record by Patient ID
```
PUT https://medical-crud-api.onrender.com/api/v1/medical-records/:patientId
```
**Description:** Update medical record by patient ID  
**Access:** `Doctor, Admin`  
**URL Parameters:** `patientId` - Patient ID

---

#### GET Current Patient Lab Reports
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports
```
**Description:** Get authenticated patient's lab reports  
**Access:** `Patient`

---

#### GET All Lab Reports
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/all
```
**Description:** Get all lab reports  
**Access:** `Admin`

---

#### GET Doctor's Patients Lab Reports
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/doctor
```
**Description:** Get lab reports for doctor's patients  
**Access:** `Doctor`

---

#### GET Lab Reports by Appointment
```
GET https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/appointment/:appointmentId
```
**Description:** Get lab reports for a specific appointment  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Create Lab Report
```
POST https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports
```
**Description:** Create lab report/order for a patient  
**Access:** `Doctor`

**Request Schema:**
```typescript
{
  patient_id: number;       // Required
  appointment_id?: number;  // Optional
  test_name: string;        // Required
  test_description?: string;
  priority?: "routine" | "urgent" | "stat";
  notes?: string;
}
```

**Example Request:**
```json
{
  "patient_id": 1,
  "appointment_id": 25,
  "test_name": "Complete Blood Count",
  "test_description": "General blood analysis"
}
```

---

#### PUT Upload Lab Results
```
PUT https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/:reportId/results
```
**Description:** Upload results for a lab report  
**Access:** `Doctor`  
**URL Parameters:** `reportId` - Report ID

---

#### POST Add Lab Report Results
```
POST https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/:reportId/results
```
**Description:** Add results to a lab report  
**Access:** `Admin`  
**URL Parameters:** `reportId` - Report ID

---

#### PATCH Update Lab Report Status
```
PATCH https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/:reportId/status
```
**Description:** Update lab report status  
**Access:** `Admin`  
**URL Parameters:** `reportId` - Report ID

---

#### POST Patient Upload External Lab Results
```
POST https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/patient-upload
```
**Description:** Patient uploads their own external lab results  
**Access:** `Patient`

---

#### PUT Patient Upload Pending Lab Results
```
PUT https://medical-crud-api.onrender.com/api/v1/medical-records/lab-reports/:reportId/patient-results
```
**Description:** Patient uploads results for their pending lab reports  
**Access:** `Patient`  
**URL Parameters:** `reportId` - Report ID

---

### 5.8 Consultation Notes

#### GET Current User Consultation Notes
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-notes
```
**Description:** Get consultation notes for current user  
**Access:** `Patient, Doctor`

---

#### GET Consultation Note by Appointment
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-notes/appointment/:appointmentId
```
**Description:** Get consultation note by appointment  
**Access:** `Patient, Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### GET Consultation Note by ID
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-notes/:id
```
**Description:** Get consultation note by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Note ID

---

#### POST Create Consultation Note
```
POST https://medical-crud-api.onrender.com/api/v1/consultation-notes
```
**Description:** Create consultation note  
**Access:** `Doctor`

**Request Schema:**
```typescript
{
  appointment_id: number;  // Required
  subjective: string;      // Required - Patient's complaints
  objective: string;       // Required - Physical examination findings
  assessment: string;      // Required - Diagnosis
  plan: string;            // Required - Treatment plan
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "subjective": "Patient reports headache",
  "objective": "Vital signs normal",
  "assessment": "Tension headache",
  "plan": "Rest and medication"
}
```

---

#### PUT Update Consultation Note
```
PUT https://medical-crud-api.onrender.com/api/v1/consultation-notes/:id
```
**Description:** Update consultation note  
**Access:** `Doctor`  
**URL Parameters:** `id` - Note ID

---

#### DELETE Consultation Note
```
DELETE https://medical-crud-api.onrender.com/api/v1/consultation-notes/:id
```
**Description:** Delete consultation note  
**Access:** `Admin`  
**URL Parameters:** `id` - Note ID

---

### 5.9 Prescriptions

#### GET User Prescriptions
```
GET https://medical-crud-api.onrender.com/api/v1/prescriptions
```
**Description:** Get prescriptions for current user  
**Access:** `Patient, Doctor`

---

#### GET Prescriptions by Appointment
```
GET https://medical-crud-api.onrender.com/api/v1/prescriptions/appointment/:appointmentId
```
**Description:** Get prescriptions for an appointment  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### GET Prescription by ID
```
GET https://medical-crud-api.onrender.com/api/v1/prescriptions/:id
```
**Description:** Get prescription by ID with QR code  
**Access:** `Patient, Doctor, Admin`  
**URL Parameters:** `id` - Prescription ID

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    id: number;
    appointment_id: number;
    patient_id: number;
    doctor_id: number;
    medications: Array<{
      name: string;
      dosage: string;
      duration: string;
      instructions?: string;
    }>;
    instructions?: string;
    valid_until: string;
    is_active: boolean;
    qr_code?: string;    // Base64 image
    qr_token?: string;
  }
}
```

---

#### POST Create Prescription
```
POST https://medical-crud-api.onrender.com/api/v1/prescriptions
```
**Description:** Create prescription  
**Access:** `Doctor`

**Request Schema:**
```typescript
{
  appointment_id: number;  // Required
  patient_id: number;      // Required
  medications: Array<{
    name: string;          // Required
    dosage: string;        // Required
    duration: string;      // Required
    instructions?: string;
  }>;
  instructions?: string;
  valid_until?: string;    // YYYY-MM-DD
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "patient_id": 1,
  "medications": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet every 8 hours",
      "duration": "5 days"
    }
  ],
  "instructions": "Take after meals"
}
```

---

#### PUT Update Prescription
```
PUT https://medical-crud-api.onrender.com/api/v1/prescriptions/:id
```
**Description:** Update prescription  
**Access:** `Doctor`  
**URL Parameters:** `id` - Prescription ID

---

#### DELETE Prescription
```
DELETE https://medical-crud-api.onrender.com/api/v1/prescriptions/:id
```
**Description:** Deactivate prescription (soft delete)  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Prescription ID

---

#### POST Generate Missing QR Codes
```
POST https://medical-crud-api.onrender.com/api/v1/prescriptions/generate-qr-codes
```
**Description:** Generate QR codes for existing prescriptions without QR  
**Access:** `Admin`

---

### 5.10 Prescription Renewals

#### GET User Renewals
```
GET https://medical-crud-api.onrender.com/api/v1/prescription-renewals
```
**Description:** Get renewals for current user  
**Access:** `Patient, Doctor`

---

#### GET Pending Renewals Count
```
GET https://medical-crud-api.onrender.com/api/v1/prescription-renewals/pending-count
```
**Description:** Get count of pending renewals  
**Access:** `Doctor`

---

#### GET Renewal by ID
```
GET https://medical-crud-api.onrender.com/api/v1/prescription-renewals/:id
```
**Description:** Get renewal by ID  
**Access:** `Patient, Doctor`  
**URL Parameters:** `id` - Renewal ID

---

#### POST Request Renewal
```
POST https://medical-crud-api.onrender.com/api/v1/prescription-renewals
```
**Description:** Request prescription renewal  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  prescription_id: number;  // Required
  reason?: string;          // Optional
}
```

**Example Request:**
```json
{
  "prescription_id": 10,
  "reason": "Medication ran out"
}
```

---

#### PUT Approve Renewal
```
PUT https://medical-crud-api.onrender.com/api/v1/prescription-renewals/:id/approve
```
**Description:** Approve renewal request  
**Access:** `Doctor`  
**URL Parameters:** `id` - Renewal ID

---

#### PUT Reject Renewal
```
PUT https://medical-crud-api.onrender.com/api/v1/prescription-renewals/:id/reject
```
**Description:** Reject renewal request  
**Access:** `Doctor`  
**URL Parameters:** `id` - Renewal ID

---

#### DELETE Cancel Renewal
```
DELETE https://medical-crud-api.onrender.com/api/v1/prescription-renewals/:id
```
**Description:** Cancel renewal request  
**Access:** `Patient`  
**URL Parameters:** `id` - Renewal ID

---

### 5.11 Billing

#### GET All Billings
```
GET https://medical-crud-api.onrender.com/api/v1/billings
```
**Description:** Get billings for current user or filtered (admin)  
**Access:** `Authenticated`  
**Query Parameters:**
- `status` (string): pending, paid, cancelled
- `patient_id` (int): Filter by patient

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    appointment_id: number;
    patient: {
      id: number;
      name: string;
    };
    subtotal: number;
    tax: number;
    discount: number;
    insurance_covered: number;
    total: number;
    status: "pending" | "paid" | "cancelled" | "refunded";
    items: Array<{
      description: string;
      amount: number;
    }>;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "appointment_id": 25,
      "patient": { "id": 1, "name": "Maria Gonzalez" },
      "subtotal": 50.00,
      "tax": 6.50,
      "discount": 0,
      "total": 56.50,
      "status": "pending",
      "items": [
        { "description": "General Consultation", "amount": 50.00 }
      ]
    }
  ]
}
```

---

#### GET Billing by ID
```
GET https://medical-crud-api.onrender.com/api/v1/billings/:id
```
**Description:** Get billing with details  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Billing ID

---

#### POST Create Billing
```
POST https://medical-crud-api.onrender.com/api/v1/billings
```
**Description:** Create billing  
**Access:** `Doctor, Admin`

**Request Schema:**
```typescript
{
  appointment_id: number;  // Required
  items: Array<{
    description: string;   // Required
    amount: number;        // Required
  }>;
  discount?: number;
  notes?: string;
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "items": [
    { "description": "General Consultation", "amount": 50.00 }
  ]
}
```

---

#### PATCH Update Billing Status
```
PATCH https://medical-crud-api.onrender.com/api/v1/billings/:id/status
```
**Description:** Update billing status  
**Access:** `Admin`  
**URL Parameters:** `id` - Billing ID

**Request Schema:**
```typescript
{
  status: "pending" | "paid" | "cancelled" | "refunded";
  payment_method?: string;
}
```

**Example Request:**
```json
{
  "status": "paid",
  "payment_method": "card"
}
```

---

#### DELETE Billing
```
DELETE https://medical-crud-api.onrender.com/api/v1/billings/:id
```
**Description:** Cancel billing (soft delete)  
**Access:** `Admin`  
**URL Parameters:** `id` - Billing ID

---

### 5.12 Billing Items

#### GET Billing Items
```
GET https://medical-crud-api.onrender.com/api/v1/billing-items/billing/:billingId
```
**Description:** Get all items for a billing  
**Access:** `Doctor, Admin`  
**URL Parameters:** `billingId` - Billing ID

---

#### POST Add Billing Item
```
POST https://medical-crud-api.onrender.com/api/v1/billing-items
```
**Description:** Add item to billing  
**Access:** `Doctor, Admin`

**Request Schema:**
```typescript
{
  billing_id: number;           // Required
  medical_service_id?: number;  // Optional
  description?: string;         // Required if no medical_service_id
  quantity: number;             // Required
  unit_price?: number;          // Required if no medical_service_id
}
```

**Example Request:**
```json
{
  "billing_id": 1,
  "medical_service_id": 5,
  "quantity": 1
}
```

---

#### DELETE Billing Item
```
DELETE https://medical-crud-api.onrender.com/api/v1/billing-items/:id
```
**Description:** Remove item from billing  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Item ID

---

### 5.13 Medical Services

#### GET All Medical Services
```
GET https://medical-crud-api.onrender.com/api/v1/medical-services
```
**Description:** Get medical services catalog  
**Access:** `Authenticated`  
**Query Parameters:**
- `category` (string): Filter by category
- `specialty_id` (int): Filter by specialty

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    description?: string;
    base_price: number;
    category: string;
    specialty_id?: number;
    is_active: boolean;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General Consultation",
      "description": "General medical consultation",
      "base_price": 50.00,
      "category": "consultation",
      "is_active": true
    }
  ]
}
```

---

#### GET Service Categories
```
GET https://medical-crud-api.onrender.com/api/v1/medical-services/categories
```
**Description:** Get all service categories  
**Access:** `Authenticated`

---

#### GET Medical Service by ID
```
GET https://medical-crud-api.onrender.com/api/v1/medical-services/:id
```
**Description:** Get medical service by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Service ID

---

#### POST Create Medical Service
```
POST https://medical-crud-api.onrender.com/api/v1/medical-services
```
**Description:** Create new medical service  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  name: string;          // Required
  description?: string;
  base_price: number;    // Required
  category: string;      // Required
  specialty_id?: number;
}
```

**Example Request:**
```json
{
  "name": "Electrocardiogram",
  "description": "Heart study",
  "base_price": 75.00,
  "category": "diagnostic"
}
```

---

#### PUT Update Medical Service
```
PUT https://medical-crud-api.onrender.com/api/v1/medical-services/:id
```
**Description:** Update medical service  
**Access:** `Admin`  
**URL Parameters:** `id` - Service ID

---

#### DELETE Medical Service
```
DELETE https://medical-crud-api.onrender.com/api/v1/medical-services/:id
```
**Description:** Delete medical service  
**Access:** `Admin`  
**URL Parameters:** `id` - Service ID

---

### 5.14 Insurance Providers

#### GET All Insurance Providers
```
GET https://medical-crud-api.onrender.com/api/v1/insurance-providers
```
**Description:** Get all active insurance providers  
**Access:** `Authenticated`

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    code: string;
    coverage_percentage: number;
    contact_phone?: string;
    contact_email?: string;
    is_active: boolean;
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Social Security",
      "code": "ISSS",
      "coverage_percentage": 80,
      "is_active": true
    }
  ]
}
```

---

#### GET Insurance Provider by ID
```
GET https://medical-crud-api.onrender.com/api/v1/insurance-providers/:id
```
**Description:** Get insurance provider by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Provider ID

---

#### GET Insurance Provider by Code
```
GET https://medical-crud-api.onrender.com/api/v1/insurance-providers/code/:code
```
**Description:** Get insurance provider by code  
**Access:** `Authenticated`  
**URL Parameters:** `code` - Provider code

---

#### POST Create Insurance Provider
```
POST https://medical-crud-api.onrender.com/api/v1/insurance-providers
```
**Description:** Create insurance provider  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  name: string;                // Required
  code: string;                // Required - Unique
  coverage_percentage: number; // Required - 0-100
  contact_phone?: string;
  contact_email?: string;
}
```

---

#### PUT Update Insurance Provider
```
PUT https://medical-crud-api.onrender.com/api/v1/insurance-providers/:id
```
**Description:** Update insurance provider  
**Access:** `Admin`  
**URL Parameters:** `id` - Provider ID

---

#### DELETE Insurance Provider
```
DELETE https://medical-crud-api.onrender.com/api/v1/insurance-providers/:id
```
**Description:** Delete insurance provider  
**Access:** `Admin`  
**URL Parameters:** `id` - Provider ID

---

### 5.15 Consultation Rooms

#### GET All Consultation Rooms
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-rooms
```
**Description:** Get all consultation rooms  
**Access:** `Public`

**Response Schema:**
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    floor?: string;
    building?: string;
    capacity: number;
    is_available: boolean;
    equipment?: string[];
  }>
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Office 101",
      "floor": "1",
      "building": "Main",
      "capacity": 3,
      "is_available": true,
      "equipment": ["Examination table", "Blood pressure monitor"]
    }
  ]
}
```

---

#### GET Available Room
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-rooms/available
```
**Description:** Get first available room  
**Access:** `Public`

---

#### GET Room by ID
```
GET https://medical-crud-api.onrender.com/api/v1/consultation-rooms/:id
```
**Description:** Get room by ID  
**Access:** `Public`  
**URL Parameters:** `id` - Room ID

---

#### POST Create Room
```
POST https://medical-crud-api.onrender.com/api/v1/consultation-rooms
```
**Description:** Create consultation room  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  name: string;       // Required
  floor?: string;
  building?: string;
  capacity: number;   // Required
  equipment?: string[];
}
```

**Example Request:**
```json
{
  "name": "Office 102",
  "floor": "1",
  "building": "Main",
  "capacity": 3
}
```

---

#### PUT Update Room
```
PUT https://medical-crud-api.onrender.com/api/v1/consultation-rooms/:id
```
**Description:** Update consultation room  
**Access:** `Admin`  
**URL Parameters:** `id` - Room ID

---

#### PATCH Update Room Availability
```
PATCH https://medical-crud-api.onrender.com/api/v1/consultation-rooms/:id/availability
```
**Description:** Update room availability  
**Access:** `Doctor, Admin`  
**URL Parameters:** `id` - Room ID

**Request Schema:**
```typescript
{
  is_available: boolean;
}
```

---

#### DELETE Room
```
DELETE https://medical-crud-api.onrender.com/api/v1/consultation-rooms/:id
```
**Description:** Soft delete room  
**Access:** `Admin`  
**URL Parameters:** `id` - Room ID

---

### 5.16 Doctor Ratings

#### GET All Ratings
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings
```
**Description:** Get all ratings  
**Access:** `Admin`

---

#### GET All Averages
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings/averages
```
**Description:** Get average ratings for all doctors  
**Access:** `Admin`

---

#### GET Ratings by Doctor
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings/doctor/:doctorId
```
**Description:** Get all ratings for a doctor  
**Access:** `Authenticated`  
**URL Parameters:** `doctorId` - Doctor ID

---

#### GET Doctor Average Rating
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings/doctor/:doctorId/average
```
**Description:** Get average rating for a doctor  
**Access:** `Authenticated`  
**URL Parameters:** `doctorId` - Doctor ID

---

#### GET Rating by Appointment
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings/appointment/:appointmentId
```
**Description:** Get rating by appointment  
**Access:** `Authenticated`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### GET Rating by ID
```
GET https://medical-crud-api.onrender.com/api/v1/doctor-ratings/:id
```
**Description:** Get rating by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Rating ID

---

#### POST Create Rating
```
POST https://medical-crud-api.onrender.com/api/v1/doctor-ratings
```
**Description:** Create new rating  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  appointment_id: number;  // Required
  doctor_id: number;       // Required
  rating: 1 | 2 | 3 | 4 | 5;  // Required
  comment?: string;
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "doctor_id": 1,
  "rating": 5,
  "comment": "Excellent care"
}
```

---

#### PUT Update Rating
```
PUT https://medical-crud-api.onrender.com/api/v1/doctor-ratings/:id
```
**Description:** Update rating  
**Access:** `Patient, Admin`  
**URL Parameters:** `id` - Rating ID

---

#### DELETE Rating
```
DELETE https://medical-crud-api.onrender.com/api/v1/doctor-ratings/:id
```
**Description:** Delete rating  
**Access:** `Admin`  
**URL Parameters:** `id` - Rating ID

---

### 5.17 Satisfaction Surveys

#### GET All Surveys
```
GET https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys
```
**Description:** Get all surveys  
**Access:** `Admin`

---

#### GET Survey Statistics
```
GET https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys/statistics
```
**Description:** Get survey statistics  
**Access:** `Admin`

---

#### GET Survey by Appointment
```
GET https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys/appointment/:appointmentId
```
**Description:** Get survey by appointment  
**Access:** `Authenticated`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### GET Survey by ID
```
GET https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys/:id
```
**Description:** Get survey by ID  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Survey ID

---

#### POST Create Survey
```
POST https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys
```
**Description:** Create survey  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  appointment_id: number;      // Required
  overall_rating: 1 | 2 | 3 | 4 | 5;  // Required
  wait_time_rating?: 1 | 2 | 3 | 4 | 5;
  cleanliness_rating?: 1 | 2 | 3 | 4 | 5;
  staff_rating?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "overall_rating": 5,
  "wait_time_rating": 4,
  "cleanliness_rating": 5,
  "staff_rating": 5,
  "comments": "Very satisfied with the service"
}
```

---

#### PUT Update Survey
```
PUT https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys/:id
```
**Description:** Update survey  
**Access:** `Admin`  
**URL Parameters:** `id` - Survey ID

---

#### DELETE Survey
```
DELETE https://medical-crud-api.onrender.com/api/v1/satisfaction-surveys/:id
```
**Description:** Delete survey  
**Access:** `Admin`  
**URL Parameters:** `id` - Survey ID

---

### 5.18 Waiting List

#### GET All Waiting List
```
GET https://medical-crud-api.onrender.com/api/v1/waiting-list
```
**Description:** Get waiting list  
**Access:** `Admin, Doctor`  
**Query Parameters:**
- `doctor_id` (int): Filter by doctor
- `status` (string): waiting, notified, booked, cancelled

---

#### GET Waiting Count by Doctor
```
GET https://medical-crud-api.onrender.com/api/v1/waiting-list/doctor/:doctorId/count
```
**Description:** Get waiting count for doctor  
**Access:** `Admin, Doctor`  
**URL Parameters:** `doctorId` - Doctor ID

---

#### GET Waiting List Entry by ID
```
GET https://medical-crud-api.onrender.com/api/v1/waiting-list/:id
```
**Description:** Get waiting list entry by ID  
**Access:** `Admin, Doctor, Patient`  
**URL Parameters:** `id` - Entry ID

---

#### POST Add to Waiting List
```
POST https://medical-crud-api.onrender.com/api/v1/waiting-list
```
**Description:** Add to waiting list  
**Access:** `Patient, Admin`

**Request Schema:**
```typescript
{
  doctor_id?: number;
  specialty_id: number;        // Required
  preferred_dates?: string[];  // Array of YYYY-MM-DD
  preferred_times?: ("morning" | "afternoon" | "evening")[];
  notes?: string;
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "specialty_id": 1,
  "preferred_dates": ["2025-06-20", "2025-06-21"],
  "preferred_times": ["morning", "afternoon"]
}
```

---

#### PUT Update Waiting List Entry
```
PUT https://medical-crud-api.onrender.com/api/v1/waiting-list/:id
```
**Description:** Update waiting list entry  
**Access:** `Admin`  
**URL Parameters:** `id` - Entry ID

---

#### PATCH Update Entry Status
```
PATCH https://medical-crud-api.onrender.com/api/v1/waiting-list/:id/status
```
**Description:** Update entry status  
**Access:** `Admin, Doctor`  
**URL Parameters:** `id` - Entry ID

---

#### DELETE Remove from Waiting List
```
DELETE https://medical-crud-api.onrender.com/api/v1/waiting-list/:id
```
**Description:** Remove from waiting list  
**Access:** `Patient, Admin`  
**URL Parameters:** `id` - Entry ID

---

### 5.19 Security

All security endpoints require `Admin` role.

#### GET Security Stats
```
GET https://medical-crud-api.onrender.com/api/v1/security/stats
```
**Description:** Get security dashboard stats  
**Access:** `Admin`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    total_users: number;
    active_users: number;
    locked_accounts: number;
    pending_verifications: number;
    recent_logins: number;
  }
}
```

---

#### GET All Users (Security)
```
GET https://medical-crud-api.onrender.com/api/v1/security/users
```
**Description:** Get all users with full details  
**Access:** `Admin`

---

#### GET User Details (Security)
```
GET https://medical-crud-api.onrender.com/api/v1/security/users/:id
```
**Description:** Get user details with relations  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### PATCH Update User Status
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/users/:id/status
```
**Description:** Activate or deactivate user  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

**Request Schema:**
```typescript
{
  is_active: boolean;
  reason?: string;
}
```

---

#### PATCH Change User Role
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/users/:id/role
```
**Description:** Change user role  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

**Request Schema:**
```typescript
{
  role: "patient" | "doctor" | "admin";
}
```

---

#### PATCH Manage Email Verification
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/users/:id/verify-email
```
**Description:** Force verify email or resend verification  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### GET User Activity
```
GET https://medical-crud-api.onrender.com/api/v1/security/users/:id/activity
```
**Description:** Get user activity history from audit logs  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### GET User Password Resets
```
GET https://medical-crud-api.onrender.com/api/v1/security/users/:id/password-resets
```
**Description:** Get password reset history for a user  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### POST Generate Password Reset
```
POST https://medical-crud-api.onrender.com/api/v1/security/users/:id/password-reset
```
**Description:** Generate password reset token  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### POST Invalidate Tokens
```
POST https://medical-crud-api.onrender.com/api/v1/security/users/:id/invalidate-tokens
```
**Description:** Invalidate all password reset tokens  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### POST Set User Password
```
POST https://medical-crud-api.onrender.com/api/v1/security/users/:id/set-password
```
**Description:** Admin sets new password for user  
**Access:** `Admin`  
**URL Parameters:** `id` - User ID

---

#### GET All Roles
```
GET https://medical-crud-api.onrender.com/api/v1/security/roles
```
**Description:** Get all roles with user counts  
**Access:** `Admin`

---

#### GET Role by ID
```
GET https://medical-crud-api.onrender.com/api/v1/security/roles/:id
```
**Description:** Get role by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - Role ID

---

#### POST Create Role
```
POST https://medical-crud-api.onrender.com/api/v1/security/roles
```
**Description:** Create new role  
**Access:** `Admin`

---

#### PUT Update Role
```
PUT https://medical-crud-api.onrender.com/api/v1/security/roles/:id
```
**Description:** Update role  
**Access:** `Admin`  
**URL Parameters:** `id` - Role ID

---

#### DELETE Role
```
DELETE https://medical-crud-api.onrender.com/api/v1/security/roles/:id
```
**Description:** Delete role  
**Access:** `Admin`  
**URL Parameters:** `id` - Role ID

---

#### PATCH Update Role Permissions
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/roles/:id/permissions
```
**Description:** Update role permissions  
**Access:** `Admin`  
**URL Parameters:** `id` - Role ID

---

#### GET All Administrators
```
GET https://medical-crud-api.onrender.com/api/v1/security/administrators
```
**Description:** Get all administrators  
**Access:** `Admin`

---

#### GET Administrator by ID
```
GET https://medical-crud-api.onrender.com/api/v1/security/administrators/:id
```
**Description:** Get administrator by ID  
**Access:** `Admin`  
**URL Parameters:** `id` - Admin ID

---

#### PATCH Update Admin Permissions
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/administrators/:id/permissions
```
**Description:** Update administrator permissions  
**Access:** `Admin`  
**URL Parameters:** `id` - Admin ID

---

#### PATCH Toggle Super Admin
```
PATCH https://medical-crud-api.onrender.com/api/v1/security/administrators/:id/super-admin
```
**Description:** Toggle super admin status  
**Access:** `Admin (Super Admin only)`  
**URL Parameters:** `id` - Admin ID

---

#### GET Audit Logs
```
GET https://medical-crud-api.onrender.com/api/v1/security/audit-logs
```
**Description:** Get audit logs with filters  
**Access:** `Admin`  
**Query Parameters:**
- `user_id` (int): Filter by user
- `action` (string): Filter by action
- `start_date` (date): Start date
- `end_date` (date): End date

---

#### GET Audit Log Filters
```
GET https://medical-crud-api.onrender.com/api/v1/security/audit-logs/filters
```
**Description:** Get available filter options for audit logs  
**Access:** `Admin`

---

#### GET Permissions Matrix
```
GET https://medical-crud-api.onrender.com/api/v1/security/permissions-matrix
```
**Description:** Get the permissions matrix definition  
**Access:** `Admin`

---

## 6. Business API - Business Logic

---

### 6.1 Availability

#### GET Available Slots
```
GET https://medical-business-api.onrender.com/api/v1/availability/doctor/:doctorId/date/:date
```
**Description:** Get available slots for a doctor on a specific date  
**Access:** `Public`  
**URL Parameters:**
- `doctorId` (int): Doctor ID
- `date` (string): Date in YYYY-MM-DD format

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    doctor_id: number;
    date: string;
    available_slots: Array<{
      start: string;  // HH:MM
      end: string;    // HH:MM
    }>;
    working_hours: {
      start: string;
      end: string;
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "doctor_id": 1,
    "date": "2025-06-20",
    "available_slots": [
      { "start": "08:00", "end": "08:30" },
      { "start": "08:30", "end": "09:00" },
      { "start": "10:00", "end": "10:30" }
    ],
    "working_hours": {
      "start": "08:00",
      "end": "12:00"
    }
  }
}
```

---

#### GET Weekly Availability
```
GET https://medical-business-api.onrender.com/api/v1/availability/doctor/:doctorId/weekly
```
**Description:** Get weekly availability for a doctor  
**Access:** `Public`  
**URL Parameters:** `doctorId` - Doctor ID  
**Query Parameters:**
- `start_date` (date): Week start date

---

#### GET Next Available Slot
```
GET https://medical-business-api.onrender.com/api/v1/availability/doctor/:doctorId/next
```
**Description:** Get next available slot for a doctor  
**Access:** `Public`  
**URL Parameters:** `doctorId` - Doctor ID

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    date: string;
    time: string;
    slot: {
      start: string;
      end: string;
    }
  }
}
```

---

#### POST Check Slot Availability
```
POST https://medical-business-api.onrender.com/api/v1/availability/check
```
**Description:** Check if a specific slot is available  
**Access:** `Public`

**Request Schema:**
```typescript
{
  doctor_id: number;  // Required
  date: string;       // Required - YYYY-MM-DD
  time: string;       // Required - HH:MM
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    available: boolean;
    message: string;
  }
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "date": "2025-06-20",
  "time": "10:00"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "The time slot is available"
  }
}
```

---

### 6.2 Scheduling

#### POST Book Appointment
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/book
```
**Description:** Book a new appointment  
**Access:** `Patient`

**Request Schema:**
```typescript
{
  doctor_id: number;  // Required
  date: string;       // Required - YYYY-MM-DD
  time: string;       // Required - HH:MM
  reason?: string;
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    appointment: {
      id: number;
      confirmation_code: string;
      date: string;
      time: string;
      status: string;
    };
    message: string;
  }
}
```

**Example Request:**
```json
{
  "doctor_id": 1,
  "date": "2025-06-20",
  "time": "10:00",
  "reason": "Routine checkup"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": 50,
      "confirmation_code": "APT-2025-0650",
      "date": "2025-06-20",
      "time": "10:00",
      "status": "pending"
    },
    "message": "Appointment booked successfully"
  }
}
```

---

#### PUT Reschedule Appointment
```
PUT https://medical-business-api.onrender.com/api/v1/scheduling/reschedule/:appointmentId
```
**Description:** Reschedule an existing appointment  
**Access:** `Patient, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

**Request Schema:**
```typescript
{
  new_date: string;  // Required - YYYY-MM-DD
  new_time: string;  // Required - HH:MM
  reason?: string;
}
```

---

#### POST Cancel Appointment
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/cancel/:appointmentId
```
**Description:** Cancel an appointment  
**Access:** `Patient, Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

**Request Schema:**
```typescript
{
  reason?: string;
}
```

---

#### POST Confirm Appointment
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/confirm/:appointmentId
```
**Description:** Confirm an appointment  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Confirm Appointment (Public)
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/confirm-public/:appointmentId
```
**Description:** Confirm appointment publicly (via email link)  
**Access:** `Public`  
**URL Parameters:** `appointmentId` - Appointment ID  
**Query Parameters:**
- `token` (string): Confirmation token

---

#### POST Start Consultation
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/start/:appointmentId
```
**Description:** Start a consultation  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Complete Consultation
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/complete/:appointmentId
```
**Description:** Complete a consultation  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Mark No-Show
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/no-show/:appointmentId
```
**Description:** Mark patient as no-show  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### GET Doctor Statistics
```
GET https://medical-business-api.onrender.com/api/v1/scheduling/statistics/doctor/:doctorId
```
**Description:** Get appointment statistics for a doctor  
**Access:** `Doctor, Admin`  
**URL Parameters:** `doctorId` - Doctor ID

---

#### POST Cleanup Past Appointments
```
POST https://medical-business-api.onrender.com/api/v1/scheduling/cleanup-past
```
**Description:** Mark past pending appointments as no-show automatically  
**Access:** `Doctor, Admin`

---

### 6.3 Consultations

#### POST Start Consultation
```
POST https://medical-business-api.onrender.com/api/v1/consultations/start/:appointmentId
```
**Description:** Start consultation workflow  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Complete Consultation
```
POST https://medical-business-api.onrender.com/api/v1/consultations/complete/:appointmentId
```
**Description:** Complete consultation with notes  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

**Request Schema:**
```typescript
{
  subjective: string;       // Required
  objective: string;        // Required
  assessment: string;       // Required
  plan: string;             // Required
  follow_up_date?: string;  // Optional - YYYY-MM-DD
  follow_up_reason?: string;
}
```

**Example Request:**
```json
{
  "subjective": "Patient reports...",
  "objective": "Physical examination...",
  "assessment": "Diagnosis...",
  "plan": "Treatment...",
  "follow_up_date": "2025-07-20",
  "follow_up_reason": "Check-up"
}
```

---

#### GET Patient Summary
```
GET https://medical-business-api.onrender.com/api/v1/consultations/patient/:patientUserId/summary
```
**Description:** Get consultation summary for a patient  
**Access:** `Doctor, Admin`  
**URL Parameters:** `patientUserId` - Patient's User ID

---

#### GET Patient Appointments
```
GET https://medical-business-api.onrender.com/api/v1/consultations/patient/:patientUserId/appointments
```
**Description:** Get all appointment history for a patient  
**Access:** `Doctor, Admin`  
**URL Parameters:** `patientUserId` - Patient's User ID

---

#### GET Consultation Prescriptions
```
GET https://medical-business-api.onrender.com/api/v1/consultations/:appointmentId/prescriptions
```
**Description:** Get prescriptions for an appointment  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Add Prescription
```
POST https://medical-business-api.onrender.com/api/v1/consultations/:appointmentId/prescription
```
**Description:** Add prescription during consultation  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

**Request Schema:**
```typescript
{
  medications: Array<{
    name: string;
    dosage: string;
    duration: string;
  }>;
  instructions?: string;
}
```

---

#### POST Create Follow-Up
```
POST https://medical-business-api.onrender.com/api/v1/consultations/:appointmentId/create-follow-up
```
**Description:** Create follow-up appointment from saved consultation notes  
**Access:** `Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

### 6.4 Reports

#### GET My Stats (Doctor)
```
GET https://medical-business-api.onrender.com/api/v1/reports/my-stats
```
**Description:** Get current doctor's statistics  
**Access:** `Doctor`

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    total_appointments: number;
    completed: number;
    cancelled: number;
    no_show: number;
    average_rating: number;
    total_patients: number;
  }
}
```

---

#### GET My Appointments (Doctor)
```
GET https://medical-business-api.onrender.com/api/v1/reports/my-appointments
```
**Description:** Get current doctor's appointment history  
**Access:** `Doctor`

---

#### GET My Ratings (Doctor)
```
GET https://medical-business-api.onrender.com/api/v1/reports/my-ratings
```
**Description:** Get current doctor's ratings  
**Access:** `Doctor`

---

#### GET Appointments Report
```
GET https://medical-business-api.onrender.com/api/v1/reports/appointments
```
**Description:** Generate appointment report  
**Access:** `Admin, Doctor`  
**Query Parameters:**
- `start_date` (date): Start date
- `end_date` (date): End date
- `doctor_id` (int): Filter by doctor
- `status` (string): Filter by status

---

#### GET Productivity Report
```
GET https://medical-business-api.onrender.com/api/v1/reports/productivity
```
**Description:** Generate doctor productivity report  
**Access:** `Admin`

---

#### GET Patient Flow Report
```
GET https://medical-business-api.onrender.com/api/v1/reports/patient-flow
```
**Description:** Generate patient flow report  
**Access:** `Admin`

---

#### GET Revenue Report
```
GET https://medical-business-api.onrender.com/api/v1/reports/revenue
```
**Description:** Generate revenue report  
**Access:** `Admin`

---

#### GET Specialty Demand Report
```
GET https://medical-business-api.onrender.com/api/v1/reports/specialty-demand
```
**Description:** Generate specialty demand report  
**Access:** `Admin`

---

#### GET General Stats
```
GET https://medical-business-api.onrender.com/api/v1/reports/general-stats
```
**Description:** Get general statistics for admin dashboard  
**Access:** `Admin`

---

#### GET Doctor Stats
```
GET https://medical-business-api.onrender.com/api/v1/reports/doctor-stats
```
**Description:** Get doctor statistics for admin dashboard  
**Access:** `Admin`

---

#### GET Advanced Stats
```
GET https://medical-business-api.onrender.com/api/v1/reports/advanced-stats
```
**Description:** Get advanced statistics for admin dashboard  
**Access:** `Admin`

---

### 6.5 Billing Calculations

#### GET My Billings (Patient)
```
GET https://medical-business-api.onrender.com/api/v1/billing-calculations/my-billings
```
**Description:** Get current patient's billings  
**Access:** `Patient`

---

#### GET Calculate Billing
```
GET https://medical-business-api.onrender.com/api/v1/billing-calculations/calculate/:appointmentId
```
**Description:** Calculate billing for an appointment  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    appointment_id: number;
    items: Array<{
      description: string;
      amount: number;
    }>;
    subtotal: number;
    tax: number;
    insurance_discount: number;
    total: number;
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "appointment_id": 25,
    "items": [
      { "description": "General Consultation", "amount": 50.00 },
      { "description": "Electrocardiogram", "amount": 75.00 }
    ],
    "subtotal": 125.00,
    "tax": 16.25,
    "insurance_discount": 100.00,
    "total": 41.25
  }
}
```

---

#### POST Generate Billing
```
POST https://medical-business-api.onrender.com/api/v1/billing-calculations/generate/:appointmentId
```
**Description:** Generate billing record from calculation  
**Access:** `Doctor, Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Process Payment
```
POST https://medical-business-api.onrender.com/api/v1/billing-calculations/payment/:billingId
```
**Description:** Process payment for a billing  
**Access:** `Admin`  
**URL Parameters:** `billingId` - Billing ID

**Request Schema:**
```typescript
{
  amount: number;          // Required
  payment_method: string;  // Required
  reference?: string;
}
```

**Example Request:**
```json
{
  "amount": 41.25,
  "payment_method": "card",
  "reference": "REF-123456"
}
```

---

#### POST Apply Insurance Claim
```
POST https://medical-business-api.onrender.com/api/v1/billing-calculations/insurance-claim/:billingId
```
**Description:** Apply insurance claim to billing  
**Access:** `Admin`  
**URL Parameters:** `billingId` - Billing ID

**Request Schema:**
```typescript
{
  insurance_provider_id: number;  // Required
  claim_amount: number;           // Required
}
```

---

#### GET Billing Statistics
```
GET https://medical-business-api.onrender.com/api/v1/billing-calculations/statistics
```
**Description:** Get billing statistics  
**Access:** `Admin`

---

### 6.6 Validations

#### POST Validate Appointment
```
POST https://medical-business-api.onrender.com/api/v1/validations/appointment
```
**Description:** Validate appointment booking data  
**Access:** `Public`

**Request Schema:**
```typescript
{
  doctor_id: number;
  date: string;
  time: string;
}
```

---

#### POST Validate Schedule
```
POST https://medical-business-api.onrender.com/api/v1/validations/schedule
```
**Description:** Validate schedule configuration  
**Access:** `Public`

---

#### POST Validate Medical Record
```
POST https://medical-business-api.onrender.com/api/v1/validations/medical-record
```
**Description:** Validate medical record data  
**Access:** `Public`

---

#### POST Validate Prescription
```
POST https://medical-business-api.onrender.com/api/v1/validations/prescription
```
**Description:** Validate prescription data  
**Access:** `Public`

---

#### GET Validate My Profile
```
GET https://medical-business-api.onrender.com/api/v1/validations/patient-profile/me
```
**Description:** Validate current user's patient profile  
**Access:** `Patient`

---

#### GET Validate Patient Profile
```
GET https://medical-business-api.onrender.com/api/v1/validations/patient-profile/:patientUserId
```
**Description:** Validate patient profile completeness  
**Access:** `Admin, Doctor`  
**URL Parameters:** `patientUserId` - Patient's User ID

---

## 7. External API - External Integrations

---

### 7.1 Authentication

#### GET Google OAuth Redirect
```
GET https://medical-external-api.onrender.com/auth/google
```
**Description:** Redirect to Google OAuth  
**Access:** `Public`

---

#### GET Google OAuth Callback
```
GET https://medical-external-api.onrender.com/auth/google/callback
```
**Description:** Google OAuth callback  
**Access:** `Public`

---

#### POST Register
```
POST https://medical-external-api.onrender.com/auth/register
```
**Description:** Register new user  
**Access:** `Public`

**Request Schema:**
```typescript
{
  email: string;                  // Required
  password: string;               // Required - Min 8 characters
  password_confirmation: string;  // Required - Must match password
  first_name: string;             // Required
  last_name: string;              // Required
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
  }
}
```

**Example Request:**
```json
{
  "email": "newuser@email.com",
  "password": "password123",
  "password_confirmation": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": 100,
    "email": "newuser@email.com",
    "role": "patient"
  }
}
```

---

#### POST Login
```
POST https://medical-external-api.onrender.com/auth/login
```
**Description:** User login  
**Access:** `Public`

**Request Schema:**
```typescript
{
  email: string;     // Required
  password: string;  // Required
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  }
}
```

---

#### POST Request Password Reset
```
POST https://medical-external-api.onrender.com/auth/password-reset/request
```
**Description:** Request password reset  
**Access:** `Public`

**Request Schema:**
```typescript
{
  email: string;  // Required
}
```

---

#### POST Confirm Password Reset
```
POST https://medical-external-api.onrender.com/auth/password-reset/confirm
```
**Description:** Reset password with token  
**Access:** `Public`

**Request Schema:**
```typescript
{
  token: string;        // Required
  new_password: string; // Required
}
```

---

#### POST Change Password
```
POST https://medical-external-api.onrender.com/auth/change-password
```
**Description:** Change password (authenticated)  
**Access:** `Authenticated`

**Request Schema:**
```typescript
{
  current_password: string;  // Required
  new_password: string;      // Required
}
```

---

#### POST Refresh Token
```
POST https://medical-external-api.onrender.com/auth/refresh-token
```
**Description:** Refresh JWT token  
**Access:** `Public`

**Request Schema:**
```typescript
{
  refresh_token: string;  // Required
}
```

---

#### POST Logout
```
POST https://medical-external-api.onrender.com/auth/logout
```
**Description:** User logout  
**Access:** `Authenticated`

---

#### GET Current User
```
GET https://medical-external-api.onrender.com/auth/me
```
**Description:** Get current authenticated user  
**Access:** `Authenticated`

---

### 7.2 Notifications

#### GET User Notifications
```
GET https://medical-external-api.onrender.com/notifications/user
```
**Description:** Get notifications for the authenticated user  
**Access:** `Authenticated`

---

#### GET Unread Count
```
GET https://medical-external-api.onrender.com/notifications/user/unread-count
```
**Description:** Get unread notification count  
**Access:** `Authenticated`

---

#### PUT Mark as Read
```
PUT https://medical-external-api.onrender.com/notifications/:id/read
```
**Description:** Mark a notification as read  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Notification ID

---

#### DELETE Notification
```
DELETE https://medical-external-api.onrender.com/notifications/:id
```
**Description:** Delete a notification  
**Access:** `Authenticated`  
**URL Parameters:** `id` - Notification ID

---

#### GET Broadcasts
```
GET https://medical-external-api.onrender.com/notifications/broadcasts
```
**Description:** Get all broadcast notifications  
**Access:** `Admin`

---

#### POST Send Appointment Confirmation
```
POST https://medical-external-api.onrender.com/notifications/appointment-confirmation
```
**Description:** Send appointment confirmation email  
**Access:** `Admin, Doctor`

**Request Schema:**
```typescript
{
  appointment_id: number;  // Required
}
```

---

#### POST Send Appointment Cancellation
```
POST https://medical-external-api.onrender.com/notifications/appointment-cancellation
```
**Description:** Send appointment cancellation email  
**Access:** `Admin, Doctor`

---

#### POST Send Prescription Notification
```
POST https://medical-external-api.onrender.com/notifications/prescription
```
**Description:** Send prescription notification email  
**Access:** `Admin, Doctor`

---

#### POST Send Custom Notification
```
POST https://medical-external-api.onrender.com/notifications/custom
```
**Description:** Send custom notification email AND save to database  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  user_id: number;     // Required
  title: string;       // Required
  message: string;     // Required
  send_email: boolean; // Required
}
```

**Example Request:**
```json
{
  "user_id": 5,
  "title": "Important Reminder",
  "message": "Don't forget your appointment tomorrow",
  "send_email": true
}
```

---

### 7.3 QR Codes

#### GET Verify Prescription by Token
```
GET https://medical-external-api.onrender.com/qr-codes/verify-prescription/:token
```
**Description:** Verify prescription by QR token (public endpoint for pharmacies/patients)  
**Access:** `Public`  
**URL Parameters:** `token` - QR Token

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    prescription: {
      id: number;
      patient_name: string;
      doctor_name: string;
      medications: Array<{
        name: string;
        dosage: string;
        duration: string;
      }>;
      valid_until: string;
      is_active: boolean;
    }
  }
}
```

---

#### POST Generate Prescription QR
```
POST https://medical-external-api.onrender.com/qr-codes/prescription/:prescriptionId
```
**Description:** Generate QR code for a prescription  
**Access:** `Admin, Doctor`  
**URL Parameters:** `prescriptionId` - Prescription ID

---

#### POST Generate Appointment QR
```
POST https://medical-external-api.onrender.com/qr-codes/appointment/:appointmentId
```
**Description:** Generate QR code for an appointment  
**Access:** `Admin, Doctor, Patient`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### POST Generate Patient Check-in QR
```
POST https://medical-external-api.onrender.com/qr-codes/patient/check-in
```
**Description:** Generate patient check-in QR  
**Access:** `Patient`

---

#### POST Verify QR Code
```
POST https://medical-external-api.onrender.com/qr-codes/verify
```
**Description:** Verify QR code content  
**Access:** `Admin, Doctor`

---

### 7.4 Reminders

#### POST Process Reminders
```
POST https://medical-external-api.onrender.com/reminders/process
```
**Description:** Process all due reminders  
**Access:** `Admin`

---

#### POST Create Reminder
```
POST https://medical-external-api.onrender.com/reminders/create
```
**Description:** Create a new reminder  
**Access:** `Admin`

**Request Schema:**
```typescript
{
  appointment_id: number;   // Required
  reminder_time: string;    // Required - ISO 8601
  type: "email" | "sms";    // Required
}
```

**Example Request:**
```json
{
  "appointment_id": 25,
  "reminder_time": "2025-06-19T18:00:00Z",
  "type": "email"
}
```

---

#### GET Pending Reminders Count
```
GET https://medical-external-api.onrender.com/reminders/pending/count
```
**Description:** Get count of pending reminders  
**Access:** `Admin`

---

#### GET Due Reminders
```
GET https://medical-external-api.onrender.com/reminders/due/:hours
```
**Description:** Get appointments due for reminder in X hours  
**Access:** `Admin`  
**URL Parameters:** `hours` - Number of hours

---

#### GET Reminder History by Appointment
```
GET https://medical-external-api.onrender.com/reminders/appointment/:appointmentId
```
**Description:** Get reminder history for an appointment  
**Access:** `Admin, Doctor`  
**URL Parameters:** `appointmentId` - Appointment ID

---

#### DELETE Cancel Reminders
```
DELETE https://medical-external-api.onrender.com/reminders/appointment/:appointmentId
```
**Description:** Cancel pending reminders for an appointment  
**Access:** `Admin`  
**URL Parameters:** `appointmentId` - Appointment ID

---

## 8. Data Models

### User
```typescript
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  is_active: boolean;
  is_email_verified: boolean;
  phone?: string;
  avatar_url?: string;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}
```

### Patient
```typescript
interface Patient {
  id: number;
  user_id: number;
  date_of_birth: string;  // YYYY-MM-DD
  gender: "male" | "female" | "other";
  phone: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string[];
  insurance_provider_id?: number;
  policy_number?: string;
}
```

### Doctor
```typescript
interface Doctor {
  id: number;
  user_id: number;
  specialty_id: number;
  license_number: string;
  consultation_fee: number;
  bio?: string;
  average_rating?: number;
  total_ratings?: number;
  is_active: boolean;
}
```

### Appointment
```typescript
interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  specialty_id: number;
  consultation_room_id?: number;
  appointment_date: string;  // YYYY-MM-DD
  start_time: string;        // HH:MM
  end_time: string;          // HH:MM
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  reason?: string;
  notes?: string;
  confirmation_code: string;
  check_in_time?: string;
  is_follow_up: boolean;
  parent_appointment_id?: number;
  created_at: string;
}
```

### Schedule
```typescript
interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  is_active: boolean;
}
```

### Prescription
```typescript
interface Prescription {
  id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  medications: Medication[];
  instructions?: string;
  valid_until: string;
  is_active: boolean;
  qr_code?: string;
  qr_token?: string;
}

interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instructions?: string;
}
```

### Billing
```typescript
interface Billing {
  id: number;
  appointment_id: number;
  patient_id: number;
  subtotal: number;
  tax: number;
  discount: number;
  insurance_covered: number;
  total: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  payment_method?: string;
  payment_date?: string;
  notes?: string;
}
```

---

## 9. Usage Examples

### Complete Appointment Booking Flow

```javascript
// 1. Get available doctors
const response = await fetch('https://medical-crud-api.onrender.com/api/v1/doctors');
const doctors = await response.json();

// 2. Select doctor and check availability
const doctorId = 1;
const date = '2025-06-20';
const availability = await fetch(
  `https://medical-business-api.onrender.com/api/v1/availability/doctor/${doctorId}/date/${date}`
);
const slots = await availability.json();

// 3. Book appointment
const booking = await fetch('https://medical-business-api.onrender.com/api/v1/scheduling/book', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    doctor_id: 1,
    date: '2025-06-20',
    time: '10:00',
    reason: 'General consultation'
  })
});
const appointment = await booking.json();

// 4. Appointment is created with status "pending"
// Admin or doctor can confirm it
```

### Medical Consultation Flow (Doctor)

```javascript
// 1. Start consultation
await fetch(`https://medical-business-api.onrender.com/api/v1/consultations/start/${appointmentId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${doctorToken}` }
});

// 2. Get patient history
const summary = await fetch(
  `https://medical-business-api.onrender.com/api/v1/consultations/patient/${patientUserId}/summary`,
  { headers: { 'Authorization': `Bearer ${doctorToken}` }}
);

// 3. Complete consultation with notes
await fetch(`https://medical-business-api.onrender.com/api/v1/consultations/complete/${appointmentId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${doctorToken}`
  },
  body: JSON.stringify({
    subjective: 'Patient reports...',
    objective: 'Physical examination...',
    assessment: 'Preliminary diagnosis...',
    plan: 'Recommended treatment...',
    follow_up_date: '2025-07-20'
  })
});

// 4. Add prescription
await fetch(`https://medical-business-api.onrender.com/api/v1/consultations/${appointmentId}/prescription`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${doctorToken}`
  },
  body: JSON.stringify({
    medications: [
      { name: 'Medication X', dosage: '1 tablet every 8 hours', duration: '7 days' }
    ]
  })
});
```

### Generate Invoice

```javascript
// 1. Calculate cost
const calculation = await fetch(
  `https://medical-business-api.onrender.com/api/v1/billing-calculations/calculate/${appointmentId}`,
  { headers: { 'Authorization': `Bearer ${adminToken}` }}
);

// 2. Generate invoice
await fetch(
  `https://medical-business-api.onrender.com/api/v1/billing-calculations/generate/${appointmentId}`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }
);

// 3. Process payment
await fetch(
  `https://medical-business-api.onrender.com/api/v1/billing-calculations/payment/${billingId}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      amount: 41.25,
      payment_method: 'card'
    })
  }
);
```

---

## 📞 Support

For API inquiries:
- **Email:** support@medicalappointment.com
- **Documentation:** This file
- **Repository:** GitHub (internal)

---

**© 2026 Medical Appointment System - API Documentation v2.0**
