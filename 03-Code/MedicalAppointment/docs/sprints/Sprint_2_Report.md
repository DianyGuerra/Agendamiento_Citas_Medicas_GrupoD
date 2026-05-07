# 🏃 Sprint 2 Report - Medical Consultation & Clinical Records

## Medical Appointment Management System - San Miguel Clinic

---

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Sprint Number** | 2 |
| **Feature Implemented** | Feature 2: Medical Consultation & Clinical Records |
| **Sprint Duration** | 1 sprint week (7 days) |
| **Team Size** | 3 developers |
| **Report Date** | February 2026 |

---

## 1. Sprint Goal

The objective of Sprint 2 was to digitize the complete medical consultation process and establish comprehensive clinical record management. This included implementing the 4-step consultation wizard (vitals → SOAP notes → prescriptions → lab orders), creating the prescription system with QR code verification, building the medical history timeline for patients, and developing the laboratory test ordering workflow. By the end of this sprint, doctors should be able to conduct fully documented consultations, patients should access their complete medical history and download prescriptions, and pharmacists should verify prescription authenticity via QR codes.

---

## 2. Sprint Duration

**1 sprint week (7 days)** — Monday through Sunday

**Daily Commitment:** 4 hours per developer  
**Total Sprint Effort:** ~84 person-hours (3 developers × 4 hours × 7 days)

---

## 3. Work Distribution

| Team Member | Responsibilities |
|-------------|------------------|
| **Erick Tufiño** (Team Lead) | • Consultation business logic (`/backend/business-api/services/consultation.service.js`) <br/> • Consultation controller (`/backend/business-api/controllers/consultation.controller.js`) <br/> • Consultation note repository (`/backend/crud-api/repositories/consultationNote.repository.js`) <br/> • Medical record repository (`/backend/crud-api/repositories/medicalRecord.repository.js`) <br/> • Database migration for prescription renewals (`/backend/database/migrations/004_prescription_renewals.sql`) <br/> • ICD-10 diagnosis code integration <br/> • Code review and medical data privacy compliance |
| **Michael Simbaña** | • QR code generation service (`/backend/external-api/services/qrCode.service.js`) <br/> • QR code controller (`/backend/external-api/controllers/qrCode.controller.js`) <br/> • Prescription controller and repository (`/backend/crud-api/controllers/prescription.controller.js`, `/backend/crud-api/repositories/prescription.repository.js`) <br/> • Public prescription verification page (`/frontend/src/pages/VerifyPrescriptionQR.jsx`) <br/> • Prescription QR modal component (`/frontend/src/components/PrescriptionQRModal.jsx`) <br/> • PDF prescription generation with clinic branding |
| **Domenica Villagomez** | • Doctor consultation wizard (`/frontend/src/pages/doctor/DoctorConsultation.jsx`) <br/> • Doctor prescriptions management (`/frontend/src/pages/doctor/DoctorPrescriptions.jsx`) <br/> • Doctor patients list (`/frontend/src/pages/doctor/DoctorPatients.jsx`) <br/> • Patient medical record page (`/frontend/src/pages/patient/MedicalRecord.jsx`) <br/> • Patient history timeline (`/frontend/src/pages/patient/PatientHistory.jsx`) <br/> • Patient prescriptions view (`/frontend/src/pages/patient/PatientPrescriptions.jsx`) <br/> • Prescription renewal controller (`/backend/crud-api/controllers/prescriptionRenewal.controller.js`) |

---

## 4. Sprint Execution Timeline (Day-by-Day)

### 📅 Day 1 — Monday: Data Models & Core Repositories

The sprint began with a team planning session where we reviewed Feature 2's 5 epics and 16 user stories. The consultation workflow was identified as the critical path, with prescription management and QR verification as key deliverables.

**Erick** started with the data layer, designing the consultation note structure. He created `consultationNote.repository.js` with fields supporting the SOAP format: `subjective`, `objective`, `assessment`, `plan`, plus metadata fields for `vital_signs` (JSON), `diagnoses` (array), `icd10_codes` (array), and `appointment_id`. He also built `medicalRecord.repository.js` for the patient's comprehensive medical profile (allergies, conditions, medications, emergency contacts).

**Domenica** worked on the prescription renewal data model. She created the migration `004_prescription_renewals.sql` with the `prescription_renewals` table containing: `id`, `prescription_id`, `patient_id`, `doctor_id`, `status` (pending/approved/rejected), `patient_notes`, `doctor_notes`, `processed_at`, `created_at`.

**Michael** designed the prescription data structure in `prescription.repository.js`, implementing methods for `create`, `findById`, `findByPatientId`, `findByDoctorId`, `findByAppointmentId`, and `void`. Each prescription includes: `code` (unique identifier), `medications` (JSON array), `qr_code_url`, `is_valid`, `voided_at`, `voided_reason`.

By end of day, all repositories were complete with comprehensive CRUD operations.

---

### 📅 Day 2 — Tuesday: Consultation Business Logic

**Erick** focused on the consultation service, building `/backend/business-api/services/consultation.service.js`. The service orchestrates the 4-step consultation workflow:

**Step 1 - Vitals:** `recordVitalSigns(appointmentId, vitalsData)` — saves blood pressure, heart rate, temperature, respiratory rate, O2 saturation, weight, height. Calculates BMI automatically and flags out-of-range values.

**Step 2 - SOAP Notes:** `saveConsultationNotes(appointmentId, soapData)` — stores the structured clinical documentation with auto-save every 30 seconds.

**Step 3 - Prescriptions:** `createPrescription(appointmentId, medications)` — generates unique code, links to appointment, triggers QR generation.

**Step 4 - Lab Orders:** `createLabOrder(appointmentId, tests)` — creates lab order with priority level and special instructions.

He also implemented `completeConsultation(appointmentId)` which marks the appointment as completed, calculates duration, and triggers the patient summary email.

**Michael** began the QR code service implementation. He integrated the `qrcode` npm library in `/backend/external-api/services/qrCode.service.js` with methods:
- `generatePrescriptionQR(prescriptionId)` — creates QR containing the verification URL
- `verifyPrescription(code)` — validates prescription and returns sanitized data

**Domenica** started the doctor consultation UI, creating the shell for `/frontend/src/pages/doctor/DoctorConsultation.jsx` with a stepper component showing the 4 steps: "Vital Signs", "Clinical Notes", "Prescriptions", "Lab Orders", plus a final "Review & Complete" step.

---

### 📅 Day 3 — Wednesday: Consultation Wizard UI

**Domenica** had a full day on the consultation wizard. She built each step as a separate component within `DoctorConsultation.jsx`:

**Vitals Step:** Form fields for all vital signs with validation. Automatic BMI calculation displayed in real-time. Color-coded indicators: green (normal), yellow (warning), red (critical) based on age-adjusted reference ranges. Side panel showing patient's last 3 vital readings for comparison.

**SOAP Notes Step:** Rich text editor (TinyMCE) for each SOAP section. Collapsible panels for Subjective, Objective, Assessment, Plan. Template dropdown with common conditions (Upper Respiratory Infection, Hypertension Follow-up, Diabetes Check). ICD-10 code search with autocomplete in the Assessment section.

**Prescriptions Step:** "Add Medication" button opens a modal with fields: drug name (with autocomplete from medication database), dosage, frequency (dropdown: once daily, twice daily, etc.), duration, route (oral, topical, etc.), special instructions. Allergy warning banner if patient has known drug allergies.

**Lab Orders Step:** Checkbox list of common lab tests (CBC, Metabolic Panel, Lipid Panel, etc.). "Add Custom Test" option. Priority selector (Routine/Urgent/STAT). Notes field for special instructions.

**Erick** implemented the ICD-10 code search endpoint in the consultation controller. He loaded the ICD-10 database (~70,000 codes) and created a search API with fuzzy matching: `GET /api/v1/consultations/icd10/search?q=diabetes` returns matching codes with descriptions.

**Michael** built the prescription creation endpoint and integrated QR generation. When a prescription is saved, the system:
1. Generates unique 8-character alphanumeric code
2. Creates QR code image (PNG)
3. Uploads QR to cloud storage (Supabase)
4. Stores QR URL in prescription record

---

### 📅 Day 4 — Thursday: Prescription System & PDF Generation

**Michael** focused on the complete prescription flow:

He built the prescription controller endpoints in `/backend/crud-api/controllers/prescription.controller.js`:
- `POST /api/v1/prescriptions` — create new prescription
- `GET /api/v1/prescriptions/:id` — get prescription with medications
- `GET /api/v1/prescriptions/patient/:patientId` — patient's prescriptions
- `GET /api/v1/prescriptions/doctor/:doctorId` — doctor's issued prescriptions
- `PUT /api/v1/prescriptions/:id/void` — void a prescription

He then implemented PDF generation using the `pdfkit` library. The prescription PDF includes:
- Clinic header with logo and contact info
- Patient information (name, ID, date of birth)
- Doctor information (name, specialty, license number)
- Date of issue and prescription code
- Medications table with columns: Drug, Dosage, Frequency, Duration, Instructions
- QR code in bottom-right corner
- Doctor's digital signature placeholder
- Validity statement and legal disclaimers

**Domenica** built the frontend prescription components:
- `DoctorPrescriptions.jsx` — doctor's view of issued prescriptions with filters (date range, patient name)
- `PatientPrescriptions.jsx` — patient's view with download PDF button and renewal request option

**Erick** implemented the prescription renewal workflow:
1. Patient clicks "Request Renewal" on eligible prescription
2. System validates eligibility (not renewed in last 30 days, original prescription < 6 months old)
3. Creates renewal request with status "pending"
4. Doctor receives notification of pending renewal
5. Doctor approves (generates new prescription) or rejects (with reason)
6. Patient notified of outcome

---

### 📅 Day 5 — Friday: QR Verification & Medical Records

**Michael** built the public prescription verification page `/frontend/src/pages/VerifyPrescriptionQR.jsx`:

The page is accessible without authentication at `/verify-prescription/:code`. It shows:
- Large verification status badge (✓ Valid / ✗ Invalid / ⚠ Voided)
- Doctor's name and specialty
- Issue date
- Patient initials only (privacy protection)
- Clinic name

He also created the `PrescriptionQRModal.jsx` component that displays the QR code in a modal with options to download or share.

**Domenica** built the patient-facing medical record pages:

`MedicalRecord.jsx` allows patients to view and edit:
- Personal medical profile (allergies, conditions, medications)
- Emergency contact information
- Insurance details with policy number
- Blood type and vital information
- Family medical history (optional)

`PatientHistory.jsx` displays a timeline of medical events:
- Consultations with diagnosis summaries
- Prescriptions issued
- Lab results (linked to full results)
- Timeline filtering by event type and date range
- PDF export of complete history

**Erick** implemented the consultation controller `/backend/business-api/controllers/consultation.controller.js` with endpoints:
- `POST /api/v1/consultations/start` — initialize consultation, load patient data
- `PUT /api/v1/consultations/:id/vitals` — save vital signs
- `PUT /api/v1/consultations/:id/notes` — save SOAP notes (auto-save support)
- `POST /api/v1/consultations/:id/prescription` — create prescription
- `POST /api/v1/consultations/:id/lab-order` — create lab order
- `PUT /api/v1/consultations/:id/complete` — finalize consultation
- `GET /api/v1/consultations/patient/:patientId/history` — timeline data

---

### 📅 Day 6 — Saturday: Doctor Views & Integration

**Domenica** completed the remaining doctor pages:

`DoctorPatients.jsx` shows the doctor's patient list:
- Patients the doctor has consulted (from appointment history)
- Search by patient name or ID
- Quick access to patient's medical history
- Last consultation date and diagnosis summary
- Upcoming appointments with this patient

She also refined `DoctorConsultation.jsx` with the "Review & Complete" step:
- Summary cards showing all entered data
- Edit buttons to go back to any step
- "Complete Consultation" button with confirmation
- Option to schedule follow-up (opens mini booking flow)
- Email summary checkbox (default checked)

**Michael** integrated the prescription PDF download throughout the app:
- Doctor can download from consultation completion screen
- Doctor can download from `DoctorPrescriptions.jsx`
- Patient can download from `PatientPrescriptions.jsx`
- Email to patient includes PDF attachment option

**Erick** focused on medical data privacy and audit logging:
- All medical record access is logged in audit table
- Prescription verifications are rate-limited (10/minute per IP)
- Patient can see who accessed their records
- Sensitive data (HIV status, mental health) can be marked as restricted

The team conducted integration testing:
1. ✅ Doctor starts consultation from appointment
2. ✅ Vitals recorded with BMI calculation
3. ✅ SOAP notes saved with ICD-10 codes
4. ✅ Prescription created with QR code
5. ✅ PDF generated and downloadable
6. ✅ QR verification works from public page

---

### 📅 Day 7 — Sunday: Testing, Polish & Documentation

**Erick** ran comprehensive testing of the consultation workflow:
- Tested vital signs validation with boundary values
- Verified auto-save doesn't create duplicate records
- Confirmed prescription codes are unique across all prescriptions
- Tested concurrent consultations (multiple doctors simultaneously)
- Verified completed consultations cannot be modified

**Michael** fixed bugs found in testing:
- QR code not rendering on slow connections (added loading state)
- PDF generation failing for prescriptions with > 10 medications (pagination fix)
- Verification page showing error for recently created prescriptions (cache invalidation)

**Domenica** polished the UI:
- Added loading skeletons for consultation page
- Improved mobile responsiveness for medical record forms
- Added confirmation dialogs for destructive actions (void prescription)
- Implemented empty states for patients with no history

The team conducted the sprint demo showcasing:
1. Doctor starts consultation for checked-in patient
2. Records vitals → system flags high blood pressure
3. Documents findings in SOAP format with ICD-10 code
4. Creates prescription for blood pressure medication
5. Orders lab work (metabolic panel)
6. Completes consultation → patient receives email summary
7. Patient views prescription, downloads PDF
8. Pharmacist scans QR, verifies prescription is valid
9. Patient requests prescription renewal → doctor approves

---

## 5. Technical Challenges & Solutions

### Challenge 1: QR Code Security & Verification
**Challenge:** The QR code needed to enable prescription verification while preventing malicious actors from guessing valid prescription codes or creating fake verification pages.

**Solution:** Implemented a multi-layer security approach: (1) Prescription codes are 8-character alphanumeric with a cryptographically secure random generator (62^8 = 218 trillion combinations), (2) Verification endpoint is rate-limited to 10 requests/minute per IP, (3) Verification page shows minimal information (no medication details), (4) All verification attempts are logged with IP address for audit. Added CAPTCHA after 5 consecutive invalid codes from same IP.

---

### Challenge 2: PDF Generation with Dynamic Content
**Challenge:** Generating professional prescription PDFs with varying numbers of medications, clinic branding, and embedded QR codes required handling many edge cases.

**Solution:** Created a template-based PDF system using `pdfkit`. The template handles: (1) Automatic page breaks when medications exceed one page, (2) Dynamic positioning of QR code to always appear in the same location, (3) Clinic logo loaded from configuration, (4) Font embedding for consistent rendering across devices. Added a preview endpoint so doctors can see PDF before finalizing.

---

### Challenge 3: SOAP Notes Auto-Save Without Data Loss
**Challenge:** Auto-saving consultation notes every 30 seconds could cause data loss if the doctor was typing when the save triggered, or create version conflicts if the doctor had multiple tabs open.

**Solution:** Implemented optimistic UI with server reconciliation: (1) Frontend saves local state immediately on keystroke, (2) Auto-save sends only changed sections (diff-based), (3) Server returns latest timestamp, (4) If timestamp mismatch detected, show "Content updated elsewhere" warning, (5) On page reload, compare local and server versions and prompt doctor to choose. Added offline support using IndexedDB for emergency scenarios.

---

### Challenge 4: ICD-10 Code Search Performance
**Challenge:** The ICD-10 database contains ~70,000 codes. Searching with autocomplete needed to be fast (<200ms) while supporting fuzzy matching for medical terminology variations.

**Solution:** Loaded ICD-10 codes into memory at server startup (15MB footprint). Implemented a two-phase search: (1) Exact prefix match on code (fast), (2) Fuzzy text search on description using Levenshtein distance. Results are cached per query for 1 hour. Added a "frequently used" quick-select based on the doctor's prescription history, reducing search needs for common diagnoses.

---

### Challenge 5: Medical Data Privacy Compliance
**Challenge:** Medical records require strict access controls. Different data types have different sensitivity levels, and patients should know who accessed their records.

**Solution:** Implemented a comprehensive privacy layer: (1) All medical record access logged with user ID, timestamp, and IP, (2) Patients can view access log in their profile, (3) Certain data types (mental health, HIV status) can be marked "restricted" and require explicit doctor acknowledgment to view, (4) Prescription verification shows minimal data (no medication names publicly), (5) Export to PDF includes watermark with requester ID.

---

### Challenge 6: Prescription Renewal Business Rules
**Challenge:** Determining which prescriptions are eligible for renewal required complex business logic considering time limits, renewal count, and controlled substance restrictions.

**Solution:** Created a configurable rule engine in the prescription service: (1) Base eligibility: prescription must be < 6 months old, (2) Renewal cooldown: minimum 20 days since last renewal, (3) Max renewals: 3 per original prescription (configurable), (4) Controlled substances: require appointment (not eligible for renewal), (5) Doctor override: can approve ineligible renewals with documented reason. Rules stored in database for admin configuration.

---

### Challenge 7: Consultation Wizard State Management
**Challenge:** The 4-step consultation wizard needed to preserve state across steps, handle browser refresh, and prevent data loss if the session expires.

**Solution:** Used React Context with persistence strategy: (1) Each step save updates both server and localStorage, (2) On page load, check for in-progress consultation in localStorage, (3) If found, prompt "Resume consultation?", (4) Server endpoint validates consultation isn't already completed, (5) Session timeout shows warning at 25 minutes, (6) Auto-save triggers on step navigation and at intervals, (7) "Discard Changes" clears local state and marks consultation as abandoned in server.

---

## 6. Sprint Retrospective

### ✅ What Went Well

1. **Modular consultation wizard:** Breaking the 4-step wizard into separate components made parallel development possible. Domenica could work on UI while Erick built the backend services without blocking each other.

2. **QR verification architecture:** The decision to make verification a public, minimal-data endpoint from day one avoided security retrofitting. The pharmacist experience is simple (scan and see validity) without exposing sensitive information.

3. **Template system for SOAP notes:** Implementing templates for common conditions significantly reduces doctor documentation time. The 12 templates we created cover ~60% of consultations based on appointment data analysis.

4. **Early PDF testing:** Testing PDF generation on Day 4 (not Day 7) allowed time to handle edge cases like long medication lists and special characters in patient names.

### ⚠️ What Could Be Improved

1. **Medical terminology validation:** We didn't implement drug interaction warnings due to time constraints. This would require a medication database with interaction data—planned for future enhancement.

2. **Mobile consultation experience:** The consultation wizard is functional but not optimized for tablet use during patient visits. Larger touch targets and simplified layout would improve doctor experience.

3. **Lab order integration:** The lab order feature creates orders but lacks integration with actual laboratory systems. The workflow is currently manual (lab tech checks pending orders screen).

### 📚 Lessons Learned for Next Sprint

1. **Involve compliance early:** Medical data handling has regulatory implications. Consulting with compliance/legal on Day 1 about data retention and access logging would have saved rework on Day 6.

2. **Design for offline-first:** Medical settings may have unreliable connectivity. The consultation wizard should work offline and sync when connection returns—added to technical debt backlog.

3. **User acceptance testing with doctors:** Getting 30 minutes of feedback from an actual doctor on Day 3-4 would have identified UX issues earlier. The ICD-10 search, for example, initially required too many clicks.

---

## 📊 Sprint Metrics

| Metric | Value |
|--------|-------|
| **User Stories Completed** | 16/16 (100%) |
| **Epics Completed** | 5/5 (100%) |
| **Total Commits** | 58 |
| **Files Created/Modified** | 41 |
| **Lines of Code** | ~6,200 |
| **API Endpoints Added** | 18 |
| **PDF Templates Created** | 1 (prescription) |
| **SOAP Templates Created** | 12 |
| **Test Coverage** | Manual + critical path E2E |
| **Bugs Found in Testing** | 9 |
| **Bugs Fixed** | 9 |

---

## 📁 Deliverables

### Backend Components (Business API)
- ✅ `/backend/business-api/services/consultation.service.js` — Consultation workflow orchestration
- ✅ `/backend/business-api/controllers/consultation.controller.js` — Consultation endpoints

### Backend Components (CRUD API)
- ✅ `/backend/crud-api/controllers/medicalRecord.controller.js` — Medical record CRUD
- ✅ `/backend/crud-api/controllers/consultationNote.controller.js` — Consultation notes CRUD
- ✅ `/backend/crud-api/controllers/prescription.controller.js` — Prescription CRUD
- ✅ `/backend/crud-api/controllers/prescriptionRenewal.controller.js` — Renewal workflow
- ✅ `/backend/crud-api/repositories/medicalRecord.repository.js` — Medical record data access
- ✅ `/backend/crud-api/repositories/consultationNote.repository.js` — Notes data access
- ✅ `/backend/crud-api/repositories/prescription.repository.js` — Prescription data access
- ✅ `/backend/crud-api/repositories/prescriptionRenewal.repository.js` — Renewal data access

### Backend Components (External API)
- ✅ `/backend/external-api/services/qrCode.service.js` — QR generation and verification
- ✅ `/backend/external-api/controllers/qrCode.controller.js` — QR endpoints

### Frontend Components (Doctor)
- ✅ `/frontend/src/pages/doctor/DoctorConsultation.jsx` — 4-step consultation wizard
- ✅ `/frontend/src/pages/doctor/DoctorPrescriptions.jsx` — Prescription management
- ✅ `/frontend/src/pages/doctor/DoctorPatients.jsx` — Patient list with history access

### Frontend Components (Patient)
- ✅ `/frontend/src/pages/patient/MedicalRecord.jsx` — Medical profile management
- ✅ `/frontend/src/pages/patient/PatientHistory.jsx` — Medical history timeline
- ✅ `/frontend/src/pages/patient/PatientPrescriptions.jsx` — Prescription list with renewal

### Frontend Components (Public)
- ✅ `/frontend/src/pages/VerifyPrescriptionQR.jsx` — Public prescription verification
- ✅ `/frontend/src/components/PrescriptionQRModal.jsx` — QR display modal

### Database
- ✅ `/backend/database/migrations/004_prescription_renewals.sql` — Renewal schema

---

## ✍️ Sign-Off

| Role | Name | Date |
|------|------|------|
| Team Lead | Erick Tufiño | February 2026 |
| Developer | Michael Simbaña | February 2026 |
| Developer | Domenica Villagomez | February 2026 |

---

**Sprint 2 Status: ✅ COMPLETED**

*Prepared by the Development Team — San Miguel Clinic Medical Appointment System*
