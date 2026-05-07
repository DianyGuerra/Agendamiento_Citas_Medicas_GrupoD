# 🏃 Sprint 3 Report - Billing, Insurance & Quality Management

## Medical Appointment Management System - San Miguel Clinic

---

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Sprint Number** | 3 |
| **Feature Implemented** | Feature 3: Billing, Insurance & Quality Management |
| **Sprint Duration** | 1 sprint week (7 days) |
| **Team Size** | 3 developers |
| **Report Date** | February 2026 |

---

## 1. Sprint Goal

The objective of Sprint 3 was to implement the complete financial and quality management capabilities for the Medical Appointment Management System. This included building the billing system with invoice creation, payment tracking, and PDF generation, developing the insurance provider management with automatic coverage calculation, and creating the quality module with satisfaction surveys and doctor rating systems. By the end of this sprint, administrators should be able to generate and manage invoices with insurance coverage, patients should view their billing history and rate their doctors, and the clinic should have a quality analytics dashboard to monitor service satisfaction.

---

## 2. Sprint Duration

**1 sprint week (7 days)** — Monday through Sunday

**Daily Commitment:** 4 hours per developer  
**Total Sprint Effort:** ~84 person-hours (3 developers × 4 hours × 7 days)

---

## 3. Work Distribution

| Team Member | Responsibilities |
|-------------|------------------|
| **Erick Tufiño** (Team Lead) | • Billing calculation business logic (`/backend/business-api/services/billingCalculation.service.js`) <br/> • Billing calculation controller (`/backend/business-api/controllers/billingCalculation.controller.js`) <br/> • Insurance coverage calculation engine <br/> • Database migrations (`/backend/database/migrations/003_billing_enhancements.sql`, `007_add_insurance_provider_to_patients.sql`) <br/> • Financial precision handling (decimal arithmetic) <br/> • Invoice idempotency and duplicate prevention <br/> • Code review and financial compliance verification |
| **Michael Simbaña** | • Billing controller and repository (`/backend/crud-api/controllers/billing.controller.js`, `/backend/crud-api/repositories/billing.repository.js`) <br/> • Billing item controller and repository (`/backend/crud-api/controllers/billingItem.controller.js`, `/backend/crud-api/repositories/billingItem.repository.js`) <br/> • Medical services catalog (`/backend/crud-api/controllers/medicalService.controller.js`, `/backend/crud-api/repositories/medicalService.repository.js`) <br/> • Invoice PDF generation with clinic branding <br/> • Payment receipt generation <br/> • Patient billing portal (`/frontend/src/pages/patient/PatientBilling.jsx`) |
| **Domenica Villagomez** | • Insurance provider management (`/backend/crud-api/controllers/insuranceProvider.controller.js`, `/backend/crud-api/repositories/insuranceProvider.repository.js`) <br/> • Doctor rating system (`/backend/crud-api/controllers/doctorRating.controller.js`, `/backend/crud-api/repositories/doctorRating.repository.js`) <br/> • Satisfaction survey system (`/backend/crud-api/controllers/satisfactionSurvey.controller.js`, `/backend/crud-api/repositories/satisfactionSurvey.repository.js`) <br/> • Admin billing management (`/frontend/src/pages/admin/BillingManagement.jsx`) <br/> • Admin insurance management (`/frontend/src/pages/admin/InsuranceManagement.jsx`) <br/> • Admin quality dashboard (`/frontend/src/pages/admin/QualityManagement.jsx`) <br/> • Patient rating page (`/frontend/src/pages/patient/RateAppointment.jsx`) |

---

## 4. Sprint Execution Timeline (Day-by-Day)

### 📅 Day 1 — Monday: Database Schema & Service Catalog

The sprint began with a planning session reviewing Feature 3's 3 epics and 12 user stories. We identified three parallel workstreams: billing system, insurance management, and quality metrics.

**Erick** started with database design, creating `003_billing_enhancements.sql` which added:
- `medical_services` table: id, name, description, category (consultation/procedure/laboratory), base_price, tax_rate, is_active, price_history (JSON)
- `billings` table: id, patient_id, appointment_id, invoice_number, status (draft/pending/paid/partial/voided), subtotal, discount_amount, tax_amount, total, insurance_coverage, patient_copay, created_at
- `billing_items` table: id, billing_id, service_id, description, quantity, unit_price, subtotal
- `payments` table: id, billing_id, amount, payment_method, reference_number, payment_date

He also created `007_add_insurance_provider_to_patients.sql` to link patients with their insurance providers.

**Michael** built the medical services catalog infrastructure. He created `medicalService.repository.js` with methods for `create`, `findAll`, `findById`, `findByCategory`, `update`, `updatePrice` (with history tracking), and `toggleActive`. The service catalog includes seed data for common services: General Consultation ($50), Specialist Consultation ($80), CBC Lab Test ($25), etc.

**Domenica** set up the insurance provider data model in `insuranceProvider.repository.js`. Fields include: provider name, contact info, plans (JSON array), coverage percentages by service category, contract validity dates, and active status.

By end of day, all database schemas were migrated and repositories initialized.

---

### 📅 Day 2 — Tuesday: Billing Core & Invoice Creation

**Michael** focused on the billing CRUD operations:

`billing.controller.js` endpoints:
- `POST /api/v1/billings` — create new invoice (draft)
- `GET /api/v1/billings/:id` — get invoice with items
- `GET /api/v1/billings/patient/:patientId` — patient's invoices
- `PUT /api/v1/billings/:id/status` — update status (finalize, void)
- `GET /api/v1/billings/summary` — admin summary statistics

`billingItem.controller.js` endpoints:
- `POST /api/v1/billing-items` — add item to invoice
- `PUT /api/v1/billing-items/:id` — update item (draft invoices only)
- `DELETE /api/v1/billing-items/:id` — remove item

**Erick** implemented the billing calculation service in `/backend/business-api/services/billingCalculation.service.js`:

```javascript
// Core calculation methods
calculateInvoiceTotal(items, discountPercent, taxRate)
calculateInsuranceCoverage(items, patientInsurance)
calculatePatientCopay(total, coverageAmount)
applyDiscount(subtotal, discountType, discountValue)
```

He implemented precise decimal arithmetic using a dedicated library to avoid floating-point errors in financial calculations. All monetary values are stored as integers (cents) in the database and converted for display.

**Domenica** began the insurance provider UI in `/frontend/src/pages/admin/InsuranceManagement.jsx`:
- Provider list with search and status filter
- Create/edit provider modal with plan configuration
- Coverage percentage sliders by service category
- Contract date pickers with expiration warnings

---

### 📅 Day 3 — Wednesday: Insurance Coverage & Integration

**Erick** built the insurance coverage calculation engine, the most complex business logic in this sprint:

The `calculateInsuranceCoverage()` function:
1. Looks up patient's active insurance provider and plan
2. For each billing item, determines the service category
3. Applies the coverage percentage for that category from the plan
4. Sums covered amounts across all items
5. Applies deductible if configured (first $X not covered)
6. Caps coverage at out-of-pocket maximum if reached
7. Returns breakdown: covered amount, patient responsibility, deductible applied

He also implemented the controller endpoint `POST /api/v1/billing-calculations/coverage` that takes a billing ID and returns the coverage breakdown.

**Domenica** completed the insurance provider backend and started patient insurance assignment:
- Added `insurance_provider_id`, `policy_number`, `group_number`, `plan_type`, `valid_until` to patient profiles
- Created endpoint `PUT /api/v1/patients/:id/insurance` to update patient insurance
- Insurance verification status tracking (verified, pending, expired)

**Michael** integrated insurance into the invoice creation flow:
- When creating an invoice for a patient with active insurance, automatically calculate coverage
- Display coverage breakdown: "Insurance covers: $45.00 | Your copay: $15.00"
- Manual override capability for admin with audit log

The team conducted integration testing: creating an invoice for an insured patient correctly calculated 80% coverage on consultation services and 70% on lab services based on the plan configuration.

---

### 📅 Day 4 — Thursday: Payment Processing & PDF Generation

**Michael** implemented the payment recording system:

`payments` endpoints:
- `POST /api/v1/billings/:id/payments` — record payment
- `GET /api/v1/billings/:id/payments` — payment history

Payment processing logic:
- Validate payment amount doesn't exceed balance due
- Update invoice status: full payment → "paid", partial → "partial"
- Generate payment receipt with unique reference number
- Support for multiple payment methods: cash, credit card, debit, bank transfer, check

He then built the PDF generation for invoices and receipts using `pdfkit`:

**Invoice PDF includes:**
- Clinic header with logo and contact information
- Patient details (name, ID, insurance info if applicable)
- Invoice number and date
- Itemized services table with quantities and prices
- Subtotal, discount, tax, insurance coverage breakdown
- Total due / Amount paid / Balance remaining
- Payment instructions and due date

**Receipt PDF includes:**
- Payment confirmation header
- Original invoice reference
- Payment amount and method
- Payment date and reference number
- Remaining balance (if partial payment)

**Domenica** built the admin billing management interface `/frontend/src/pages/admin/BillingManagement.jsx`:
- Invoice list with filters: status, date range, patient, amount range
- Create new invoice wizard: select patient → add services → apply discount → calculate insurance → finalize
- Invoice detail view with payment recording modal
- Void invoice with reason (audit logged)
- Export invoices to CSV for accounting

**Erick** implemented invoice idempotency to prevent duplicate billing:
- Unique constraint on `(appointment_id)` for billings — one invoice per appointment
- Invoice number generation: `INV-YYYYMM-XXXX` format with sequential counter
- Check for existing draft invoice before creating new one

---

### 📅 Day 5 — Friday: Quality System - Surveys & Ratings

**Domenica** focused on the quality measurement systems:

**Satisfaction Survey System:**
`satisfactionSurvey.repository.js` with fields:
- `appointment_id`, `patient_id` (optional for anonymous)
- Rating fields (1-5): `overall`, `punctuality`, `doctor_care`, `facilities`, `staff`
- `comments` (free text), `is_anonymous`
- `submitted_at`, `survey_link_token`, `expires_at`

`satisfactionSurvey.controller.js` endpoints:
- `POST /api/v1/satisfaction-surveys/send/:appointmentId` — send survey email
- `GET /api/v1/satisfaction-surveys/respond/:token` — load survey form (public)
- `POST /api/v1/satisfaction-surveys/submit/:token` — submit survey (public)
- `GET /api/v1/satisfaction-surveys/analytics` — aggregated analytics (admin)

**Doctor Rating System:**
`doctorRating.repository.js` with fields:
- `doctor_id`, `patient_id`, `appointment_id`
- Rating fields (1-5): `punctuality`, `attention`, `clarity`, `would_recommend`
- `overall_rating`, `review_text`, `is_anonymous`
- `created_at`, `updated_at`

`doctorRating.controller.js` endpoints:
- `POST /api/v1/doctor-ratings` — submit rating
- `GET /api/v1/doctor-ratings/doctor/:doctorId` — doctor's ratings
- `GET /api/v1/doctor-ratings/doctor/:doctorId/average` — aggregated average
- `PUT /api/v1/doctor-ratings/:id` — edit within 24 hours

**Michael** built the patient-facing billing portal `/frontend/src/pages/patient/PatientBilling.jsx`:
- Invoice list with status badges (pending=yellow, paid=green, overdue=red)
- Invoice detail with itemized breakdown
- Download PDF button for invoices and receipts
- Outstanding balance summary card at top
- Insurance coverage details per invoice

**Erick** implemented rating aggregation queries with performance optimization:
- Materialized view for doctor average ratings (refreshed hourly)
- Real-time calculation fallback for recently submitted ratings
- Rating distribution histogram query for the doctor dashboard

---

### 📅 Day 6 — Saturday: Quality Dashboard & Patient Rating UI

**Domenica** built the quality analytics dashboard `/frontend/src/pages/admin/QualityManagement.jsx`:

**Overview Section:**
- Overall satisfaction score (large number with trend arrow)
- Survey response rate percentage
- Total surveys this month vs. last month
- Low rating alerts (< 3 stars in last 24 hours)

**Doctor Rankings:**
- Table of doctors sorted by average rating
- Columns: Doctor Name, Specialty, Avg Rating, Total Reviews, Trend
- Click to drill down into individual doctor analytics

**Satisfaction Trends:**
- Line chart showing satisfaction over time (30/60/90 days)
- Breakdown by category (punctuality, care, facilities, staff)
- Filter by doctor or specialty

**Recent Feedback:**
- Latest comments feed (positive and negative)
- Anonymous comments show "Anonymous Patient"
- Flag option for inappropriate content

**Domenica** also created the patient rating page `/frontend/src/pages/patient/RateAppointment.jsx`:
- Star rating components for each criterion
- Overall rating automatically suggested based on criteria average
- Optional text review with character counter
- Anonymous toggle checkbox
- Submit confirmation with thank-you message

**Michael** integrated survey sending into the consultation completion flow:
- When doctor completes consultation, system queues survey email
- Email sent 2 hours after appointment (configurable)
- Survey link valid for 7 days
- Reminder email after 3 days if not completed

**Erick** added the doctor performance view to the existing doctor dashboard:
- "My Ratings" section showing average and distribution
- Recent reviews list (respecting anonymity)
- Trend chart comparing to clinic average

---

### 📅 Day 7 — Sunday: Testing, Integration & Polish

**Erick** conducted comprehensive testing of financial calculations:
1. ✅ Invoice total calculation with multiple items
2. ✅ Percentage and fixed discounts applied correctly
3. ✅ Tax calculation with configurable rate
4. ✅ Insurance coverage for insured patient (80% consultation, 70% lab)
5. ✅ Patient copay = total - coverage
6. ✅ Partial payment updates balance correctly
7. ✅ Void invoice prevents further payments
8. ✅ No duplicate invoices for same appointment

**Michael** fixed bugs discovered in testing:
- PDF generation failing for invoices with > 20 items (pagination added)
- Payment amount validation allowing negative values (fixed)
- Invoice status not updating after full payment (race condition fixed)

**Domenica** polished the UI and fixed usability issues:
- Added loading states for all async operations
- Improved mobile responsiveness for billing tables
- Added confirmation dialogs for void operations
- Star rating component now shows half-stars for averages

The team conducted the sprint demo showcasing:
1. Admin creates services catalog with pricing
2. Admin configures insurance provider with coverage percentages
3. Patient has insurance assigned to profile
4. After consultation, admin creates invoice for patient
5. System automatically calculates insurance coverage
6. Admin records partial payment → status changes to "partial"
7. Patient views invoice in portal, downloads PDF
8. After consultation, patient receives survey email
9. Patient submits satisfaction survey and doctor rating
10. Admin views quality dashboard with new data
11. Doctor views their own ratings and feedback

---

## 5. Technical Challenges & Solutions

### Challenge 1: Financial Precision & Decimal Arithmetic
**Challenge:** JavaScript floating-point arithmetic causes precision errors in financial calculations (e.g., 0.1 + 0.2 = 0.30000000000000004), which is unacceptable for billing.

**Solution:** Implemented a "cents-based" arithmetic system: all monetary values are stored as integers (cents) in the database. Calculations are performed in cents, then divided by 100 for display. Used the `decimal.js` library for any unavoidable decimal operations. Added comprehensive unit tests for calculation accuracy with edge cases.

---

### Challenge 2: Invoice Idempotency & Duplicate Prevention
**Challenge:** Multiple admins could accidentally create duplicate invoices for the same appointment, or network retries could cause duplicate submissions.

**Solution:** Implemented multi-layer protection: (1) Database unique constraint on `appointment_id` in billings table, (2) API endpoint checks for existing invoice before creation, (3) Frontend disables "Create Invoice" button if invoice exists, (4) Idempotency key header support for API calls — same key within 5 minutes returns existing invoice instead of creating new.

---

### Challenge 3: Insurance Coverage Rule Complexity
**Challenge:** Insurance coverage rules vary wildly: different percentages by service category, deductibles, out-of-pocket maximums, pre-authorization requirements. Implementing a flexible system was complex.

**Solution:** Created a rule-based coverage engine with JSON configuration per plan. Basic rules implemented: (1) Coverage percentage by service category, (2) Annual deductible (first $X not covered), (3) Out-of-pocket maximum (coverage = 100% after patient pays $X). Complex rules (pre-auth, exclusions) documented as future enhancements. Manual override always available with audit log.

---

### Challenge 4: Survey Response Rate Optimization
**Challenge:** Post-consultation surveys often have low response rates (<20%), reducing data quality for analytics.

**Solution:** Implemented engagement optimization: (1) Survey sent 2 hours after appointment (not immediately), (2) Email subject line personalized with doctor name, (3) Survey is mobile-optimized with large touch targets, (4) Progress indicator shows "2 minutes to complete", (5) Reminder email after 3 days, (6) Survey link valid for 7 days. Added response rate tracking to identify which doctors/specialties have lower engagement.

---

### Challenge 5: Rating Aggregation Performance
**Challenge:** Calculating real-time averages across thousands of ratings for the dashboard was slow (~3 seconds for clinic-wide analytics).

**Solution:** Implemented a hybrid approach: (1) Materialized view for doctor averages, refreshed every hour via scheduled job, (2) Cache layer for frequently accessed aggregations (5-minute TTL), (3) Real-time delta calculation for ratings submitted since last refresh, (4) Pre-aggregated daily summaries table for historical trends. Dashboard now loads in <500ms.

---

### Challenge 6: Payment State Machine Integrity
**Challenge:** Invoice status transitions needed strict rules: draft→pending→paid/partial→voided. Invalid transitions (e.g., paying a voided invoice) could cause accounting discrepancies.

**Solution:** Implemented a state machine pattern for invoice status: defined valid transitions in code, validated every status change against allowed transitions, rejected invalid state changes with descriptive errors. Added database trigger as safety net to prevent invalid status in `billings` table. Full audit log of all status changes with user ID and reason.

---

### Challenge 7: Anonymous Feedback Privacy
**Challenge:** Balancing anonymous feedback (encourages honest responses) with preventing abuse (fake negative reviews) required careful design.

**Solution:** Implemented "pseudonymous" approach: (1) Anonymous surveys still record patient_id in database (for one-survey-per-appointment enforcement), (2) Anonymous flag controls display only—admin sees "Anonymous Patient", (3) Rate limiting: one rating per patient per doctor per 30 days, (4) Flagging system for inappropriate content review, (5) Comment moderation queue for reviews containing certain keywords.

---

## 6. Sprint Retrospective

### ✅ What Went Well

1. **Financial calculation accuracy:** The decision to use cents-based arithmetic from day one prevented any precision bugs. All financial tests passed on first run in QA.

2. **Insurance flexibility:** The JSON-based coverage rules allow configuring new insurance plans without code changes. Adding a new provider takes ~10 minutes through the admin interface.

3. **Quality system engagement:** The 2-hour delay before sending surveys (vs. immediate) showed 35% higher open rates in our test data compared to immediate sends.

4. **Parallel workstream execution:** The three domains (billing, insurance, quality) were independent enough that team members rarely blocked each other, maximizing parallel development.

### ⚠️ What Could Be Improved

1. **Invoice UI complexity:** The invoice creation wizard has many steps and fields. User testing revealed admins wanted a "quick invoice" option for simple consultations. Added to backlog for future sprint.

2. **Insurance testing data:** We had limited real-world insurance plan configurations for testing. Creating more realistic test scenarios would improve confidence in coverage calculations.

3. **Rating abuse prevention:** The current system relies on one-per-appointment limits. More sophisticated abuse detection (sentiment analysis, pattern detection) would strengthen the quality data.

### 📚 Lessons Learned for Next Sprint

1. **Involve finance/accounting early:** Getting input from clinic accountants on invoice format and export requirements would have prevented two late-stage UI changes.

2. **Mock third-party systems:** Future insurance portal integration will need mock services for testing. Setting up mock infrastructure now will save time later.

3. **Performance testing for aggregations:** The rating aggregation performance issue was caught late. Including performance tests for analytics queries from day one would catch such issues earlier.

---

## 📊 Sprint Metrics

| Metric | Value |
|--------|-------|
| **User Stories Completed** | 12/12 (100%) |
| **Epics Completed** | 3/3 (100%) |
| **Total Commits** | 52 |
| **Files Created/Modified** | 38 |
| **Lines of Code** | ~5,400 |
| **API Endpoints Added** | 24 |
| **PDF Templates Created** | 2 (invoice, receipt) |
| **Database Migrations** | 2 |
| **Test Coverage** | Manual + financial calculation unit tests |
| **Bugs Found in Testing** | 7 |
| **Bugs Fixed** | 7 |

---

## 📁 Deliverables

### Backend Components (Business API)
- ✅ `/backend/business-api/services/billingCalculation.service.js` — Financial calculations
- ✅ `/backend/business-api/controllers/billingCalculation.controller.js` — Calculation endpoints

### Backend Components (CRUD API)
- ✅ `/backend/crud-api/controllers/billing.controller.js` — Invoice CRUD
- ✅ `/backend/crud-api/controllers/billingItem.controller.js` — Invoice items CRUD
- ✅ `/backend/crud-api/controllers/medicalService.controller.js` — Services catalog
- ✅ `/backend/crud-api/controllers/insuranceProvider.controller.js` — Insurance management
- ✅ `/backend/crud-api/controllers/doctorRating.controller.js` — Doctor ratings
- ✅ `/backend/crud-api/controllers/satisfactionSurvey.controller.js` — Satisfaction surveys
- ✅ `/backend/crud-api/repositories/billing.repository.js` — Billing data access
- ✅ `/backend/crud-api/repositories/billingItem.repository.js` — Items data access
- ✅ `/backend/crud-api/repositories/medicalService.repository.js` — Services data access
- ✅ `/backend/crud-api/repositories/insuranceProvider.repository.js` — Insurance data access
- ✅ `/backend/crud-api/repositories/doctorRating.repository.js` — Ratings data access
- ✅ `/backend/crud-api/repositories/satisfactionSurvey.repository.js` — Survey data access

### Frontend Components (Admin)
- ✅ `/frontend/src/pages/admin/BillingManagement.jsx` — Invoice management
- ✅ `/frontend/src/pages/admin/InsuranceManagement.jsx` — Insurance providers
- ✅ `/frontend/src/pages/admin/QualityManagement.jsx` — Quality analytics dashboard

### Frontend Components (Patient)
- ✅ `/frontend/src/pages/patient/PatientBilling.jsx` — Billing portal
- ✅ `/frontend/src/pages/patient/RateAppointment.jsx` — Doctor rating page

### Database
- ✅ `/backend/database/migrations/003_billing_enhancements.sql` — Billing schema
- ✅ `/backend/database/migrations/007_add_insurance_provider_to_patients.sql` — Patient insurance link

---

## ✍️ Sign-Off

| Role | Name | Date |
|------|------|------|
| Team Lead | Erick Tufiño | February 2026 |
| Developer | Michael Simbaña | February 2026 |
| Developer | Domenica Villagomez | February 2026 |

---

**Sprint 3 Status: ✅ COMPLETED**

*Prepared by the Development Team — San Miguel Clinic Medical Appointment System*
