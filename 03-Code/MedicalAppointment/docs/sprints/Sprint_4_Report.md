# 🏃 Sprint 4 Report - Dashboards, Reports & System Security

## Medical Appointment Management System - San Miguel Clinic

---

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Sprint Number** | 4 |
| **Feature Implemented** | Feature 4: Dashboards, Reports & System Security + Final Refinements |
| **Sprint Duration** | 1 sprint week (7 days) |
| **Team Size** | 3 developers |
| **Report Date** | February 2026 |

---

## 1. Sprint Goal

The objective of Sprint 4 was to implement comprehensive visibility and security capabilities for the Medical Appointment Management System, plus perform final system-wide refinements. This included building role-specific dashboards for patients, doctors, and administrators with real-time metrics, creating the reporting system with CSV/PDF exports, implementing the notification center with email reminders, and establishing the audit logging and security management infrastructure. Additionally, this sprint focused on code standardization, error handling consistency, and overall system polish to ensure production readiness. By the end of this sprint, all user roles should have intuitive dashboards, administrators should have full reporting and audit capabilities, and the system should meet security and quality standards for deployment.

---

## 2. Sprint Duration

**1 sprint week (7 days)** — Monday through Sunday

**Daily Commitment:** 4 hours per developer  
**Total Sprint Effort:** ~84 person-hours (3 developers × 4 hours × 7 days)

---

## 3. Work Distribution

| Team Member | Responsibilities |
|-------------|------------------|
| **Erick Tufiño** (Team Lead) | • Report service with aggregation queries (`/backend/business-api/services/report.service.js`) <br/> • Report controller (`/backend/business-api/controllers/report.controller.js`) <br/> • Audit log repository and immutability (`/backend/crud-api/repositories/auditLog.repository.js`) <br/> • Database migrations (`/backend/database/migrations/005_add_permissions_to_roles.sql`, `006_create_user_notifications.sql`) <br/> • Shared error handling standardization (`/backend/shared/errors/*`) <br/> • Response builder utility (`/backend/shared/utils/responseBuilder.utils.js`) <br/> • Code review, performance optimization, and final integration |
| **Michael Simbaña** | • User notification service (`/backend/external-api/services/userNotification.service.js`) <br/> • Notification controller (`/backend/external-api/controllers/notification.controller.js`) <br/> • Reminder controller and service (`/backend/external-api/controllers/reminder.controller.js`, `/backend/external-api/services/reminder.service.js`) <br/> • Email service enhancements (`/backend/external-api/services/email.service.js`) <br/> • CSV/PDF export utilities for reports <br/> • Patient notifications page (`/frontend/src/pages/patient/PatientNotifications.jsx`) <br/> • Doctor notifications page (`/frontend/src/pages/doctor/DoctorNotifications.jsx`) |
| **Domenica Villagomez** | • Admin dashboard (`/frontend/src/pages/admin/AdminDashboard.jsx`) <br/> • Doctor dashboard (`/frontend/src/pages/doctor/DoctorDashboard.jsx`) <br/> • Patient dashboard (`/frontend/src/pages/patient/PatientDashboard.jsx`) <br/> • Admin logs viewer (`/frontend/src/pages/admin/AdminLogs.jsx`) <br/> • Security management (`/frontend/src/pages/admin/SecurityManagement.jsx`) <br/> • Notifications management (`/frontend/src/pages/admin/NotificationsManagement.jsx`) <br/> • Doctor reports page (`/frontend/src/pages/doctor/DoctorReports.jsx`) |

---

## 4. Sprint Execution Timeline (Day-by-Day)

### 📅 Day 1 — Monday: Dashboard Data Layer & Migrations

The final sprint began with a comprehensive review of Feature 4's 4 epics and 14 user stories, plus a backlog of technical debt items for system refinement.

**Erick** started with the database migrations needed for Feature 4:
- `005_add_permissions_to_roles.sql`: Added `permissions` JSON column to `roles` table for granular permission management
- `006_create_user_notifications.sql`: Created `user_notifications` table with fields: `id`, `user_id`, `title`, `message`, `type`, `is_read`, `related_entity_type`, `related_entity_id`, `created_at`

He then built the foundation of `report.service.js` with core aggregation queries:
- `getGeneralStats()` — clinic-wide counts (doctors, patients, appointments)
- `getAppointmentsByStatus()` — breakdown by status for pie charts
- `getAppointmentsByMonth()` — 12-month trend data for line charts
- `getDoctorPerformance()` — efficiency metrics per doctor

**Michael** set up the notification infrastructure. He enhanced `email.service.js` with new templates:
- Dashboard summary email (morning digest for doctors)
- System notification email template
- Mass notification template with unsubscribe link

He also created `userNotification.service.js` with methods for `create`, `findByUserId`, `markAsRead`, `markAllAsRead`, `delete`, and `getUnreadCount`.

**Domenica** began scaffolding the dashboard components. She created the shell for `AdminDashboard.jsx` with a grid layout for statistics cards, chart placeholders, and activity feed sections.

---

### 📅 Day 2 — Tuesday: Report System & Dashboard Metrics

**Erick** completed the report service with advanced analytics:

```javascript
// Key report service methods
getAdvancedMetrics() // cancellation rate, no-show rate, avg booking lead time
getPeakHoursAnalysis() // hourly appointment distribution
getDoctorEfficiencyScores() // completion rate, avg consultation duration
getSpecialtyDemand() // appointments per specialty with trends
getRevenueReport(startDate, endDate) // billing aggregations
```

He also built the report controller `/backend/business-api/controllers/report.controller.js` with endpoints:
- `GET /api/v1/reports/dashboard/admin` — admin dashboard data
- `GET /api/v1/reports/dashboard/doctor/:id` — doctor dashboard data
- `GET /api/v1/reports/dashboard/patient/:id` — patient dashboard data
- `GET /api/v1/reports/appointments` — appointment report with filters
- `GET /api/v1/reports/revenue` — revenue report
- `GET /api/v1/reports/export/:type` — CSV/PDF export

**Domenica** built the admin dashboard UI `/frontend/src/pages/admin/AdminDashboard.jsx`:

**Statistics Row:**
- Card: Total Doctors (with active count)
- Card: Total Patients (registered this month badge)
- Card: Today's Appointments (with status breakdown)
- Card: Monthly Revenue (with % change from last month)

**Charts Section:**
- Appointments by Status (doughnut chart)
- Monthly Appointment Trend (line chart - 12 months)
- Appointments by Day of Week (bar chart)
- Peak Hours Heatmap

**Activity Feed:**
- Recent appointments with status badges
- Recent registrations
- System alerts (low-rated consultations, failed logins)

**Michael** built the notification controller `/backend/external-api/controllers/notification.controller.js`:
- `GET /api/v1/notifications/user` — get user's notifications
- `GET /api/v1/notifications/unread-count` — badge count
- `PUT /api/v1/notifications/:id/read` — mark as read
- `PUT /api/v1/notifications/mark-all-read` — mark all as read
- `DELETE /api/v1/notifications/:id` — delete notification
- `POST /api/v1/notifications/broadcast` — admin mass notification

---

### 📅 Day 3 — Wednesday: Doctor & Patient Dashboards

**Domenica** completed the role-specific dashboards:

**Doctor Dashboard** (`/frontend/src/pages/doctor/DoctorDashboard.jsx`):
- Welcome banner with doctor name and current date
- Today's Appointments card (count + timeline list)
- This Week's Stats (total appointments, completed, pending)
- Next Appointment highlight card (patient name, time, reason)
- Pending Actions section:
  - Unsigned consultation notes
  - Lab results to review
  - Prescription renewal requests
- Mini calendar with appointment indicators
- Recent Patient Activity feed
- "Start Next Consultation" quick action button

**Patient Dashboard** (`/frontend/src/pages/patient/PatientDashboard.jsx`):
- Welcome message with patient name
- Quick Stats cards:
  - Upcoming Appointments
  - Completed Visits
  - Pending Lab Results
  - Active Prescriptions
- Next Appointment detail card (date, doctor, specialty, location, "View Details" button)
- Recent Consultations list (last 3 with diagnosis summary)
- "Book New Appointment" primary action button
- Notifications preview (latest 5)
- Health reminders section (medication reminders, follow-up due)

**Michael** implemented the reminder service `/backend/external-api/services/reminder.service.js`:
- `scheduleAppointmentReminders(appointmentId)` — creates 24h and 1h reminders
- `processReminders()` — cron job handler to send due reminders
- `cancelReminders(appointmentId)` — cancels on appointment cancellation

He also built the reminder controller with endpoints:
- `POST /api/v1/reminders/schedule/:appointmentId` — schedule reminders
- `GET /api/v1/reminders/pending` — list pending reminders (admin)
- `DELETE /api/v1/reminders/:appointmentId` — cancel reminders

**Erick** optimized dashboard query performance:
- Created database indexes on frequently queried columns
- Implemented query result caching with 5-minute TTL
- Added dashboard data aggregation endpoint that returns all metrics in single call

---

### 📅 Day 4 — Thursday: Audit Logging & Security Management

**Erick** built the audit logging infrastructure:

`auditLog.repository.js` with immutable append-only operations:
- `create(logEntry)` — only method that modifies data
- `findAll(filters)` — with pagination
- `findByUserId(userId)` — user activity history
- `findByEntityType(type)` — entity-specific logs
- `getStatistics()` — log counts by action type

He implemented the audit utility `/backend/shared/utils/audit.utils.js`:
- `logAction(userId, action, entityType, entityId, oldValues, newValues, ipAddress)`
- Auto-capture of request IP via middleware
- Before/after value diffing for data changes

Audit categories implemented:
- `AUTH`: login, logout, password_change, failed_login
- `DATA_READ`: viewed patient record, exported data
- `DATA_WRITE`: created, updated, deleted entities
- `ADMIN`: user management, permission changes, system configuration

**Domenica** built the admin interfaces:

**Admin Logs Viewer** (`/frontend/src/pages/admin/AdminLogs.jsx`):
- Logs table with columns: Timestamp, User, Action, Entity, IP
- Filter panel: date range, user search, action type dropdown, entity type dropdown
- Log detail modal showing full before/after values
- Export to CSV button
- Log statistics summary (actions today, unique users, suspicious activity count)
- Highlight row for suspicious activity (red background)

**Security Management** (`/frontend/src/pages/admin/SecurityManagement.jsx`):
- User Security tab:
  - User list with last login, status, session count
  - "Force Logout" button per user
  - "Reset Password" button with confirmation
  - "Lock/Unlock Account" toggle
- Active Sessions tab:
  - List of all active sessions across users
  - Session details (IP, device, started, last activity)
  - "Terminate Session" button
- Security Alerts tab:
  - Recent failed login attempts
  - New device/location logins
  - Bulk data access events

**Michael** created the notification UI pages:
- `PatientNotifications.jsx` — patient notification center
- `DoctorNotifications.jsx` — doctor notification center

Both include:
- Notification list sorted by date (newest first)
- Filter tabs: All, Appointments, Prescriptions, Lab, System
- Mark as read on click
- "Mark All Read" button
- Delete option per notification
- Empty state for no notifications

---

### 📅 Day 5 — Friday: Export Features & Error Standardization

**Michael** implemented CSV and PDF export for reports:

**CSV Export:**
- Appointment report with configurable columns
- Revenue report with itemized breakdown
- Audit log export for compliance
- Patient list export (admin only)

**PDF Export:**
- Appointment summary report with clinic branding
- Revenue report with charts (using html2canvas for chart images)
- Doctor performance report

He used streaming for large exports to prevent memory issues and added progress indicators in the UI.

**Erick** focused on error handling standardization across all APIs:

Created error classes in `/backend/shared/errors/`:
- `AppError.js` — base error class
- `ValidationError.js` — 400 errors with field details
- `AuthorizationError.js` — 401/403 errors
- `NotFoundError.js` — 404 errors
- `ConflictError.js` — 409 errors (duplicate resources)
- `BusinessError.js` — business rule violations

Created `responseBuilder.utils.js` for consistent API responses:
```javascript
// Success response
success(res, data, message, statusCode)

// Error response
error(res, error, statusCode)

// Paginated response
paginated(res, data, page, pageSize, totalCount)
```

He refactored all controllers to use the standardized error handling and response format.

**Domenica** built the Notifications Management page for admins:

`/frontend/src/pages/admin/NotificationsManagement.jsx`:
- **Broadcast Notification** tab:
  - Title and message fields
  - Priority selector (low, normal, high, urgent)
  - Recipient selector: All Users, By Role (checkboxes), Specific Users (search)
  - Schedule option (send now or pick date/time)
  - Preview modal before sending
  - Send confirmation with recipient count

- **Notification History** tab:
  - List of sent broadcast notifications
  - Delivery statistics (sent, delivered, read)
  - Notification content preview

- **Templates** tab:
  - Predefined templates (Clinic Closure, System Maintenance, Holiday Hours)
  - Create custom template with variables ({{patient_name}}, {{appointment_date}})

---

### 📅 Day 6 — Saturday: Code Refinement & Integration Testing

This day was dedicated to technical debt, code standardization, and integration testing.

**Erick** performed system-wide code review and refactoring:
- Standardized all API endpoint naming conventions
- Consolidated duplicate utility functions into `/backend/shared/utils/helpers.utils.js`
- Added JSDoc comments to all service methods
- Implemented consistent pagination across all list endpoints
- Added request validation middleware to all routes
- Reviewed and optimized database queries (N+1 fixes)

**Michael** enhanced email delivery reliability:
- Added email queue with retry logic (3 attempts with exponential backoff)
- Email delivery status tracking in database
- Bounce and failure handling
- Email template validation before send
- Unsubscribe link handling

He also fixed bugs found in testing:
- Notification badge not updating in real-time (added polling)
- Reminder emails sending duplicate (idempotency key added)
- CSV export timeout for large datasets (streaming fix)

**Domenica** performed UI/UX polish:
- Consistent loading states across all pages
- Empty states for all list views
- Error boundaries for graceful error handling
- Toast notifications for all user actions
- Mobile responsiveness fixes for dashboards
- Accessibility improvements (ARIA labels, keyboard navigation)

The team conducted integration testing across all features:
1. ✅ Admin views dashboard with real-time stats
2. ✅ Admin generates appointment report, exports to CSV and PDF
3. ✅ Admin sends broadcast notification to all patients
4. ✅ Doctor views dashboard with today's appointments
5. ✅ Doctor receives notification when new appointment booked
6. ✅ Patient views dashboard with upcoming appointments
7. ✅ Patient receives email reminder 24h before appointment
8. ✅ Audit log captures all sensitive operations
9. ✅ Admin can force logout user session
10. ✅ Failed login attempts are logged and alerted

---

### 📅 Day 7 — Sunday: Final Testing, Documentation & Deployment Prep

**Erick** conducted final system verification:
- End-to-end testing of complete user journeys
- Performance testing: dashboard load time < 2 seconds
- Security testing: SQL injection, XSS prevention verification
- API response format consistency check
- Error handling coverage verification

He also updated the API documentation to reflect all new endpoints and standardized responses.

**Michael** completed final notification system testing:
- Verified email delivery for all notification types
- Tested mass notification with 100+ recipients
- Confirmed reminder scheduling and execution
- Validated unsubscribe functionality

**Domenica** performed final UI verification:
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness on various screen sizes
- Accessibility audit with screen reader
- User flow testing for all roles

The team conducted the final sprint demo showcasing:
1. **Admin Dashboard**: Real-time clinic statistics, appointment charts, revenue summary
2. **Doctor Dashboard**: Today's agenda, pending actions, quick consultation start
3. **Patient Dashboard**: Appointment cards, prescriptions, lab results summary
4. **Report Generation**: Appointment report with filters → CSV export
5. **Notification Center**: View, filter, mark as read across all roles
6. **Mass Notification**: Admin creates and sends broadcast to all patients
7. **Audit Logs**: Admin searches logs by user and action type
8. **Security Management**: Admin forces user logout, views session history

---

## 5. Technical Challenges & Solutions

### Challenge 1: Dashboard Data Aggregation Performance
**Challenge:** The admin dashboard required multiple complex aggregation queries (appointments by status, by month, doctor performance, revenue) which initially took 8+ seconds to load.

**Solution:** Implemented a multi-tier optimization strategy: (1) Created database indexes on `appointment_date`, `status`, `doctor_id`, (2) Built a dedicated dashboard endpoint that runs queries in parallel using `Promise.all()`, (3) Added Redis caching layer with 5-minute TTL for aggregations, (4) Implemented incremental refresh (only refresh changed metrics). Dashboard now loads in <2 seconds.

---

### Challenge 2: CSV/PDF Export for Large Datasets
**Challenge:** Generating CSV exports for 10,000+ appointments caused memory overflow and request timeouts. PDF generation for reports with charts was even more resource-intensive.

**Solution:** Implemented streaming exports for CSV: data is queried in batches of 1000 rows and streamed directly to the response without loading everything into memory. For PDF, implemented a two-phase approach: (1) Server generates JSON report data, (2) Frontend renders charts using Chart.js, captures with html2canvas, then generates PDF with jsPDF. Added progress indicators for exports taking > 5 seconds.

---

### Challenge 3: Email Delivery Reliability
**Challenge:** Email notifications were occasionally failing silently, and there was no visibility into delivery status or retry mechanism.

**Solution:** Built an email queue system: (1) All emails go to a `pending_emails` table first, (2) Background job processes queue every minute, (3) Failed emails retry with exponential backoff (1min, 5min, 30min), (4) After 3 failures, email marked as `failed` with error reason, (5) Admin can view email delivery statistics and retry failed emails manually. Added SendGrid webhook integration for bounce/complaint tracking.

---

### Challenge 4: Audit Log Immutability & Performance
**Challenge:** Audit logs must be immutable for compliance (no edits or deletes), but the table grows rapidly and queries slow down over time.

**Solution:** Implemented architectural safeguards: (1) Repository only exposes `create` and `find` methods—no update/delete, (2) Database trigger prevents UPDATE/DELETE on audit_logs table, (3) Partitioned table by month for query performance, (4) Added composite indexes on `(user_id, created_at)` and `(entity_type, entity_id)`, (5) Implemented automatic archival: logs > 1 year moved to `audit_logs_archive` table. Query performance maintained even with millions of records.

---

### Challenge 5: Real-Time Notification Updates
**Challenge:** Notification badge counts needed to update in real-time when new notifications arrived, but implementing WebSockets seemed overkill for this use case.

**Solution:** Implemented efficient polling with optimization: (1) Poll `/api/v1/notifications/unread-count` every 30 seconds, (2) Return `304 Not Modified` if count unchanged (using ETag), (3) When notification arrives, immediately update local count optimistically, (4) Added `last_notification_at` timestamp to avoid unnecessary polling if nothing changed. Future enhancement: Server-Sent Events (SSE) for true push when user count grows.

---

### Challenge 6: Error Handling Consistency Across Microservices
**Challenge:** The three backend APIs (CRUD, Business, External) had inconsistent error response formats, making frontend error handling complex and unreliable.

**Solution:** Created a shared error handling framework in `/backend/shared/errors/`: (1) Custom error classes extending `AppError` base class, (2) Each error type has a predefined HTTP status code and structure, (3) Global error handler middleware catches all errors and formats consistently, (4) Response builder utility ensures success responses also follow standard format: `{ success: true, data, message }` for success, `{ success: false, error: { code, message, details } }` for errors.

---

### Challenge 7: Permission-Based UI Rendering
**Challenge:** Different admin users might have different permissions (e.g., view-only vs. full access to security management), requiring dynamic UI rendering based on permissions.

**Solution:** Implemented permission-aware components: (1) `005_add_permissions_to_roles.sql` added granular permissions to roles, (2) Login response includes user's permissions array, (3) Created `usePermission` hook that checks if user has specific permission, (4) `PermissionGate` component wraps UI elements and conditionally renders based on permission, (5) Backend validates permissions on every request via middleware. UI gracefully hides features user can't access rather than showing and then blocking.

---

## 6. Sprint Retrospective

### ✅ What Went Well

1. **Dashboard data architecture:** The decision to create a single aggregated dashboard endpoint (vs. multiple separate calls) significantly improved UX. The caching layer ensures consistent fast load times.

2. **Shared error handling framework:** Standardizing errors across all three APIs made frontend error handling much simpler. The typed error classes provide clear semantics for different failure modes.

3. **Audit logging coverage:** The middleware-based approach captures all relevant actions automatically without developers needing to remember to add logging. The immutability guarantees are strong.

4. **Cross-feature integration:** As the final feature sprint, we successfully integrated dashboards with data from all previous features (appointments, billing, consultations). The holistic view demonstrates system completeness.

### ⚠️ What Could Be Improved

1. **Real-time notifications:** Polling every 30 seconds is functional but not ideal. Implementing SSE or WebSockets would provide true real-time updates without unnecessary network traffic.

2. **Report scheduling:** Users can export reports but cannot schedule recurring reports via email. This was descoped due to time constraints and added to the backlog.

3. **Advanced security features:** Two-factor authentication and IP-based geolocation for suspicious login detection were descoped. These are important for healthcare systems and should be prioritized post-launch.

### 📚 Lessons Learned for Future Projects

1. **Standardize early:** Error handling and response format standardization done in Sprint 4 would have been easier in Sprint 0. Future projects should establish these patterns from day one.

2. **Plan for observability:** Dashboard and reporting requirements should inform data model design from the start. Some aggregation queries required adding new indexes that could have been planned earlier.

3. **Security as a feature, not afterthought:** Audit logging, permission management, and security monitoring are full features requiring dedicated sprint allocation, not add-ons to other work.

---

## 📊 Sprint Metrics

| Metric | Value |
|--------|-------|
| **User Stories Completed** | 14/14 (100%) |
| **Epics Completed** | 4/4 (100%) |
| **Total Commits** | 67 |
| **Files Created/Modified** | 52 |
| **Lines of Code** | ~7,100 |
| **API Endpoints Added** | 28 |
| **Database Migrations** | 2 |
| **Error Classes Created** | 6 |
| **Test Coverage** | Manual + critical path E2E |
| **Bugs Found in Testing** | 12 |
| **Bugs Fixed** | 12 |
| **Technical Debt Items Resolved** | 8 |

---

## 📁 Deliverables

### Backend Components (Business API)
- ✅ `/backend/business-api/services/report.service.js` — Report generation and aggregations
- ✅ `/backend/business-api/controllers/report.controller.js` — Report endpoints

### Backend Components (CRUD API)
- ✅ `/backend/crud-api/controllers/security.controller.js` — Security management
- ✅ `/backend/crud-api/repositories/auditLog.repository.js` — Audit log data access
- ✅ `/backend/crud-api/repositories/role.repository.js` — Role and permissions

### Backend Components (External API)
- ✅ `/backend/external-api/controllers/notification.controller.js` — Notification endpoints
- ✅ `/backend/external-api/controllers/reminder.controller.js` — Reminder scheduling
- ✅ `/backend/external-api/services/userNotification.service.js` — Notification management
- ✅ `/backend/external-api/services/reminder.service.js` — Reminder processing
- ✅ `/backend/external-api/services/email.service.js` — Enhanced email delivery

### Backend Components (Shared)
- ✅ `/backend/shared/errors/*` — Standardized error classes
- ✅ `/backend/shared/utils/responseBuilder.utils.js` — Response formatting
- ✅ `/backend/shared/utils/audit.utils.js` — Audit logging utility
- ✅ `/backend/shared/utils/helpers.utils.js` — Consolidated helpers

### Frontend Components (Admin)
- ✅ `/frontend/src/pages/admin/AdminDashboard.jsx` — Admin dashboard with analytics
- ✅ `/frontend/src/pages/admin/AdminLogs.jsx` — Audit log viewer
- ✅ `/frontend/src/pages/admin/SecurityManagement.jsx` — User security management
- ✅ `/frontend/src/pages/admin/NotificationsManagement.jsx` — Broadcast notifications

### Frontend Components (Doctor)
- ✅ `/frontend/src/pages/doctor/DoctorDashboard.jsx` — Doctor daily overview
- ✅ `/frontend/src/pages/doctor/DoctorReports.jsx` — Doctor reports
- ✅ `/frontend/src/pages/doctor/DoctorNotifications.jsx` — Doctor notification center

### Frontend Components (Patient)
- ✅ `/frontend/src/pages/patient/PatientDashboard.jsx` — Patient portal dashboard
- ✅ `/frontend/src/pages/patient/PatientNotifications.jsx` — Patient notification center

### Database
- ✅ `/backend/database/migrations/005_add_permissions_to_roles.sql` — Role permissions
- ✅ `/backend/database/migrations/006_create_user_notifications.sql` — Notifications table

---

## 🏁 Project Completion Summary

With Sprint 4 completed, all five features of the Medical Appointment Management System are now implemented:

| Sprint | Feature | Status |
|--------|---------|--------|
| Sprint 0 | System Foundation & Core Infrastructure | ✅ Complete |
| Sprint 1 | Appointment Scheduling & Availability | ✅ Complete |
| Sprint 2 | Medical Consultation & Clinical Records | ✅ Complete |
| Sprint 3 | Billing, Insurance & Quality Management | ✅ Complete |
| Sprint 4 | Dashboards, Reports & System Security | ✅ Complete |

**Total Development Time:** 5 weeks  
**Total User Stories:** 75  
**Total API Endpoints:** 100+  
**System Status:** Ready for deployment

---

## ✍️ Sign-Off

| Role | Name | Date |
|------|------|------|
| Team Lead | Erick Tufiño | February 2026 |
| Developer | Michael Simbaña | February 2026 |
| Developer | Domenica Villagomez | February 2026 |

---

**Sprint 4 Status: ✅ COMPLETED**

**Project Status: 🎉 ALL FEATURES COMPLETE**

*Prepared by the Development Team — San Miguel Clinic Medical Appointment System*
