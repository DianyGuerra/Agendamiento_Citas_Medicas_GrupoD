# Software Requirements Specification (SRS)

## Medical Appointment Management System - San Miguel Clinic

**Document Version:** 1.0  
**Date:** February 2026  
**Standard:** IEEE 830-1998  
**Status:** Approved

---

## Document Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 2026 | Development Team | Initial SRS document |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
   - 1.4 [References](#14-references)
   - 1.5 [Overview](#15-overview)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [Assumptions and Dependencies](#26-assumptions-and-dependencies)
3. [Specific Requirements](#3-specific-requirements)
   - 3.1 [Functional Requirements](#31-functional-requirements)
   - 3.2 [External Interface Requirements](#32-external-interface-requirements)
   - 3.3 [Performance Requirements](#33-performance-requirements)
   - 3.4 [Security and Privacy Requirements](#34-security-and-privacy-requirements)
   - 3.5 [Reliability and Availability Requirements](#35-reliability-and-availability-requirements)
   - 3.6 [Maintainability Requirements](#36-maintainability-requirements)
   - 3.7 [Portability Requirements](#37-portability-requirements)
   - 3.8 [Usability Requirements](#38-usability-requirements)
   - 3.9 [Accessibility Requirements](#39-accessibility-requirements)
4. [Appendices](#4-appendices)
   - A. [Traceability Matrix](#appendix-a-traceability-matrix)
   - B. [Data Dictionary](#appendix-b-data-dictionary)
   - C. [API Endpoint Summary](#appendix-c-api-endpoint-summary)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete description of all functional and non-functional requirements for the Medical Appointment Management System for San Miguel Clinic. The intended audience includes:

- **Development Team:** To understand and implement system requirements
- **Quality Assurance Team:** To create test plans and verify system compliance
- **Project Managers:** To track project scope and deliverables
- **Stakeholders:** To validate that the system meets business needs
- **System Administrators:** To understand operational requirements

This document serves as a binding agreement between stakeholders and the development team regarding system functionality.

### 1.2 Scope

#### 1.2.1 Product Name
Medical Appointment Management System (MAMS)

#### 1.2.2 Product Description
The Medical Appointment Management System is a web-based healthcare application designed to streamline the operations of San Miguel Clinic. The system provides comprehensive functionality for managing medical appointments, clinical records, billing, and quality assurance.

#### 1.2.3 Major Functions
- **Patient Registration and Authentication:** Secure user registration with Ecuadorian ID validation and multiple authentication methods
- **Appointment Scheduling:** Complete appointment lifecycle management including booking, confirmation, and cancellation
- **Medical Consultation:** Digital consultation workflow with SOAP documentation, vital signs recording, and prescriptions
- **Billing and Insurance:** Invoice generation, payment processing, and insurance coverage calculation
- **Quality Management:** Patient satisfaction surveys and doctor rating systems
- **Administrative Dashboards:** Role-specific dashboards with analytics and reporting
- **Security and Audit:** Comprehensive logging and security monitoring

#### 1.2.4 Benefits
- Reduced appointment scheduling time by 70%
- Elimination of paper-based medical records
- Improved patient satisfaction through digital convenience
- Enhanced operational visibility for clinic administration
- Compliance with healthcare data regulations

#### 1.2.5 Objectives
1. Digitize all clinic operations within 6 weeks
2. Support 100+ concurrent users
3. Achieve 99.5% system availability
4. Ensure HIPAA-aligned data handling practices

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface |
| **BMI** | Body Mass Index |
| **CORS** | Cross-Origin Resource Sharing |
| **CRUD** | Create, Read, Update, Delete operations |
| **ICD-10** | International Classification of Diseases, 10th Revision |
| **JWT** | JSON Web Token |
| **MAMS** | Medical Appointment Management System |
| **OAuth** | Open Authorization standard |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SOAP** | Subjective, Objective, Assessment, Plan (medical documentation format) |
| **SPA** | Single Page Application |
| **TLS** | Transport Layer Security |
| **UI** | User Interface |
| **UX** | User Experience |

#### Domain-Specific Terms

| Term | Definition |
|------|------------|
| **Appointment Slot** | A discrete time period available for booking an appointment |
| **Check-in** | The process of registering a patient's arrival at the clinic |
| **Consultation Note** | Medical documentation created during a patient visit |
| **Copay** | The portion of medical costs paid by the patient after insurance |
| **No-show** | A patient who fails to attend a scheduled appointment |
| **Prescription Renewal** | Request to extend an existing prescription without a full consultation |
| **Schedule Exception** | A deviation from a doctor's regular schedule (vacation, holiday, etc.) |

### 1.4 References

| Document | Description |
|----------|-------------|
| PRODUCT_BACKLOG_EN.md | Product backlog with features, epics, and user stories |
| API_DOCUMENTATION.md | Complete API interface documentation |
| UML_CLASS_DIAGRAM.md | System class diagram |
| UML_USE_CASE_DIAGRAM.md | Use case diagram with actor interactions |
| CLOUD_ARCHITECTURE.md | Production deployment architecture |
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications |

### 1.5 Overview

This SRS document is organized into four main sections:

- **Section 1 (Introduction):** Provides context, scope, and definitions
- **Section 2 (Overall Description):** Describes the product perspective, functions, and constraints
- **Section 3 (Specific Requirements):** Details all functional and non-functional requirements
- **Section 4 (Appendices):** Includes traceability matrix, data dictionary, and supplementary information

---

## 2. Overall Description

### 2.1 Product Perspective

#### 2.1.1 System Context

The Medical Appointment Management System is a standalone web application that integrates with external services for authentication and notifications. It is not a replacement for any existing system but rather a new implementation for digital clinic operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐    ┌───────────┐    ┌───────────┐               │
│  │  Google   │    │  SendGrid │    │  Supabase │               │
│  │  OAuth    │    │  Email    │    │ PostgreSQL│               │
│  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘               │
│        │                │                │                      │
│        └────────────────┼────────────────┘                      │
│                         │                                       │
│              ┌──────────▼──────────┐                           │
│              │                     │                           │
│              │   MAMS Application  │                           │
│              │                     │                           │
│              └──────────┬──────────┘                           │
│                         │                                       │
│        ┌────────────────┼────────────────┐                      │
│        │                │                │                      │
│  ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐               │
│  │  Patient  │    │  Doctor   │    │   Admin   │               │
│  │  Browser  │    │  Browser  │    │  Browser  │               │
│  └───────────┘    └───────────┘    └───────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 System Interfaces

| Interface | Type | Description |
|-----------|------|-------------|
| Google OAuth 2.0 | External Authentication | Social login for user convenience |
| SendGrid SMTP | External Email | Transactional email delivery |
| Supabase PostgreSQL | Database | Managed database hosting |
| Web Browsers | User Interface | Primary user interaction channel |

#### 2.1.3 Architecture Overview

The system follows a microservices architecture with three independent APIs:

| API Service | Port | Responsibility |
|-------------|------|----------------|
| CRUD API | 3001 | Basic data operations (Create, Read, Update, Delete) |
| Business API | 3002 | Complex business logic (availability, scheduling, reports) |
| External API | 3003 | External integrations (authentication, email, QR codes) |

### 2.2 Product Functions

The system provides the following major functional areas:

#### 2.2.1 Feature 0: System Foundation & Core Infrastructure
- User registration with Ecuadorian ID validation
- Multi-method authentication (email/password, Google OAuth)
- Role-based authorization (patient, doctor, admin)
- Core entity management (users, specialties, rooms, doctors, patients)
- Role-specific navigation layouts

#### 2.2.2 Feature 1: Appointment Scheduling & Availability Management
- Doctor schedule configuration
- Schedule exception management
- Real-time availability calculation
- Patient appointment booking wizard
- Administrative calendar management
- Appointment notifications

#### 2.2.3 Feature 2: Medical Consultation & Clinical Records
- Patient medical history management
- Vital signs recording with alerts
- SOAP clinical documentation
- Prescription management with QR verification
- Laboratory test ordering and results

#### 2.2.4 Feature 3: Billing, Insurance & Quality Management
- Medical services catalog
- Invoice creation and payment processing
- Insurance coverage calculation
- Satisfaction surveys
- Doctor rating system

#### 2.2.5 Feature 4: Dashboards, Reports & System Security
- Role-specific dashboards
- Advanced analytics and metrics
- Appointment and billing reports
- Notification center
- Audit logging and security monitoring

### 2.3 User Classes and Characteristics

#### 2.3.1 Patient

| Attribute | Description |
|-----------|-------------|
| **Description** | Individuals seeking medical services at the clinic |
| **Technical Expertise** | Low to moderate; familiar with basic web applications |
| **Frequency of Use** | Occasional (weekly to monthly) |
| **Primary Functions** | Book appointments, view medical records, manage prescriptions |
| **Accessibility Needs** | High; requires clear navigation and mobile support |
| **Security Level** | Standard authentication; access to own data only |

#### 2.3.2 Doctor

| Attribute | Description |
|-----------|-------------|
| **Description** | Licensed medical professionals providing clinical services |
| **Technical Expertise** | Moderate; comfortable with clinical software |
| **Frequency of Use** | Daily; intensive use during clinic hours |
| **Primary Functions** | Manage schedule, conduct consultations, issue prescriptions |
| **Accessibility Needs** | Tablet optimization for use during consultations |
| **Security Level** | Elevated; access to patient medical records |

#### 2.3.3 Administrator

| Attribute | Description |
|-----------|-------------|
| **Description** | Clinic staff responsible for operations management |
| **Technical Expertise** | Moderate to high; experienced with administrative systems |
| **Frequency of Use** | Daily; continuous use during business hours |
| **Primary Functions** | Manage users, oversee appointments, generate reports, handle billing |
| **Accessibility Needs** | Desktop optimization; complex data entry |
| **Security Level** | Highest; full system access including audit logs |

#### 2.3.4 Public Visitor

| Attribute | Description |
|-----------|-------------|
| **Description** | Unauthenticated users browsing clinic information |
| **Technical Expertise** | Variable |
| **Frequency of Use** | One-time or occasional |
| **Primary Functions** | View clinic information, register as patient, verify prescriptions |
| **Accessibility Needs** | SEO-optimized content, fast loading |
| **Security Level** | None; public information only |

### 2.4 Operating Environment

#### 2.4.1 Client Environment

| Component | Requirement |
|-----------|-------------|
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **JavaScript** | ES6+ required |
| **Screen Resolution** | Minimum 320px width (mobile responsive) |
| **Internet Connection** | Broadband recommended; 3G minimum |
| **Cookies** | Required for session management |
| **LocalStorage** | Required for token storage |

#### 2.4.2 Server Environment

| Component | Specification |
|-----------|---------------|
| **Runtime** | Node.js (Latest LTS) |
| **Framework** | Express.js 5.x |
| **Database** | PostgreSQL 15+ (Supabase managed) |
| **Hosting** | Render.com (Backend), Vercel (Frontend) |
| **SSL/TLS** | TLS 1.2+ required |

#### 2.4.3 Third-Party Services

| Service | Purpose | Required |
|---------|---------|----------|
| Supabase | Database hosting | Yes |
| SendGrid | Email delivery | Yes |
| Google OAuth | Social authentication | Optional |
| Vercel | Frontend hosting | Yes |
| Render.com | Backend hosting | Yes |

### 2.5 Design and Implementation Constraints

#### 2.5.1 Regulatory Constraints

| Constraint | Description |
|------------|-------------|
| **Data Privacy** | System shall comply with healthcare data privacy best practices |
| **Ecuadorian ID Validation** | Registration shall validate 10-digit Ecuadorian cédula format |
| **Age Verification** | Patients shall be 18 years or older to self-register |
| **Medical Records Retention** | Records shall not be permanently deleted (soft delete only) |

#### 2.5.2 Technical Constraints

| Constraint | Description |
|------------|-------------|
| **RESTful API** | All APIs shall follow REST architectural constraints |
| **Stateless Authentication** | JWT tokens shall be used; no server-side sessions |
| **CORS Policy** | Backend shall implement whitelist-based CORS |
| **Soft Delete** | Data deletion shall mark records inactive, not remove them |
| **Microservices Isolation** | Each API service shall be independently deployable |

#### 2.5.3 Business Constraints

| Constraint | Description |
|------------|-------------|
| **Timeline** | System shall be delivered within 6 weeks |
| **Team Size** | Development limited to 3 developers |
| **Budget** | Use free/low-cost hosting tiers where possible |
| **Language** | UI shall support Spanish (primary) and English |

### 2.6 Assumptions and Dependencies

#### 2.6.1 Assumptions

| ID | Assumption |
|----|------------|
| A-01 | Users have access to modern web browsers with JavaScript enabled |
| A-02 | Users have reliable internet connectivity |
| A-03 | Clinic operates Monday-Saturday during standard business hours |
| A-04 | Standard appointment duration is 30 minutes unless specified |
| A-05 | All monetary values are in US Dollars |
| A-06 | Email is the primary communication channel with patients |
| A-07 | Doctors have basic computer literacy |
| A-08 | Clinic has designated administrative staff |

#### 2.6.2 Dependencies

| ID | Dependency | Impact if Unavailable |
|----|------------|----------------------|
| D-01 | Supabase service availability | Complete system outage |
| D-02 | SendGrid email service | Email notifications unavailable |
| D-03 | Google OAuth service | Social login unavailable |
| D-04 | Vercel hosting | Frontend inaccessible |
| D-05 | Render.com hosting | Backend APIs unavailable |
| D-06 | Internet connectivity | System inaccessible |

---

## 3. Specific Requirements

### 3.1 Functional Requirements

---

#### 3.1.1 Authentication & Authorization (Feature 0, Epic 0.1)

---

##### FR-001: Patient Registration

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow visitors to register as patients with validated personal information |
| **Priority** | High |
| **Trigger** | User clicks "Register" button on public page |

**Preconditions:**
- User is not authenticated
- User has a valid email address

**Postconditions:**
- New user account created with "patient" role
- User can log in with registered credentials

**Main Flow:**
1. User navigates to registration page
2. System displays registration form
3. User enters: first name, last name, Ecuadorian ID (cédula), date of birth, phone, email, password, password confirmation
4. User accepts terms and conditions
5. System validates all fields:
   - Ecuadorian ID: 10-digit validation algorithm
   - Age: 18+ years based on date of birth
   - Email: Valid format and unique in system
   - Password: Minimum 8 characters, mixed case, numbers
   - Password confirmation: Matches password
6. System creates user account with patient role
7. System displays success message
8. System redirects user to login page

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-001-1 | Ecuadorian ID invalid | Display "Invalid ID number" error |
| AF-001-2 | User under 18 | Display "Must be 18 or older to register" error |
| AF-001-3 | Email already registered | Display "Email already in use" error |
| AF-001-4 | Password too weak | Display password requirements |
| AF-001-5 | Passwords don't match | Display "Passwords do not match" error |

**Error Handling:**
- Server error: Display generic error message, log details
- Network timeout: Allow retry with preserved form data

---

##### FR-002: User Login with Credentials

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall authenticate users using email and password credentials |
| **Priority** | High |
| **Trigger** | User submits login form |

**Preconditions:**
- User has registered account
- User account is active

**Postconditions:**
- User is authenticated
- JWT token stored in localStorage
- User redirected to role-appropriate dashboard

**Main Flow:**
1. User navigates to login page
2. System displays login form
3. User enters email and password
4. User optionally checks "Remember me"
5. System validates credentials against database (bcrypt)
6. System generates JWT token:
   - Standard: 24-hour expiration
   - Remember me: 7-day expiration
7. System stores token and user info in localStorage
8. System redirects based on role:
   - Patient → Patient Dashboard
   - Doctor → Doctor Dashboard
   - Admin → Admin Dashboard

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-002-1 | Invalid credentials | Display "Invalid email or password" (do not specify which) |
| AF-002-2 | Account inactive | Display "Account is deactivated. Contact support." |
| AF-002-3 | Account locked | Display "Account locked. Try again in 15 minutes." |

**Error Handling:**
- Track failed login attempts
- Lock account after 5 failed attempts for 15 minutes
- Log all login attempts for security audit

---

##### FR-003: Google OAuth Authentication

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow users to authenticate using Google OAuth 2.0 |
| **Priority** | Medium |
| **Trigger** | User clicks "Continue with Google" button |

**Preconditions:**
- User has a Google account
- Google OAuth service is available

**Postconditions:**
- User is authenticated
- User account linked to Google ID
- JWT token stored in localStorage

**Main Flow:**
1. User clicks "Continue with Google"
2. System redirects to Google OAuth consent screen
3. User grants permission to share profile information
4. Google redirects back with authorization code
5. System exchanges code for user profile
6. System checks if Google ID exists in database:
   - If exists: Log in existing user
   - If not exists: Create new patient account
7. For new users, system requests additional data (cédula, phone)
8. System generates JWT token
9. System redirects to appropriate dashboard

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-003-1 | User denies Google permission | Return to login page with message |
| AF-003-2 | Google email matches existing account | Link Google ID to existing account |
| AF-003-3 | OAuth service error | Display "Google login unavailable" error |

---

##### FR-004: Password Recovery

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow users to reset forgotten passwords via email |
| **Priority** | High |
| **Trigger** | User clicks "Forgot password" link |

**Preconditions:**
- User has registered account
- User has access to registered email

**Postconditions:**
- User password is updated
- Previous password invalidated
- User can log in with new password

**Main Flow:**
1. User clicks "Forgot password" on login page
2. System displays email input form
3. User enters registered email
4. System generates secure reset token (valid 1 hour)
5. System sends email with reset link
6. User clicks link in email
7. System validates token
8. System displays new password form
9. User enters and confirms new password
10. System updates password (bcrypt hashed)
11. System invalidates reset token
12. System displays success message
13. System redirects to login page

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-004-1 | Email not found | Display success message anyway (security) |
| AF-004-2 | Token expired | Display "Link expired. Request new reset." |
| AF-004-3 | Token already used | Display "Link already used. Request new reset." |
| AF-004-4 | Rate limit exceeded | Display "Too many requests. Try again later." |

**Error Handling:**
- Rate limiting: Maximum 3 reset requests per hour per email
- Store token hash, not plain token

---

##### FR-005: Session Management and Logout

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.5

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide secure session management and logout functionality |
| **Priority** | High |
| **Trigger** | User clicks logout or token expires |

**Preconditions:**
- User is authenticated

**Postconditions:**
- User session terminated
- Tokens removed from localStorage
- User redirected to login page

**Main Flow:**
1. User clicks "Logout" button in navigation
2. System displays confirmation dialog
3. User confirms logout
4. System clears localStorage (token, user data)
5. System redirects to login page

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-005-1 | Token expires | Display session timeout warning 5 min before |
| AF-005-2 | User ignores warning | Auto-logout and redirect to login |
| AF-005-3 | Logout all devices | Invalidate all tokens for user |

---

##### FR-006: Role-Based Authorization

**Trace:** Feature 0 → Epic 0.1 → User Story 0.1.6

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall protect routes and resources based on user roles |
| **Priority** | High |
| **Trigger** | Every authenticated API request |

**Preconditions:**
- Request includes Authorization header

**Postconditions:**
- Authorized: Request processed
- Unauthorized: Request rejected with appropriate error

**Main Flow:**
1. System extracts JWT from Authorization header
2. System verifies token signature and expiration
3. System fetches user from database
4. System validates user is active
5. System checks user role against required role(s)
6. System attaches user object to request
7. Request proceeds to controller

**Alternate Flows:**

| Alt Flow | Condition | Action |
|----------|-----------|--------|
| AF-006-1 | Missing token | Return 401 Unauthorized |
| AF-006-2 | Invalid token | Return 401 Unauthorized |
| AF-006-3 | Expired token | Return 401 with "TOKEN_EXPIRED" code |
| AF-006-4 | Inactive user | Return 401 with "USER_INACTIVE" code |
| AF-006-5 | Wrong role | Return 403 Forbidden |

---

#### 3.1.2 Core Entity Management (Feature 0, Epic 0.2)

---

##### FR-007: User Management (Admin)

**Trace:** Feature 0 → Epic 0.2 → User Story 0.2.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage all system users |
| **Priority** | High |
| **Trigger** | Admin accesses user management module |

**Preconditions:**
- User is authenticated as administrator

**Postconditions:**
- User records created/updated/deactivated as specified

**Main Flow:**
1. Admin navigates to User Management
2. System displays paginated user list (20 per page)
3. Admin can:
   - Search by name, email, or ID
   - Filter by role and status
   - Create new user with assigned role
   - Edit user information
   - Activate/deactivate user
   - Reset user password
   - View last access date

**Business Rules:**
- Admin cannot deactivate their own account
- Soft delete only (is_active = false)
- Password reset sends email notification
- All changes logged in audit trail

---

##### FR-008: Medical Specialty Management

**Trace:** Feature 0 → Epic 0.2 → User Story 0.2.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage medical specialties |
| **Priority** | High |
| **Trigger** | Admin accesses specialty management |

**Preconditions:**
- User is authenticated as administrator

**Postconditions:**
- Specialty records created/updated as specified

**Main Flow:**
1. Admin navigates to Specialty Management
2. System displays specialty list with status
3. Admin can:
   - Create specialty (name, description, icon, default duration)
   - Edit specialty details
   - Activate/deactivate specialty
   - View doctor count per specialty

**Business Rules:**
- Cannot deactivate specialty with active assigned doctors
- Default consultation duration: 30 minutes
- Duration affects appointment slot generation

---

##### FR-009: Consultation Room Management

**Trace:** Feature 0 → Epic 0.2 → User Story 0.2.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage consultation rooms |
| **Priority** | Medium |
| **Trigger** | Admin accesses room management |

**Preconditions:**
- User is authenticated as administrator

**Postconditions:**
- Room records created/updated as specified

**Main Flow:**
1. Admin navigates to Room Management
2. System displays room list with availability status
3. Admin can:
   - Create room (name, number, floor, equipment)
   - Edit room information
   - Mark as available/unavailable/maintenance
   - View room schedule

---

##### FR-010: Doctor Management

**Trace:** Feature 0 → Epic 0.2 → User Story 0.2.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage doctor profiles |
| **Priority** | High |
| **Trigger** | Admin accesses doctor management |

**Preconditions:**
- User is authenticated as administrator

**Postconditions:**
- Doctor records created/updated as specified

**Main Flow:**
1. Admin navigates to Doctor Management
2. System displays doctor list with photos and specialties
3. Admin can:
   - Create doctor with user account
   - Assign specialty (primary required)
   - Edit doctor information
   - Upload profile photo
   - Activate/deactivate doctor
   - View doctor statistics

**Business Rules:**
- Doctor creation creates associated user account
- License number must be unique
- Cannot deactivate if future appointments exist

---

##### FR-011: Patient Management

**Trace:** Feature 0 → Epic 0.2 → User Story 0.2.5

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage patient records |
| **Priority** | High |
| **Trigger** | Admin accesses patient management |

**Preconditions:**
- User is authenticated as administrator

**Postconditions:**
- Patient records updated as specified

**Main Flow:**
1. Admin navigates to Patient Management
2. System displays patient list with search
3. Admin can:
   - Search by name or ID
   - View patient profile
   - Edit patient information
   - View appointment history
   - Export patient list to CSV

**Business Rules:**
- All patient data access logged
- Export includes configurable fields
- Respect data privacy regulations

---

#### 3.1.3 Navigation & Layouts (Feature 0, Epic 0.3)

---

##### FR-012: Administrator Layout

**Trace:** Feature 0 → Epic 0.3 → User Story 0.3.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide an organized navigation layout for administrators |
| **Priority** | High |

**Requirements:**
- Sidebar with sections: Main, Clinical Management, Patients, Administration, System
- Visual indicator of active module
- Header with user name and current module
- Responsive design (collapsible sidebar on mobile)
- Breadcrumb navigation
- Quick search across modules

---

##### FR-013: Doctor Layout

**Trace:** Feature 0 → Epic 0.3 → User Story 0.3.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide an intuitive navigation layout for doctors |
| **Priority** | High |

**Requirements:**
- Sidebar with: Dashboard, Appointments, Patients, Prescriptions, Laboratory, Schedule, Notifications, Profile
- Notification badge with count
- Quick access to start next consultation
- Today's appointment count in header
- Mobile-optimized for tablet use

---

##### FR-014: Patient Layout

**Trace:** Feature 0 → Epic 0.3 → User Story 0.3.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a simple navigation layout for patients |
| **Priority** | High |

**Requirements:**
- Sidebar with: Dashboard, Appointments, Medical History, Lab Results, Prescriptions, Billing, Notifications, Profile
- Quick action button to book appointment
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance

---

##### FR-015: Public Landing Page

**Trace:** Feature 0 → Epic 0.3 → User Story 0.3.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a public landing page with clinic information |
| **Priority** | Medium |

**Requirements:**
- Hero section with clinic branding
- Services section with specialties
- Doctor showcase
- Clinic information (address, hours, contact)
- Registration and login buttons
- SEO-optimized structure

---

#### 3.1.4 Schedule Configuration (Feature 1, Epic 1.1)

---

##### FR-016: Weekly Schedule Setup

**Trace:** Feature 1 → Epic 1.1 → User Story 1.1.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to configure their weekly availability schedule |
| **Priority** | High |
| **Trigger** | Doctor accesses schedule configuration |

**Preconditions:**
- User is authenticated as doctor

**Postconditions:**
- Schedule saved and active
- Availability calculation uses new schedule

**Main Flow:**
1. Doctor navigates to Schedule Setup
2. System displays weekly grid interface
3. Doctor adds availability blocks per day:
   - Day of week
   - Start time
   - End time
   - Appointment duration (or specialty default)
4. Doctor can add multiple blocks per day (morning/afternoon)
5. System validates no overlapping blocks
6. System shows preview of generated slots
7. Doctor saves and activates schedule

**Business Rules:**
- Default appointment duration: 30 minutes
- Blocks cannot overlap within same day
- Schedule effective immediately upon save

---

##### FR-017: Schedule Exception Management

**Trace:** Feature 1 → Epic 1.1 → User Story 1.1.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to manage schedule exceptions |
| **Priority** | High |
| **Trigger** | Doctor creates schedule exception |

**Preconditions:**
- User is authenticated as doctor
- Doctor has active schedule

**Postconditions:**
- Exception recorded
- Affected appointments notified

**Main Flow:**
1. Doctor navigates to Exception Management
2. Doctor creates exception:
   - Date or date range
   - Type: vacation, holiday, training, emergency, personal
   - Full day or partial (with times)
   - Reason (optional)
3. System identifies affected appointments
4. System notifies affected patients
5. Exception saved and visible in calendar

**Business Rules:**
- Exceptions override regular schedule
- Affected patients notified via email
- Exception history tracked for reporting

---

##### FR-018: Doctor Schedule Visibility

**Trace:** Feature 1 → Epic 1.1 → User Story 1.1.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to view their schedule and exceptions |
| **Priority** | Medium |

**Requirements:**
- Calendar view with regular schedule
- Exceptions overlay with color coding
- Week and month view toggles
- Export to PDF or iCal format

---

#### 3.1.5 Availability System (Feature 1, Epic 1.2)

---

##### FR-019: Real-Time Availability Calculation

**Trace:** Feature 1 → Epic 1.2 → User Story 1.2.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall calculate available appointment slots in real-time |
| **Priority** | High |
| **Trigger** | Availability query via API |

**Preconditions:**
- Doctor has active schedule

**Postconditions:**
- Available slots returned accurately

**Main Flow:**
1. Client requests availability for doctor/date
2. System retrieves doctor's regular schedule for day of week
3. System checks for exceptions on requested date
4. System fetches existing appointments for the date
5. System calculates available slots:
   - Start with working hours from schedule
   - Remove times covered by exceptions
   - Remove times with existing appointments
   - Generate slot list at configured intervals
6. System returns available slots

**Performance Requirements:**
- Response time: < 500ms
- Concurrent booking: Prevent double-booking via optimistic locking
- Caching: 5-minute TTL with invalidation on changes

---

#### 3.1.6 Patient Appointment Booking (Feature 1, Epic 1.3)

---

##### FR-020: Appointment Booking Wizard

**Trace:** Feature 1 → Epic 1.3 → User Story 1.3.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a step-by-step appointment booking wizard for patients |
| **Priority** | High |
| **Trigger** | Patient initiates new appointment booking |

**Preconditions:**
- User is authenticated as patient
- Patient profile is complete

**Postconditions:**
- Appointment created with "pending" status
- Confirmation email sent

**Main Flow:**
1. Patient clicks "Book Appointment"
2. **Step 1 - Specialty:** System displays active specialties; patient selects one
3. **Step 2 - Doctor:** System displays doctors in specialty with ratings and next availability; patient selects one
4. **Step 3 - Date:** System displays calendar with available days highlighted; patient selects date
5. **Step 4 - Time:** System displays available slots for selected date; patient selects slot
6. **Step 5 - Reason:** Patient enters reason for visit and optional notes
7. **Step 6 - Confirmation:** System displays appointment summary; patient confirms
8. System creates appointment with unique confirmation code
9. System sends confirmation email
10. System displays confirmation screen with details

**Business Rules:**
- Wizard state preserved if patient navigates away
- Real-time availability updates between steps
- Confirmation code format: APT-YYYY-NNNN

---

##### FR-021: Appointment Management for Patients

**Trace:** Feature 1 → Epic 1.3 → User Story 1.3.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to view and manage their appointments |
| **Priority** | High |

**Requirements:**
- List all appointments with status indicators
- Filter by status: upcoming, completed, cancelled
- View appointment details
- Confirm attendance
- Cancel with mandatory reason
- Reschedule to new available slot
- View appointment history

**Business Rules:**
- Cancellation deadline: 24 hours before (configurable)
- Track cancellation reasons for analytics

---

##### FR-022: Appointment Confirmation

**Trace:** Feature 1 → Epic 1.3 → User Story 1.3.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to confirm appointment attendance |
| **Priority** | Medium |

**Requirements:**
- Confirmation prompt in dashboard and email
- One-click confirmation from secure email link
- Reminder to confirm 24 hours before
- Confirmation status visible in appointment list

---

#### 3.1.7 Administrative Appointment Management (Feature 1, Epic 1.4)

---

##### FR-023: Reception Calendar View

**Trace:** Feature 1 → Epic 1.4 → User Story 1.4.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a calendar view for administrative appointment management |
| **Priority** | High |

**Requirements:**
- Monthly view with appointment counts per day
- Daily view with time slots
- Weekly view with all doctors
- Color coding by status
- Filters by doctor, specialty, status
- Quick actions: confirm, cancel, reschedule
- Print daily schedule

---

##### FR-024: Administrative Appointment Actions

**Trace:** Feature 1 → Epic 1.4 → User Story 1.4.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to manage appointments on behalf of patients |
| **Priority** | High |

**Requirements:**
- Create appointment for existing patient
- Create appointment with quick patient registration
- Assign consultation room
- Reassign doctor (verify availability)
- Reschedule appointment
- Cancel appointment with notification
- Add administrative notes
- Mark special requirements

**Business Rules:**
- Log all administrative actions with user ID
- Validate permissions for each action
- Send notifications for all changes

---

##### FR-025: Appointment Reports

**Trace:** Feature 1 → Epic 1.4 → User Story 1.4.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall generate appointment reports |
| **Priority** | Medium |

**Requirements:**
- Filter by date range, doctor, specialty, status
- Summary statistics
- Export to CSV and PDF
- Scheduled reports via email
- Comparison with previous periods

---

#### 3.1.8 Doctor Agenda Management (Feature 1, Epic 1.5)

---

##### FR-026: Doctor Daily Agenda

**Trace:** Feature 1 → Epic 1.5 → User Story 1.5.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide doctors with a daily appointment agenda |
| **Priority** | High |

**Requirements:**
- Today's appointments ordered by time
- Patient name, time, reason for visit
- Status indicators: waiting, in progress, completed, no-show
- Quick access to patient medical history
- One-click to start consultation
- Auto-refresh every minute

---

##### FR-027: Patient Check-In System

**Trace:** Feature 1 → Epic 1.5 → User Story 1.5.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall track patient arrivals for appointments |
| **Priority** | Medium |

**Requirements:**
- Mark patient as "arrived"
- Record check-in time
- Display wait time
- Waiting list ordered by check-in time
- Alert for long wait times

---

##### FR-028: No-Show Management

**Trace:** Feature 1 → Epic 1.5 → User Story 1.5.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall track patients who miss appointments |
| **Priority** | Medium |

**Requirements:**
- Mark appointment as "no-show" after grace period (15 minutes)
- Record with optional notes
- Notify patient
- Track no-show history per patient
- No-show statistics for reporting

---

#### 3.1.9 Appointment Notifications (Feature 1, Epic 1.6)

---

##### FR-029: Automatic Appointment Notifications

**Trace:** Feature 1 → Epic 1.6 → User Story 1.6.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall send automatic notifications for appointment events |
| **Priority** | High |

**Requirements:**
- Confirmation email immediately after booking
- Reminder 24 hours before
- Reminder 1 hour before
- Notification for any changes (reschedule, cancel, doctor change)
- Cancellation notification with reason
- In-app notifications in addition to email

---

##### FR-030: Schedule Change Notifications

**Trace:** Feature 1 → Epic 1.6 → User Story 1.6.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall notify patients of changes affecting their appointments |
| **Priority** | High |

**Requirements:**
- Notification when doctor adds exception affecting appointment
- Notification when appointment is rescheduled
- Notification when assigned doctor changes
- Notification includes reason and new details
- Quick actions from notification/email

---

#### 3.1.10 Patient Medical History (Feature 2, Epic 2.1)

---

##### FR-031: Patient Medical Profile Management

**Trace:** Feature 2 → Epic 2.1 → User Story 2.1.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to manage their medical information |
| **Priority** | High |

**Requirements:**
- View and edit: allergies, chronic conditions, current medications
- Emergency contact information
- Insurance information with policy details
- Blood type and vital information
- Family medical history (optional)
- Surgical history
- Lifestyle information (smoking, alcohol, exercise)

**Business Rules:**
- Track all changes with timestamps
- Privacy controls for sensitive information

---

##### FR-032: Medical History Timeline

**Trace:** Feature 2 → Epic 2.1 → User Story 2.1.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall display a chronological timeline of medical events |
| **Priority** | High |

**Requirements:**
- Chronological list: consultations, diagnoses, prescriptions, lab results, procedures
- Filter by event type or date range
- Click to expand event details
- Export history to PDF
- Summary view with key information

---

#### 3.1.11 Consultation Process (Feature 2, Epic 2.2)

---

##### FR-033: Vital Signs Recording

**Trace:** Feature 2 → Epic 2.2 → User Story 2.2.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall record patient vital signs during consultation |
| **Priority** | High |

**Requirements:**
- Input fields: blood pressure (systolic/diastolic), heart rate, temperature, respiratory rate, oxygen saturation, weight, height
- Automatic BMI calculation
- Visual alerts for values outside normal ranges
- Comparison with previous readings
- Vitals history chart

**Business Rules:**
- Normal ranges defined by age and gender
- Color-coded indicators: normal, warning, critical

---

##### FR-034: SOAP Clinical Documentation

**Trace:** Feature 2 → Epic 2.2 → User Story 2.2.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall support SOAP format clinical documentation |
| **Priority** | High |

**Requirements:**
- **Subjective:** Patient-reported symptoms, chief complaint, history of present illness
- **Objective:** Physical examination findings, vital signs summary, test results
- **Assessment:** Differential diagnosis list, primary diagnosis with ICD-10 code
- **Plan:** Treatment plan, medications, follow-up instructions
- Rich text editor
- Template library for common conditions
- Auto-save during documentation

---

##### FR-035: Diagnosis Recording

**Trace:** Feature 2 → Epic 2.2 → User Story 2.2.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall record diagnoses with standard ICD-10 codes |
| **Priority** | High |

**Requirements:**
- Search ICD-10 codes by name or code
- Add multiple diagnoses (primary and secondary)
- Mark as confirmed or suspected
- View patient's diagnosis history
- Common diagnoses quick selection

---

#### 3.1.12 Prescription Management (Feature 2, Epic 2.3)

---

##### FR-036: Prescription Creation

**Trace:** Feature 2 → Epic 2.3 → User Story 2.3.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to create medical prescriptions |
| **Priority** | High |

**Requirements:**
- Add multiple medications with: name, dosage, frequency, duration, route, instructions
- Allergy alerts based on patient profile
- Generate unique prescription code
- Generate QR code for verification
- Preview before saving
- Copy from previous prescriptions

---

##### FR-037: Prescription PDF Generation

**Trace:** Feature 2 → Epic 2.3 → User Story 2.3.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall generate downloadable prescription PDFs |
| **Priority** | High |

**Requirements:**
- Professional format with clinic branding
- Include: patient info, doctor info, date, medications, instructions
- QR code included
- Doctor signature/stamp
- Prescription number and validity period
- Email prescription option

---

##### FR-038: Public Prescription Verification

**Trace:** Feature 2 → Epic 2.3 → User Story 2.3.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide public prescription verification |
| **Priority** | High |

**Requirements:**
- Public page accessible without login
- Enter code or scan QR
- Display: verification status, doctor name, issue date, patient initials
- Do NOT display: full patient info, medication details (privacy)
- Clear indication if valid or invalid
- Show if prescription voided

**Business Rules:**
- Rate limiting to prevent abuse
- Log verification attempts

---

##### FR-039: Prescription Renewal Workflow

**Trace:** Feature 2 → Epic 2.3 → User Story 2.3.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall support prescription renewal requests |
| **Priority** | Medium |

**Requirements:**
- Patient views prescriptions eligible for renewal
- Patient submits renewal request with notes
- Track status: pending, approved, rejected
- Notification when processed
- Doctor reviews and approves/rejects
- New prescription generated if approved
- Rejection includes reason

---

#### 3.1.13 Laboratory Management (Feature 2, Epic 2.4)

---

##### FR-040: Lab Test Ordering

**Trace:** Feature 2 → Epic 2.4 → User Story 2.4.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to order laboratory tests |
| **Priority** | High |

**Requirements:**
- Select from catalog of common tests
- Add custom tests
- Set priority: routine, urgent, STAT
- Add special instructions
- Multiple tests per order
- Patient notification
- Print lab order form

---

##### FR-041: Lab Results Management

**Trace:** Feature 2 → Epic 2.4 → User Story 2.4.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall manage laboratory results |
| **Priority** | High |

**Requirements:**
- View pending lab orders
- Update status: pending → sample collected → processing → completed
- Enter results for each test
- Upload result documents (PDF, images)
- Mark as normal, abnormal, or critical
- Notify patient and doctor when ready

---

##### FR-042: Lab Results Access for Patients

**Trace:** Feature 2 → Epic 2.4 → User Story 2.4.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to access their lab results |
| **Priority** | High |

**Requirements:**
- List all lab orders with status
- View completed results
- Download result documents
- Indicator for abnormal results
- Compare results over time
- Filter by date or test type

---

#### 3.1.14 Consultation Completion (Feature 2, Epic 2.5)

---

##### FR-043: Consultation Summary & Completion

**Trace:** Feature 2 → Epic 2.5 → User Story 2.5.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide consultation completion workflow |
| **Priority** | High |

**Requirements:**
- Review all entered information
- Add final notes or instructions
- Set follow-up recommendation
- Mark consultation complete
- Record end time
- Send patient summary email
- Option to schedule follow-up

---

##### FR-044: Follow-Up Appointment Scheduling

**Trace:** Feature 2 → Epic 2.5 → User Story 2.5.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall facilitate follow-up appointment scheduling |
| **Priority** | Medium |

**Requirements:**
- Quick access from consultation completion
- Show only doctor's available slots
- Suggest dates based on follow-up timeframe
- Pre-fill reason with "Follow-up: [diagnosis]"
- Patient notification
- Link to original consultation

---

#### 3.1.15 Billing System (Feature 3, Epic 3.1)

---

##### FR-045: Medical Services Catalog

**Trace:** Feature 3 → Epic 3.1 → User Story 3.1.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall maintain a catalog of billable medical services |
| **Priority** | High |

**Requirements:**
- List services with categories (consultation, procedure, laboratory)
- Create service: name, description, category, price
- Edit service information
- Price history tracking
- Activate/deactivate services
- Import/export catalog

---

##### FR-046: Invoice Creation & Management

**Trace:** Feature 3 → Epic 3.1 → User Story 3.1.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall create and manage patient invoices |
| **Priority** | High |

**Requirements:**
- Create invoice: select patient, add items from catalog
- Each item: service, quantity, unit price, subtotal
- Apply discounts (percentage or fixed)
- Calculate taxes (configurable rate)
- Generate unique invoice number
- Auto-calculate insurance coverage
- Show patient copay
- Status: draft, pending, paid, partial, voided

**Business Rules:**
- Prevent duplicate billing for same appointment

---

##### FR-047: Payment Processing

**Trace:** Feature 3 → Epic 3.1 → User Story 3.1.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall record invoice payments |
| **Priority** | High |

**Requirements:**
- Record full or partial payment
- Payment methods: cash, credit card, debit, transfer, check
- Payment receipt generation
- Track payment history
- Balance due calculation
- Daily payment summary
- Void payments with reason

---

##### FR-048: Patient Billing Portal

**Trace:** Feature 3 → Epic 3.1 → User Story 3.1.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to view their billing information |
| **Priority** | Medium |

**Requirements:**
- List all invoices with status
- View invoice details
- Download invoice as PDF
- See payment history
- Outstanding balance summary
- Insurance coverage details

---

#### 3.1.16 Insurance Management (Feature 3, Epic 3.2)

---

##### FR-049: Insurance Provider Management

**Trace:** Feature 3 → Epic 3.2 → User Story 3.2.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall manage insurance providers and plans |
| **Priority** | Medium |

**Requirements:**
- List insurance providers
- Create provider: name, contact info, portal access
- Manage plans per provider
- Set coverage percentages by service category
- Activate/deactivate providers
- Contract dates tracking

---

##### FR-050: Patient Insurance Assignment

**Trace:** Feature 3 → Epic 3.2 → User Story 3.2.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall manage patient insurance information |
| **Priority** | Medium |

**Requirements:**
- Assign insurance to patient
- Fields: provider, plan, policy number, group number, validity dates
- Primary and secondary insurance support
- Verify eligibility
- Insurance card upload
- Alert for expired insurance

---

##### FR-051: Automatic Coverage Calculation

**Trace:** Feature 3 → Epic 3.2 → User Story 3.2.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall calculate insurance coverage automatically |
| **Priority** | Medium |

**Requirements:**
- Apply coverage percentage per service type
- Calculate covered amount and patient responsibility
- Handle deductibles (basic)
- Show coverage breakdown on invoice
- Manual override with reason

---

#### 3.1.17 Quality & Satisfaction (Feature 3, Epic 3.3)

---

##### FR-052: Satisfaction Survey System

**Trace:** Feature 3 → Epic 3.3 → User Story 3.3.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall collect patient feedback via surveys |
| **Priority** | Medium |

**Requirements:**
- Automatic trigger after completed consultation
- Survey via email with link
- Survey in patient portal
- Questions: overall satisfaction, punctuality, doctor care, facilities, staff
- 1-5 star rating scale
- Optional free-text comments
- Anonymous option

**Business Rules:**
- Survey link expires after 7 days
- One survey per appointment

---

##### FR-053: Doctor Rating System

**Trace:** Feature 3 → Epic 3.3 → User Story 3.3.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow patients to rate doctors |
| **Priority** | Medium |

**Requirements:**
- Rate after completed appointment
- Criteria: punctuality, attention, clarity, recommendation
- Overall rating (1-5 stars)
- Written review option
- Anonymous option
- Edit within 24 hours

---

##### FR-054: Quality Analytics Dashboard

**Trace:** Feature 3 → Epic 3.3 → User Story 3.3.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide quality metrics dashboard for administrators |
| **Priority** | Medium |

**Requirements:**
- Overall satisfaction score and trend
- Satisfaction by doctor with rankings
- Satisfaction by specialty
- Survey response rate
- Recent comments
- Alerts for low ratings
- Export quality reports

---

##### FR-055: Doctor Performance View

**Trace:** Feature 3 → Epic 3.3 → User Story 3.3.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow doctors to view their ratings |
| **Priority** | Low |

**Requirements:**
- Average rating overall and by criteria
- Rating distribution chart
- Recent reviews (anonymous)
- Trend over time
- Comparison to clinic average (optional)

---

#### 3.1.18 Role-Specific Dashboards (Feature 4, Epic 4.1)

---

##### FR-056: Patient Dashboard

**Trace:** Feature 4 → Epic 4.1 → User Story 4.1.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide an informative dashboard for patients |
| **Priority** | High |

**Requirements:**
- Welcome message with patient name
- Cards: upcoming appointments, completed visits, pending lab results, active prescriptions
- Next appointment details
- Recent consultations summary
- Quick action: book appointment
- Notifications summary

---

##### FR-057: Doctor Dashboard

**Trace:** Feature 4 → Epic 4.1 → User Story 4.1.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a daily overview dashboard for doctors |
| **Priority** | High |

**Requirements:**
- Today's appointment count and list
- Week statistics
- Next appointment highlighted
- Pending actions: notes to complete, results to review, renewal requests
- Mini calendar
- Quick access to start consultation
- Notification badge

---

##### FR-058: Administrative Dashboard

**Trace:** Feature 4 → Epic 4.1 → User Story 4.1.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide clinic-wide statistics dashboard for administrators |
| **Priority** | High |

**Requirements:**
- General statistics: doctors, specialties, appointments, patients
- Appointment statistics with charts
- Today's appointments summary
- Revenue summary
- Recent activity feed
- Alerts and notifications
- Quick links to common actions

---

##### FR-059: Advanced Analytics & Metrics

**Trace:** Feature 4 → Epic 4.1 → User Story 4.1.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide advanced performance metrics |
| **Priority** | Medium |

**Requirements:**
- Average daily appointments
- Cancellation rate with trend
- No-show rate with trend
- Completion rate
- Average booking lead time
- Average consultation duration
- Peak hours analysis
- Performance by doctor
- Performance by specialty

---

#### 3.1.19 Reporting System (Feature 4, Epic 4.2)

---

##### FR-060: Appointment Reports

**Trace:** Feature 4 → Epic 4.2 → User Story 4.2.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall generate appointment reports |
| **Priority** | Medium |

**Requirements:**
- Filter by date range, doctor, specialty, status
- Summary statistics
- Detailed appointment list
- Export to CSV and PDF
- Schedule recurring reports
- Save filter presets

---

##### FR-061: Billing & Revenue Reports

**Trace:** Feature 4 → Epic 4.2 → User Story 4.2.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall generate financial reports |
| **Priority** | Medium |

**Requirements:**
- Revenue by date range
- Revenue by service category
- Revenue by doctor
- Outstanding balances
- Insurance claims summary
- Payment method breakdown
- Export to CSV and PDF

---

#### 3.1.20 Notification Management (Feature 4, Epic 4.3)

---

##### FR-062: Notification Center

**Trace:** Feature 4 → Epic 4.3 → User Story 4.3.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide a centralized notification management interface |
| **Priority** | High |

**Requirements:**
- List all notifications sorted by date
- Filter by type
- Mark as read/unread
- Mark all as read
- Delete notifications
- Notification count badge
- Click to navigate to related item

---

##### FR-063: Mass Notification System

**Trace:** Feature 4 → Epic 4.3 → User Story 4.3.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow administrators to send mass notifications |
| **Priority** | Medium |

**Requirements:**
- Create notification: title, message, priority
- Select recipients: all users, by role, specific users
- Schedule for future delivery
- Track delivery and read statistics
- Notification templates
- Preview before sending

---

##### FR-064: Notification Preferences

**Trace:** Feature 4 → Epic 4.3 → User Story 4.3.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall allow users to configure notification preferences |
| **Priority** | Low |

**Requirements:**
- Enable/disable email notifications by type
- Enable/disable in-app notifications by type
- Set reminder frequency
- Quiet hours (optional)
- Save with confirmation

---

#### 3.1.21 Security & Audit (Feature 4, Epic 4.4)

---

##### FR-065: Comprehensive Audit Logging

**Trace:** Feature 4 → Epic 4.4 → User Story 4.4.1

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall log all important actions for audit purposes |
| **Priority** | High |

**Requirements:**
- Log: user, action, entity, timestamp, IP address
- Log data changes (before/after values)
- Immutable logs (no modification or deletion)
- Categories: authentication, data access, data modification, admin actions
- Automatic logging via middleware
- Log rotation and archival

---

##### FR-066: Audit Log Viewer

**Trace:** Feature 4 → Epic 4.4 → User Story 4.4.2

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide an interface to view and search audit logs |
| **Priority** | Medium |

**Requirements:**
- List logs with pagination
- Filter by user, action type, date range, entity type
- Search by entity ID
- View full log details
- Export to CSV
- Log summary statistics

---

##### FR-067: Security Monitoring & Alerts

**Trace:** Feature 4 → Epic 4.4 → User Story 4.4.3

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall detect and alert on suspicious activity |
| **Priority** | High |

**Requirements:**
- Alert on multiple failed login attempts
- Alert on login from new location/device
- Alert on bulk data access
- Alert on permission changes
- Security dashboard
- Email notification to administrators

---

##### FR-068: User Security Management

**Trace:** Feature 4 → Epic 4.4 → User Story 4.4.4

| Attribute | Description |
|-----------|-------------|
| **Description** | The system shall provide user security management for administrators |
| **Priority** | High |

**Requirements:**
- View last login for all users
- View active sessions per user
- Force logout of specific sessions
- Reset user password
- Lock/unlock accounts
- View login history

---

### 3.2 External Interface Requirements

#### 3.2.1 User Interface Requirements

##### UI-001: General Interface Standards

The system user interface shall:
- Follow responsive design principles (mobile-first)
- Support viewport widths from 320px to 2560px
- Use consistent navigation patterns across all pages
- Provide visual feedback for all user actions within 200ms
- Display loading indicators for operations exceeding 1 second
- Use consistent color coding for status indicators
- Support keyboard navigation for all interactive elements

##### UI-002: Form Requirements

All forms in the system shall:
- Display inline validation errors in real-time
- Highlight invalid fields with red border
- Show descriptive error messages below invalid fields
- Prevent submission until all required fields are valid
- Preserve entered data on validation failure
- Provide clear labels for all input fields
- Mark required fields with asterisk (*)

##### UI-003: Table Requirements

Data tables shall:
- Support pagination with configurable page size
- Allow sorting by clickable column headers
- Provide search/filter functionality
- Display loading state during data fetch
- Show "No results" message for empty data sets
- Support row selection for bulk actions where applicable

#### 3.2.2 API Interface Requirements

##### API-001: RESTful Design

All API endpoints shall:
- Follow REST architectural constraints
- Use standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Return appropriate HTTP status codes
- Include JSON response body
- Support versioning via URL path (/api/v1/)

##### API-002: Request Format

API requests shall:
- Use JSON for request bodies
- Include Content-Type: application/json header
- Include Authorization: Bearer <token> for authenticated endpoints
- Support query parameters for filtering and pagination

##### API-003: Response Format

API responses shall follow this structure:

```json
{
  "success": true|false,
  "data": { ... } | [ ... ],
  "message": "string",
  "error": "string",
  "code": "ERROR_CODE",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 3.2.3 Authentication Interface

##### AUTH-001: JWT Token Structure

JWT tokens shall include:
- User ID (sub claim)
- User role (role claim)
- Expiration time (exp claim)
- Issued at time (iat claim)

##### AUTH-002: OAuth 2.0 Integration

Google OAuth integration shall:
- Use OAuth 2.0 with PKCE flow
- Request minimal scopes (email, profile)
- Support account linking with existing users
- Handle consent denial gracefully

#### 3.2.4 External Service Integrations

##### EXT-001: Email Service (SendGrid)

Email integration shall:
- Use SendGrid API for transactional emails
- Support HTML email templates
- Track delivery status
- Handle bounces and failures gracefully
- Respect rate limits

##### EXT-002: Database Service (Supabase)

Database integration shall:
- Use @supabase/supabase-js client library
- Implement connection pooling
- Handle connection timeouts
- Support transactions where required

---

### 3.3 Performance Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| **PERF-001** | Page load time | < 3 seconds | Time to first contentful paint |
| **PERF-002** | API response time (standard) | < 2 seconds | 95th percentile |
| **PERF-003** | API response time (availability) | < 500ms | 95th percentile |
| **PERF-004** | Concurrent users | 100+ simultaneous | Load testing |
| **PERF-005** | Database query time | < 200ms | Average query execution |
| **PERF-006** | File upload size | 10MB maximum | Per request |
| **PERF-007** | PDF generation | < 5 seconds | For standard documents |
| **PERF-008** | Search results | < 1 second | For indexed searches |

---

### 3.4 Security and Privacy Requirements

#### 3.4.1 Authentication Security

| ID | Requirement |
|----|-------------|
| **SEC-001** | The system shall use HTTPS for all communications |
| **SEC-002** | The system shall hash passwords using bcrypt with minimum 10 rounds |
| **SEC-003** | The system shall enforce minimum password complexity (8+ chars, mixed case, numbers) |
| **SEC-004** | The system shall implement account lockout after 5 failed login attempts |
| **SEC-005** | The system shall expire JWT tokens after configured duration (24h default) |
| **SEC-006** | The system shall support secure token refresh |

#### 3.4.2 Authorization Security

| ID | Requirement |
|----|-------------|
| **SEC-007** | The system shall implement role-based access control (RBAC) |
| **SEC-008** | The system shall validate user permissions on every request |
| **SEC-009** | The system shall log all authorization failures |
| **SEC-010** | The system shall prevent privilege escalation |

#### 3.4.3 Data Security

| ID | Requirement |
|----|-------------|
| **SEC-011** | The system shall encrypt sensitive data at rest |
| **SEC-012** | The system shall encrypt data in transit using TLS 1.2+ |
| **SEC-013** | The system shall implement input sanitization to prevent XSS |
| **SEC-014** | The system shall use parameterized queries to prevent SQL injection |
| **SEC-015** | The system shall implement CORS with whitelist-based origin validation |

#### 3.4.4 Privacy Requirements

| ID | Requirement |
|----|-------------|
| **PRIV-001** | The system shall implement soft delete for all personal data |
| **PRIV-002** | The system shall log all access to patient medical records |
| **PRIV-003** | The system shall mask sensitive data in logs |
| **PRIV-004** | The system shall provide minimal information in public prescription verification |
| **PRIV-005** | The system shall support patient data export upon request |

#### 3.4.5 Audit Requirements

| ID | Requirement |
|----|-------------|
| **AUD-001** | The system shall log all authentication events |
| **AUD-002** | The system shall log all data modification events |
| **AUD-003** | The system shall log all administrative actions |
| **AUD-004** | The system shall store audit logs immutably |
| **AUD-005** | The system shall retain audit logs for minimum 1 year |

---

### 3.5 Reliability and Availability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| **REL-001** | System availability | 99.5% uptime |
| **REL-002** | Mean time between failures (MTBF) | > 720 hours (30 days) |
| **REL-003** | Mean time to recovery (MTTR) | < 4 hours |
| **REL-004** | Database backup frequency | Daily automated backups |
| **REL-005** | Backup retention | Minimum 30 days |
| **REL-006** | Data recovery point objective (RPO) | < 24 hours |
| **REL-007** | Data recovery time objective (RTO) | < 4 hours |
| **REL-008** | Graceful degradation | Core functions available during partial outage |

---

### 3.6 Maintainability Requirements

| ID | Requirement |
|----|-------------|
| **MAINT-001** | The system shall follow modular architecture (microservices) |
| **MAINT-002** | The system shall use consistent coding standards |
| **MAINT-003** | The system shall include inline code documentation |
| **MAINT-004** | The system shall support independent service deployment |
| **MAINT-005** | The system shall use environment variables for configuration |
| **MAINT-006** | The system shall support database migrations |
| **MAINT-007** | The system shall log errors with stack traces |

---

### 3.7 Portability Requirements

| ID | Requirement |
|----|-------------|
| **PORT-001** | The system shall run on any modern web browser (Chrome, Firefox, Safari, Edge) |
| **PORT-002** | The system shall not require browser plugins |
| **PORT-003** | The backend shall run on Node.js LTS versions |
| **PORT-004** | The database shall use standard PostgreSQL |
| **PORT-005** | The system shall use platform-independent file paths |

---

### 3.8 Usability Requirements

| ID | Requirement |
|----|-------------|
| **USE-001** | Users shall complete common tasks within 3 clicks |
| **USE-002** | Error messages shall be descriptive and actionable |
| **USE-003** | The system shall provide confirmation for destructive actions |
| **USE-004** | The system shall maintain form state on validation errors |
| **USE-005** | The system shall provide visual feedback for all interactions |
| **USE-006** | The system shall support undo for reversible actions |
| **USE-007** | Help documentation shall be accessible from all pages |

---

### 3.9 Accessibility Requirements

| ID | Requirement | Standard |
|----|-------------|----------|
| **ACC-001** | The system shall comply with WCAG 2.1 Level AA | WCAG 2.1 |
| **ACC-002** | All images shall have alt text | WCAG 1.1.1 |
| **ACC-003** | Color shall not be the only means of conveying information | WCAG 1.4.1 |
| **ACC-004** | Text contrast ratio shall be minimum 4.5:1 | WCAG 1.4.3 |
| **ACC-005** | All functionality shall be keyboard accessible | WCAG 2.1.1 |
| **ACC-006** | Focus indicators shall be visible | WCAG 2.4.7 |
| **ACC-007** | Form labels shall be programmatically associated | WCAG 1.3.1 |
| **ACC-008** | Error messages shall be associated with fields | WCAG 3.3.1 |

---

## 4. Appendices

### Appendix A: Traceability Matrix

#### A.1 Feature to Functional Requirements Mapping

| Feature | Epic | User Story | FR IDs |
|---------|------|------------|--------|
| **F0** | E0.1 | US0.1.1 | FR-001 |
| **F0** | E0.1 | US0.1.2 | FR-002 |
| **F0** | E0.1 | US0.1.3 | FR-003 |
| **F0** | E0.1 | US0.1.4 | FR-004 |
| **F0** | E0.1 | US0.1.5 | FR-005 |
| **F0** | E0.1 | US0.1.6 | FR-006 |
| **F0** | E0.2 | US0.2.1 | FR-007 |
| **F0** | E0.2 | US0.2.2 | FR-008 |
| **F0** | E0.2 | US0.2.3 | FR-009 |
| **F0** | E0.2 | US0.2.4 | FR-010 |
| **F0** | E0.2 | US0.2.5 | FR-011 |
| **F0** | E0.3 | US0.3.1 | FR-012 |
| **F0** | E0.3 | US0.3.2 | FR-013 |
| **F0** | E0.3 | US0.3.3 | FR-014 |
| **F0** | E0.3 | US0.3.4 | FR-015 |
| **F1** | E1.1 | US1.1.1 | FR-016 |
| **F1** | E1.1 | US1.1.2 | FR-017 |
| **F1** | E1.1 | US1.1.3 | FR-018 |
| **F1** | E1.2 | US1.2.1 | FR-019 |
| **F1** | E1.3 | US1.3.1 | FR-020 |
| **F1** | E1.3 | US1.3.2 | FR-021 |
| **F1** | E1.3 | US1.3.3 | FR-022 |
| **F1** | E1.4 | US1.4.1 | FR-023 |
| **F1** | E1.4 | US1.4.2 | FR-024 |
| **F1** | E1.4 | US1.4.3 | FR-025 |
| **F1** | E1.5 | US1.5.1 | FR-026 |
| **F1** | E1.5 | US1.5.2 | FR-027 |
| **F1** | E1.5 | US1.5.3 | FR-028 |
| **F1** | E1.6 | US1.6.1 | FR-029 |
| **F1** | E1.6 | US1.6.2 | FR-030 |
| **F2** | E2.1 | US2.1.1 | FR-031 |
| **F2** | E2.1 | US2.1.2 | FR-032 |
| **F2** | E2.2 | US2.2.1 | FR-033 |
| **F2** | E2.2 | US2.2.2 | FR-034 |
| **F2** | E2.2 | US2.2.3 | FR-035 |
| **F2** | E2.3 | US2.3.1 | FR-036 |
| **F2** | E2.3 | US2.3.2 | FR-037 |
| **F2** | E2.3 | US2.3.3 | FR-038 |
| **F2** | E2.3 | US2.3.4 | FR-039 |
| **F2** | E2.4 | US2.4.1 | FR-040 |
| **F2** | E2.4 | US2.4.2 | FR-041 |
| **F2** | E2.4 | US2.4.3 | FR-042 |
| **F2** | E2.5 | US2.5.1 | FR-043 |
| **F2** | E2.5 | US2.5.2 | FR-044 |
| **F3** | E3.1 | US3.1.1 | FR-045 |
| **F3** | E3.1 | US3.1.2 | FR-046 |
| **F3** | E3.1 | US3.1.3 | FR-047 |
| **F3** | E3.1 | US3.1.4 | FR-048 |
| **F3** | E3.2 | US3.2.1 | FR-049 |
| **F3** | E3.2 | US3.2.2 | FR-050 |
| **F3** | E3.2 | US3.2.3 | FR-051 |
| **F3** | E3.3 | US3.3.1 | FR-052 |
| **F3** | E3.3 | US3.3.2 | FR-053 |
| **F3** | E3.3 | US3.3.3 | FR-054 |
| **F3** | E3.3 | US3.3.4 | FR-055 |
| **F4** | E4.1 | US4.1.1 | FR-056 |
| **F4** | E4.1 | US4.1.2 | FR-057 |
| **F4** | E4.1 | US4.1.3 | FR-058 |
| **F4** | E4.1 | US4.1.4 | FR-059 |
| **F4** | E4.2 | US4.2.1 | FR-060 |
| **F4** | E4.2 | US4.2.2 | FR-061 |
| **F4** | E4.3 | US4.3.1 | FR-062 |
| **F4** | E4.3 | US4.3.2 | FR-063 |
| **F4** | E4.3 | US4.3.3 | FR-064 |
| **F4** | E4.4 | US4.4.1 | FR-065 |
| **F4** | E4.4 | US4.4.2 | FR-066 |
| **F4** | E4.4 | US4.4.3 | FR-067 |
| **F4** | E4.4 | US4.4.4 | FR-068 |

#### A.2 Functional Requirements Summary by Feature

| Feature | FR Count | FR IDs |
|---------|----------|--------|
| Feature 0: System Foundation | 15 | FR-001 to FR-015 |
| Feature 1: Appointment Scheduling | 15 | FR-016 to FR-030 |
| Feature 2: Medical Consultation | 14 | FR-031 to FR-044 |
| Feature 3: Billing & Quality | 11 | FR-045 to FR-055 |
| Feature 4: Dashboards & Security | 13 | FR-056 to FR-068 |
| **Total** | **68** | |

---

### Appendix B: Data Dictionary

#### B.1 User Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key, auto-increment |
| email | varchar(255) | Yes | Unique email address |
| password_hash | varchar(255) | Yes | Bcrypt hashed password |
| first_name | varchar(100) | Yes | User's first name |
| last_name | varchar(100) | Yes | User's last name |
| role | enum | Yes | patient, doctor, admin |
| phone | varchar(20) | No | Contact phone number |
| avatar_url | varchar(500) | No | Profile image URL |
| is_active | boolean | Yes | Account status (default: true) |
| is_email_verified | boolean | Yes | Email verification status |
| created_at | timestamp | Yes | Record creation timestamp |
| updated_at | timestamp | Yes | Last update timestamp |

#### B.2 Patient Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key |
| user_id | integer | Yes | Foreign key to users |
| date_of_birth | date | Yes | Birth date (YYYY-MM-DD) |
| gender | enum | Yes | male, female, other |
| ecuadorian_id | varchar(10) | Yes | Cédula (10 digits) |
| address | varchar(500) | No | Residential address |
| emergency_contact_name | varchar(200) | No | Emergency contact name |
| emergency_contact_phone | varchar(20) | No | Emergency contact phone |
| blood_type | varchar(5) | No | Blood type (A+, B-, etc.) |
| allergies | text[] | No | List of allergies |
| insurance_provider_id | integer | No | FK to insurance_providers |
| policy_number | varchar(50) | No | Insurance policy number |

#### B.3 Doctor Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key |
| user_id | integer | Yes | Foreign key to users |
| specialty_id | integer | Yes | Foreign key to specialties |
| license_number | varchar(50) | Yes | Unique medical license |
| consultation_fee | decimal(10,2) | Yes | Standard consultation fee |
| bio | text | No | Professional biography |
| average_rating | decimal(3,2) | No | Calculated average rating |
| total_ratings | integer | No | Total number of ratings |
| is_active | boolean | Yes | Active status |

#### B.4 Appointment Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key |
| patient_id | integer | Yes | FK to patients |
| doctor_id | integer | Yes | FK to doctors |
| specialty_id | integer | Yes | FK to specialties |
| consultation_room_id | integer | No | FK to consultation_rooms |
| appointment_date | date | Yes | Appointment date |
| start_time | time | Yes | Start time (HH:MM) |
| end_time | time | Yes | End time (HH:MM) |
| status | enum | Yes | pending, confirmed, in_progress, completed, cancelled, no_show |
| reason | text | No | Reason for visit |
| notes | text | No | Additional notes |
| confirmation_code | varchar(20) | Yes | Unique confirmation code |
| check_in_time | timestamp | No | Patient arrival time |
| is_follow_up | boolean | Yes | Follow-up indicator |
| parent_appointment_id | integer | No | FK to parent appointment |

#### B.5 Prescription Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key |
| appointment_id | integer | Yes | FK to appointments |
| patient_id | integer | Yes | FK to patients |
| doctor_id | integer | Yes | FK to doctors |
| medications | jsonb | Yes | Array of medication objects |
| instructions | text | No | General instructions |
| valid_until | date | Yes | Prescription expiration |
| is_active | boolean | Yes | Active status |
| qr_code | text | No | Base64 QR image |
| qr_token | varchar(100) | No | Verification token |

#### B.6 Billing Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | Yes | Primary key |
| appointment_id | integer | Yes | FK to appointments |
| patient_id | integer | Yes | FK to patients |
| invoice_number | varchar(20) | Yes | Unique invoice number |
| subtotal | decimal(10,2) | Yes | Sum before tax/discount |
| tax | decimal(10,2) | Yes | Tax amount |
| discount | decimal(10,2) | Yes | Discount amount |
| insurance_covered | decimal(10,2) | Yes | Insurance coverage |
| total | decimal(10,2) | Yes | Final amount due |
| status | enum | Yes | pending, paid, partial, cancelled, refunded |
| payment_method | varchar(50) | No | Payment method used |
| payment_date | timestamp | No | Payment timestamp |

---

### Appendix C: API Endpoint Summary

#### C.1 CRUD API (Port 3001)

| Resource | Method | Endpoint | Access |
|----------|--------|----------|--------|
| Users | GET | /api/v1/users | Admin |
| Users | GET | /api/v1/users/me | Authenticated |
| Users | POST | /api/v1/users | Admin |
| Users | PUT | /api/v1/users/:id | Admin |
| Users | DELETE | /api/v1/users/:id | Admin |
| Patients | GET | /api/v1/patients | Admin, Doctor |
| Patients | GET | /api/v1/patients/me | Patient |
| Patients | PUT | /api/v1/patients/me | Patient |
| Doctors | GET | /api/v1/doctors | Public |
| Doctors | GET | /api/v1/doctors/me | Doctor |
| Doctors | POST | /api/v1/doctors/with-user | Admin |
| Appointments | GET | /api/v1/appointments | Admin |
| Appointments | GET | /api/v1/appointments/patient | Patient |
| Appointments | GET | /api/v1/appointments/doctor | Doctor |
| Appointments | POST | /api/v1/appointments | Patient |
| Appointments | PATCH | /api/v1/appointments/:id/status | Doctor, Admin |
| Specialties | GET | /api/v1/specialties | Public |
| Specialties | POST | /api/v1/specialties | Admin |
| Schedules | GET | /api/v1/schedules/doctor/:id | Public |
| Schedules | POST | /api/v1/schedules/bulk | Doctor, Admin |
| Prescriptions | GET | /api/v1/prescriptions | Patient, Doctor |
| Prescriptions | POST | /api/v1/prescriptions | Doctor |
| Billings | GET | /api/v1/billings | Authenticated |
| Billings | POST | /api/v1/billings | Doctor, Admin |

#### C.2 Business API (Port 3002)

| Resource | Method | Endpoint | Access |
|----------|--------|----------|--------|
| Availability | GET | /api/v1/availability/doctor/:id/date/:date | Public |
| Availability | POST | /api/v1/availability/check | Public |
| Scheduling | POST | /api/v1/scheduling/book | Patient |
| Scheduling | PUT | /api/v1/scheduling/reschedule/:id | Patient, Admin |
| Scheduling | POST | /api/v1/scheduling/cancel/:id | Patient, Doctor, Admin |
| Consultations | POST | /api/v1/consultations/start/:id | Doctor |
| Consultations | POST | /api/v1/consultations/complete/:id | Doctor |
| Reports | GET | /api/v1/reports/my-stats | Doctor |
| Reports | GET | /api/v1/reports/general-stats | Admin |
| Reports | GET | /api/v1/reports/advanced-stats | Admin |
| Billing Calc | GET | /api/v1/billing-calculations/calculate/:id | Doctor, Admin |
| Billing Calc | POST | /api/v1/billing-calculations/payment/:id | Admin |

#### C.3 External API (Port 3003)

| Resource | Method | Endpoint | Access |
|----------|--------|----------|--------|
| Auth | GET | /auth/google | Public |
| Auth | POST | /auth/register | Public |
| Auth | POST | /auth/login | Public |
| Auth | POST | /auth/password-reset/request | Public |
| Auth | POST | /auth/password-reset/confirm | Public |
| Auth | POST | /auth/change-password | Authenticated |
| Notifications | GET | /notifications/user | Authenticated |
| Notifications | POST | /notifications/appointment-confirmation | Admin, Doctor |
| Notifications | POST | /notifications/custom | Admin |
| QR Codes | GET | /qr-codes/verify-prescription/:token | Public |
| QR Codes | POST | /qr-codes/prescription/:id | Doctor |
| Reminders | POST | /reminders/create | Admin |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| QA Lead | | | |
| Product Owner | | | |

---

**Document Classification:** Internal Use Only  
**© 2026 San Miguel Clinic - Medical Appointment Management System**

