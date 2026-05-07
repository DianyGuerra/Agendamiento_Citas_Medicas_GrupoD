# 🏃 Sprint 0 Report - System Foundation & Core Infrastructure

## Medical Appointment Management System - San Miguel Clinic

---

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Sprint Number** | 0 |
| **Feature Implemented** | Feature 0: System Foundation & Core Infrastructure |
| **Sprint Duration** | 1 sprint week (7 days) |
| **Team Size** | 3 developers |
| **Report Date** | February 2026 |

---

## 1. Sprint Goal

The objective of Sprint 0 was to establish the foundational infrastructure for the Medical Appointment Management System. This included implementing the complete authentication and authorization system (traditional login, Google OAuth 2.0, password recovery), creating the base entity CRUDs for users, doctors, patients, specialties, and consultation rooms, and building the navigation structure for all three user roles (admin, doctor, patient). By the end of this sprint, the team aimed to have a fully functional authentication flow and the scaffolding necessary to support all subsequent features.

---

## 2. Sprint Duration

**1 sprint week (7 days)** — Monday through Sunday

**Daily Commitment:** 4 hours per developer  
**Total Sprint Effort:** ~84 person-hours (3 developers × 4 hours × 7 days)

---

## 3. Work Distribution

| Team Member | Responsibilities |
|-------------|------------------|
| **Erick Tufiño** (Team Lead) | • Database schema design and migrations (`/backend/database/migrations/001_all_tables.sql`, `002_additional_tables.sql`) <br/> • JWT configuration and authentication middleware (`/backend/shared/config/jwt.config.js`, `/backend/shared/middleware/auth.middleware.js`) <br/> • User and role repositories (`/backend/crud-api/repositories/user.repository.js`, `role.repository.js`) <br/> • CORS and database configuration (`/backend/shared/config/cors.config.js`, `database.config.js`) <br/> • AuthContext and protected routes (`/frontend/src/context/AuthContext.jsx`) <br/> • Code review and PR management for all team members |
| **Michael Simbaña** | • Google OAuth 2.0 integration (`/backend/external-api/services/googleAuth.service.js`) <br/> • Authentication controller and service (`/backend/external-api/controllers/auth.controller.js`, `/backend/external-api/services/auth.service.js`) <br/> • Login and Register pages (`/frontend/src/pages/public/login.jsx`, `Register.jsx`) <br/> • AuthCallback for OAuth flow (`/frontend/src/pages/public/AuthCallback.jsx`) <br/> • Password reset repository (`/backend/crud-api/repositories/passwordReset.repository.js`) <br/> • Email service integration (`/backend/external-api/services/email.service.js`) |
| **Domenica Villagomez** | • User, Doctor, Patient controllers (`/backend/crud-api/controllers/user.controller.js`, `doctor.controller.js`, `patient.controller.js`) <br/> • Specialty and Consultation Room controllers (`/backend/crud-api/controllers/specialty.controller.js`, `consultationRoom.controller.js`) <br/> • Admin, Doctor, Patient layouts (`/frontend/src/layouts/AdminLayout.jsx`, `DoctorLayout.jsx`, `PatientLayout.jsx`) <br/> • Public pages (`/frontend/src/pages/public/Home.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`) <br/> • Patient and Doctor repositories (`/backend/crud-api/repositories/patient.repository.js`, `doctor.repository.js`) <br/> • Specialty and Consultation Room repositories (`/backend/crud-api/repositories/specialty.repository.js`, `consultationRoom.repository.js`) |

---

## 4. Sprint Execution Timeline (Day-by-Day)

### 📅 Day 1 — Monday: Project Setup & Database Design

The sprint kicked off with a team planning session where we reviewed the Feature 0 scope from the Product Backlog and divided responsibilities. **Erick** took the lead on infrastructure, starting with the database schema design. He created the initial migration file `001_all_tables.sql` containing the core tables: `users`, `roles`, `patients`, `doctors`, `specialties`, and `consultation_rooms`. He also set up the database configuration in `/backend/shared/config/database.config.js` to connect to our Supabase PostgreSQL instance.

Meanwhile, **Michael** initialized the External API server structure under `/backend/external-api/`, creating the base `server.js` file and the folder structure for controllers, services, and routes. He began researching the Google OAuth 2.0 flow requirements and set up the initial Google Cloud Console project.

**Domenica** focused on the CRUD API structure, setting up `/backend/crud-api/server.js` and creating the initial controller stubs for `user.controller.js`, `patient.controller.js`, and `doctor.controller.js`. She also initialized the repository pattern by creating the base repository files.

By end of day, we had both API servers initialized and the database schema defined with all Feature 0 tables.

---

### 📅 Day 2 — Tuesday: Authentication Foundation

**Erick** focused on security infrastructure. He implemented the JWT configuration in `/backend/shared/config/jwt.config.js` with token expiration settings (24 hours standard, 7 days for "remember me"). He then built the authentication middleware in `/backend/shared/middleware/auth.middleware.js`, implementing the `verifyToken` and `requireRole` functions that would protect all subsequent routes.

**Michael** dove into the authentication service layer. He implemented `/backend/external-api/services/auth.service.js` with functions for `register`, `login`, `validateCredentials`, and `generateToken`. The register function included the Ecuadorian cédula validation algorithm and age verification (18+ years requirement). He also started the auth controller in `/backend/external-api/controllers/auth.controller.js`.

**Domenica** began work on the frontend authentication pages. She created the `login.jsx` page with email/password fields, form validation, and the "Forgot Password" link. She also started the `Register.jsx` page with all required fields: first name, last name, Ecuadorian ID, date of birth, phone, email, and password with confirmation.

The team had a brief sync at 3 PM where Michael demonstrated the cédula validation working with test numbers, and we decided on the error message format for validation failures.

---

### 📅 Day 3 — Wednesday: Google OAuth & Password Recovery

**Michael** had a full day dedicated to Google OAuth integration. He implemented `/backend/external-api/services/googleAuth.service.js` with the complete OAuth 2.0 flow: generating the authorization URL, exchanging the code for tokens, and fetching user profile data. He also created the `AuthCallback.jsx` page in `/frontend/src/pages/public/` to handle the OAuth redirect and token exchange.

A challenge arose when the Google callback wasn't working locally. After debugging, Michael discovered the redirect URI mismatch and updated the CORS configuration in `/backend/shared/config/cors.config.js` to allow the Google OAuth redirect.

**Erick** implemented the `user.repository.js` and `role.repository.js` in `/backend/crud-api/repositories/`, adding methods for `findByEmail`, `findById`, `create`, `update`, and `findByGoogleId` to support both traditional and OAuth users. He also created `002_additional_tables.sql` with the `password_resets` table for the recovery flow.

**Domenica** built the password recovery frontend: `ForgotPassword.jsx` with email input and validation, and `ResetPassword.jsx` with new password and confirmation fields. She coordinated with Michael to ensure the reset token validation matched the backend expectations.

**Michael** also implemented `/backend/external-api/services/email.service.js` using SendGrid for sending password reset emails with secure tokens.

---

### 📅 Day 4 — Thursday: CRUD Controllers & Repositories

This day was dedicated to completing the CRUD layer for all core entities.

**Domenica** finished the controllers and repositories for the remaining entities:
- `specialty.controller.js` and `specialty.repository.js` with full CRUD operations including activation/deactivation and doctor count per specialty
- `consultationRoom.controller.js` and `consultationRoom.repository.js` with room status management (available, unavailable, maintenance)
- Enhanced `doctor.controller.js` to include specialty assignment and profile photo handling
- Enhanced `patient.controller.js` with search by name/ID and CSV export capability

**Erick** implemented the `passwordReset.repository.js` with methods for `createToken`, `findByToken`, `markAsUsed`, and `deleteExpiredTokens`. He also added the token hash storage security (never storing plain tokens) and the 1-hour expiration validation.

**Michael** integrated the password reset flow end-to-end:
1. User requests reset via `ForgotPassword.jsx`
2. Backend generates token and sends email via `email.service.js`
3. User clicks link, lands on `ResetPassword.jsx`
4. Backend validates token and updates password

The team conducted integration testing in the afternoon, finding and fixing an issue where the password hash wasn't being properly updated in the users table.

---

### 📅 Day 5 — Friday: Frontend Layouts & Navigation

Friday was layout day, focusing on the navigation structure for all three roles.

**Domenica** built all three layout components:
- `AdminLayout.jsx` with a collapsible sidebar containing sections: Main (Dashboard), Clinical Management (Calendar, Specialties, Rooms, Doctors), Patients, Administration (Billing, Insurance, Quality), and System (Notifications, Logs, Security). She implemented the responsive design with a hamburger menu for mobile.
- `DoctorLayout.jsx` with sidebar navigation to Dashboard, Appointments, My Patients, Prescriptions, Laboratory, Reports, My Schedule, and Notifications. She added a notification badge component that would later receive real-time updates.
- `PatientLayout.jsx` with simplified navigation: Dashboard, My Appointments, Medical History, Lab Results, Prescriptions, Billing, and Notifications. She focused on large touch targets for mobile users.

**Erick** created the `AuthContext.jsx` in `/frontend/src/context/`, implementing:
- `login` function that stores JWT and user data
- `logout` function that clears storage and redirects
- `isAuthenticated` state
- `user` object with role information
- Route protection logic based on user role

**Michael** built the public `Home.jsx` landing page with:
- Clinic information and services overview
- Hero section with call-to-action buttons (Login/Register)
- Services section highlighting available specialties
- Contact information and location

The team integrated the layouts with the `AuthContext`, ensuring that navigation redirected correctly based on user role after login.

---

### 📅 Day 6 — Saturday: Integration & Bug Fixes

Saturday was dedicated to integration testing and bug fixing.

**Erick** ran through the complete authentication flow multiple times:
1. New user registration → found and fixed an issue where Ecuadorian ID validation was rejecting valid IDs starting with "17"
2. Login with new account → working correctly
3. Google OAuth flow → discovered that new Google users weren't being prompted for Ecuadorian ID

**Michael** fixed the Google OAuth gap by implementing `CompleteProfile.jsx` in `/frontend/src/pages/public/`, which prompts first-time Google users for their Ecuadorian ID and phone number before allowing full access to the system.

**Domenica** fixed several UI issues:
- Sidebar not collapsing properly on tablets (breakpoint adjustment)
- Active menu item not highlighting correctly on page refresh
- Form validation messages not clearing when user corrects input

The team also implemented the validation middleware in `/backend/shared/middleware/validation.middleware.js` to standardize request body validation across all endpoints.

**Erick** added the `errorHandler.middleware.js` and `logger.middleware.js` for consistent error responses and request logging.

---

### 📅 Day 7 — Sunday: Final Testing & Documentation

The final day focused on comprehensive testing and polish.

**Michael** created a Postman collection with all auth endpoints:
- POST `/auth/register` with sample request/response
- POST `/auth/login` with JWT response
- GET `/auth/google` for OAuth initiation
- GET `/auth/google/callback` for OAuth completion
- POST `/auth/forgot-password` for reset request
- POST `/auth/reset-password` for password update

**Domenica** performed end-to-end testing of all CRUD operations:
- Created test specialties (General Medicine, Cardiology, Pediatrics)
- Created test consultation rooms with different statuses
- Created test doctor accounts with specialty assignments
- Verified patient search and CSV export functionality

**Erick** reviewed all code, merged remaining PRs, and ensured the database migrations were properly sequenced. He also verified that the role-based authorization was working correctly:
- Admin users could access all endpoints
- Doctor users could only access doctor-permitted endpoints
- Patient users were restricted to patient-only routes
- Unauthenticated requests received 401 responses

The team conducted a final demo walkthrough:
1. ✅ Visitor lands on Home page
2. ✅ Visitor registers as patient with valid Ecuadorian ID
3. ✅ Patient logs in and sees Patient Dashboard with correct layout
4. ✅ Admin logs in and sees Admin Dashboard with full sidebar
5. ✅ Google OAuth creates new user and prompts for additional data
6. ✅ Password reset flow sends email and allows password change

---

## 5. Technical Challenges & Solutions

### Challenge 1: Ecuadorian Cédula Validation Algorithm
**Challenge:** Implementing the correct validation algorithm for Ecuadorian 10-digit identification numbers (cédulas) was tricky. Initial implementation rejected valid IDs from certain provinces.

**Solution:** We researched the official algorithm from Ecuador's Civil Registry, which uses a modulo-10 verification with specific multipliers per digit. The corrected implementation in `auth.service.js` now properly validates IDs from all 24 provinces (first two digits 01-24) plus special codes for foreigners.

---

### Challenge 2: Google OAuth Redirect URI Mismatch
**Challenge:** The Google OAuth callback was failing with "redirect_uri_mismatch" error in development environment.

**Solution:** We updated `/backend/shared/config/cors.config.js` to properly whitelist both `localhost:5173` (Vite dev server) and the production frontend URL. We also ensured the redirect URI in Google Cloud Console exactly matched our callback endpoint, including the trailing path.

---

### Challenge 3: JWT Token Storage Security
**Challenge:** Deciding between localStorage, sessionStorage, and httpOnly cookies for JWT storage while balancing security and usability.

**Solution:** We chose localStorage for the MVP due to simpler implementation, but added the `AuthContext.jsx` wrapper that handles token refresh and automatic logout on expiration. We documented the plan to migrate to httpOnly cookies in a future security enhancement sprint.

---

### Challenge 4: Password Reset Token Security
**Challenge:** Storing password reset tokens securely while still being able to validate them when users click the reset link.

**Solution:** Implemented in `passwordReset.repository.js`: we hash the token using bcrypt before storing in the database. When validating, we compare the URL token against all unexpired tokens for that user using `bcrypt.compare()`. This ensures tokens can't be extracted from a database breach.

---

### Challenge 5: Role-Based Layout Routing
**Challenge:** Ensuring users are redirected to the correct dashboard after login and can't access layouts for other roles.

**Solution:** In `AuthContext.jsx`, we implemented a `getDefaultRoute` function that maps roles to their default routes. The protected route wrapper checks both authentication status AND role permission before rendering. Unauthorized role access redirects to the user's correct dashboard with a toast notification.

---

### Challenge 6: Database Migration Sequencing
**Challenge:** Managing dependencies between tables during migration (e.g., `doctors` depends on `users` and `specialties`).

**Solution:** We structured `001_all_tables.sql` with careful ordering: first independent tables (`roles`, `specialties`, `consultation_rooms`), then `users`, then dependent tables (`patients`, `doctors`). Foreign key constraints are added at the end of the migration to avoid circular dependency issues.

---

### Challenge 7: CORS Configuration for Multiple Frontends
**Challenge:** The API needed to accept requests from local development (port 5173), production (Vercel), and the Google OAuth callback.

**Solution:** Created a dynamic CORS configuration in `/backend/shared/config/cors.config.js` that reads allowed origins from environment variables. Development mode allows localhost origins, while production restricts to the specific Vercel deployment URL and Google domains.

---

## 6. Sprint Retrospective

### ✅ What Went Well

1. **Clear division of work**: The three-person split (infrastructure/auth/CRUD-UI) allowed parallel development with minimal conflicts. Each team member had clear ownership of their components.

2. **Early database design**: Starting with a solid database schema on Day 1 meant that the CRUD layer and authentication could be built against stable table structures without schema changes mid-sprint.

3. **Daily sync meetings**: Brief 15-minute standups at 3 PM kept everyone aligned and helped identify blockers early (like the Google OAuth redirect issue discovered on Day 3).

4. **Reusable middleware**: The authentication middleware and error handler implemented by Erick are now available for all future features, saving development time going forward.

### ⚠️ What Could Be Improved

1. **Earlier integration testing**: We waited until Day 6 for comprehensive integration testing. Starting integration tests on Day 4 would have caught the Google OAuth profile completion gap sooner.

2. **Better estimation for OAuth complexity**: Google OAuth took more time than expected (almost 2 full days for Michael). Future sprints should allocate more buffer for third-party integrations.

3. **Documentation during development**: We left most documentation to the final day. Writing API documentation alongside implementation would have been more efficient.

### 📚 Lessons Learned for Next Sprint

1. **Start integration testing from Day 4**: Allocate the second half of the sprint for integration rather than leaving it to the final two days.

2. **Create shared validation utilities early**: The Ecuadorian ID validation could have been a shared utility from day one. For Sprint 1, we'll identify common utilities upfront.

3. **Implement feature flags for incomplete features**: The Google OAuth profile completion was a late addition. Feature flags would allow shipping incomplete features behind toggles for testing.

---

## 📊 Sprint Metrics

| Metric | Value |
|--------|-------|
| **User Stories Completed** | 15/15 (100%) |
| **Epics Completed** | 3/3 (100%) |
| **Total Commits** | 47 |
| **Files Created** | 52 |
| **Lines of Code** | ~4,200 |
| **Test Coverage** | Manual testing (automated tests planned for Sprint 2) |
| **Bugs Found in Testing** | 8 |
| **Bugs Fixed** | 8 |

---

## 📁 Deliverables

### Backend Components
- ✅ `/backend/external-api/` - Authentication API (login, register, OAuth, password reset)
- ✅ `/backend/crud-api/` - CRUD operations for users, doctors, patients, specialties, rooms
- ✅ `/backend/shared/middleware/` - Auth, validation, error handling, logging
- ✅ `/backend/shared/config/` - JWT, CORS, database configuration
- ✅ `/backend/database/migrations/` - Initial schema migrations

### Frontend Components
- ✅ `/frontend/src/pages/public/` - Login, Register, Home, ForgotPassword, ResetPassword, AuthCallback
- ✅ `/frontend/src/layouts/` - AdminLayout, DoctorLayout, PatientLayout
- ✅ `/frontend/src/context/AuthContext.jsx` - Authentication state management

---

## ✍️ Sign-Off

| Role | Name | Date |
|------|------|------|
| Team Lead | Erick Tufiño | February 2026 |
| Developer | Michael Simbaña | February 2026 |
| Developer | Domenica Villagomez | February 2026 |

---

**Sprint 0 Status: ✅ COMPLETED**

*Prepared by the Development Team — San Miguel Clinic Medical Appointment System*
