# 📊 System-Wide UML Class Diagram

## Medical Appointment Management System - San Miguel Clinic

---

```mermaid
classDiagram
    direction TB

    %% ============================================
    %% CORE USER MANAGEMENT (CRUD API)
    %% ============================================

    class User {
        <<CRUD>>
        +int id
        +string email
        +string password_hash
        +string first_name
        +string last_name
        +UserRole role
        +boolean is_active
        +boolean is_email_verified
        +string phone
        +string avatar_url
        +datetime created_at
        +datetime updated_at
        +login()
        +logout()
        +changePassword()
        +resetPassword()
    }

    class Patient {
        <<CRUD>>
        +int id
        +int user_id
        +date date_of_birth
        +Gender gender
        +string phone
        +string address
        +string emergency_contact_name
        +string emergency_contact_phone
        +string blood_type
        +string[] allergies
        +int insurance_provider_id
        +string policy_number
        +updateProfile()
        +getAppointments()
        +getMedicalHistory()
    }

    class Doctor {
        <<CRUD>>
        +int id
        +int user_id
        +int specialty_id
        +string license_number
        +decimal consultation_fee
        +string bio
        +decimal average_rating
        +int total_ratings
        +boolean is_active
        +updateProfile()
        +getPatients()
        +getSchedule()
    }

    class Administrator {
        <<CRUD>>
        +int id
        +int user_id
        +boolean is_super_admin
        +json permissions
        +manageUsers()
        +manageSystem()
    }

    class Role {
        <<CRUD>>
        +int id
        +string name
        +string description
        +json permissions
        +int user_count
    }

    %% ============================================
    %% MEDICAL SPECIALTIES & ROOMS (CRUD API)
    %% ============================================

    class Specialty {
        <<CRUD>>
        +int id
        +string name
        +string description
        +boolean is_active
        +int doctor_count
    }

    class ConsultationRoom {
        <<CRUD>>
        +int id
        +string name
        +string floor
        +string building
        +int capacity
        +boolean is_available
        +string[] equipment
        +updateAvailability()
    }

    %% ============================================
    %% SCHEDULING SYSTEM (CRUD + BUSINESS API)
    %% ============================================

    class Schedule {
        <<CRUD>>
        +int id
        +int doctor_id
        +DayOfWeek day_of_week
        +time start_time
        +time end_time
        +boolean is_active
        +createBulk()
    }

    class ScheduleException {
        <<CRUD>>
        +int id
        +int doctor_id
        +date exception_date
        +ExceptionType exception_type
        +string reason
        +time start_time
        +time end_time
        +ExceptionStatus status
        +approve()
        +reject()
    }

    class Appointment {
        <<CRUD>>
        +int id
        +int patient_id
        +int doctor_id
        +int specialty_id
        +int consultation_room_id
        +date appointment_date
        +time start_time
        +time end_time
        +AppointmentStatus status
        +string reason
        +string notes
        +string confirmation_code
        +datetime check_in_time
        +boolean is_follow_up
        +int parent_appointment_id
        +datetime created_at
        +confirm()
        +cancel()
        +reschedule()
        +checkIn()
        +markNoShow()
    }

    class WaitingList {
        <<CRUD>>
        +int id
        +int patient_id
        +int doctor_id
        +int specialty_id
        +string[] preferred_dates
        +string[] preferred_times
        +string notes
        +WaitingStatus status
        +datetime created_at
        +notifyAvailability()
    }

    %% ============================================
    %% CLINICAL RECORDS (CRUD API)
    %% ============================================

    class MedicalRecord {
        <<CRUD>>
        +int id
        +int patient_id
        +string[] chronic_conditions
        +string[] current_medications
        +string[] surgical_history
        +string family_history
        +string lifestyle_info
        +datetime updated_at
        +addEntry()
        +getTimeline()
    }

    class ConsultationNote {
        <<CRUD>>
        +int id
        +int appointment_id
        +string subjective
        +string objective
        +string assessment
        +string plan
        +datetime created_at
        +datetime updated_at
    }

    class LabReport {
        <<CRUD>>
        +int id
        +int patient_id
        +int appointment_id
        +int doctor_id
        +string test_name
        +string test_description
        +LabPriority priority
        +LabStatus status
        +json results
        +string result_file_url
        +string notes
        +datetime created_at
        +datetime completed_at
        +uploadResults()
        +updateStatus()
    }

    %% ============================================
    %% PRESCRIPTIONS (CRUD API)
    %% ============================================

    class Prescription {
        <<CRUD>>
        +int id
        +int appointment_id
        +int patient_id
        +int doctor_id
        +Medication[] medications
        +string instructions
        +date valid_until
        +boolean is_active
        +string qr_code
        +string qr_token
        +datetime created_at
        +generateQR()
        +verify()
        +deactivate()
    }

    class Medication {
        <<CRUD>>
        +string name
        +string dosage
        +string duration
        +string instructions
    }

    class PrescriptionRenewal {
        <<CRUD>>
        +int id
        +int prescription_id
        +int patient_id
        +string reason
        +RenewalStatus status
        +int new_prescription_id
        +datetime requested_at
        +datetime processed_at
        +approve()
        +reject()
    }

    %% ============================================
    %% BILLING & INSURANCE (CRUD + BUSINESS API)
    %% ============================================

    class Billing {
        <<CRUD>>
        +int id
        +int appointment_id
        +int patient_id
        +decimal subtotal
        +decimal tax
        +decimal discount
        +decimal insurance_covered
        +decimal total
        +BillingStatus status
        +string payment_method
        +datetime payment_date
        +string notes
        +datetime created_at
        +processPayment()
        +applyInsurance()
        +void()
    }

    class BillingItem {
        <<CRUD>>
        +int id
        +int billing_id
        +int medical_service_id
        +string description
        +int quantity
        +decimal unit_price
        +decimal total
    }

    class MedicalService {
        <<CRUD>>
        +int id
        +string name
        +string description
        +decimal base_price
        +string category
        +int specialty_id
        +boolean is_active
    }

    class InsuranceProvider {
        <<CRUD>>
        +int id
        +string name
        +string code
        +decimal coverage_percentage
        +string contact_phone
        +string contact_email
        +boolean is_active
        +verifyCoverage()
    }

    %% ============================================
    %% QUALITY & RATINGS (CRUD API)
    %% ============================================

    class DoctorRating {
        <<CRUD>>
        +int id
        +int appointment_id
        +int doctor_id
        +int patient_id
        +int rating
        +string comment
        +datetime created_at
    }

    class SatisfactionSurvey {
        <<CRUD>>
        +int id
        +int appointment_id
        +int patient_id
        +int overall_rating
        +int wait_time_rating
        +int cleanliness_rating
        +int staff_rating
        +string comments
        +datetime created_at
    }

    %% ============================================
    %% NOTIFICATIONS (EXTERNAL API)
    %% ============================================

    class Notification {
        <<EXTERNAL>>
        +int id
        +int user_id
        +string title
        +string message
        +NotificationType type
        +boolean is_read
        +datetime created_at
        +markAsRead()
        +delete()
    }

    class Reminder {
        <<EXTERNAL>>
        +int id
        +int appointment_id
        +datetime reminder_time
        +ReminderType type
        +ReminderStatus status
        +datetime sent_at
        +send()
        +cancel()
    }

    %% ============================================
    %% SECURITY & AUDIT (CRUD API)
    %% ============================================

    class AuditLog {
        <<CRUD>>
        +int id
        +int user_id
        +string action
        +string entity_type
        +int entity_id
        +json old_values
        +json new_values
        +string ip_address
        +datetime created_at
    }

    class PasswordReset {
        <<CRUD>>
        +int id
        +int user_id
        +string token_hash
        +datetime expires_at
        +boolean is_used
        +datetime created_at
        +validate()
        +invalidate()
    }

    %% ============================================
    %% BUSINESS SERVICES (BUSINESS API)
    %% ============================================

    class AvailabilityService {
        <<BUSINESS>>
        +getAvailableSlots(doctorId, date)
        +getWeeklyAvailability(doctorId, startDate)
        +getNextAvailableSlot(doctorId)
        +checkSlotAvailability(doctorId, date, time)
    }

    class SchedulingService {
        <<BUSINESS>>
        +bookAppointment(data)
        +rescheduleAppointment(id, newDate, newTime)
        +cancelAppointment(id, reason)
        +confirmAppointment(id)
        +startConsultation(id)
        +completeConsultation(id)
        +markNoShow(id)
    }

    class ConsultationService {
        <<BUSINESS>>
        +startConsultation(appointmentId)
        +completeConsultation(appointmentId, notes)
        +getPatientSummary(patientUserId)
        +addPrescription(appointmentId, medications)
        +createFollowUp(appointmentId)
    }

    class BillingCalculationService {
        <<BUSINESS>>
        +calculateBilling(appointmentId)
        +generateBilling(appointmentId)
        +processPayment(billingId, amount, method)
        +applyInsuranceClaim(billingId, providerId, amount)
        +getStatistics()
    }

    class ReportService {
        <<BUSINESS>>
        +getAppointmentsReport(filters)
        +getProductivityReport()
        +getPatientFlowReport()
        +getRevenueReport()
        +getSpecialtyDemandReport()
        +getGeneralStats()
        +getDoctorStats()
        +getAdvancedStats()
    }

    class ValidationService {
        <<BUSINESS>>
        +validateAppointment(data)
        +validateSchedule(data)
        +validateMedicalRecord(data)
        +validatePrescription(data)
        +validatePatientProfile(patientUserId)
    }

    %% ============================================
    %% EXTERNAL SERVICES (EXTERNAL API)
    %% ============================================

    class AuthService {
        <<EXTERNAL>>
        +register(userData)
        +login(email, password)
        +loginWithGoogle()
        +requestPasswordReset(email)
        +confirmPasswordReset(token, newPassword)
        +changePassword(currentPassword, newPassword)
        +refreshToken(refreshToken)
        +logout()
    }

    class NotificationService {
        <<EXTERNAL>>
        +getUserNotifications(userId)
        +getUnreadCount(userId)
        +markAsRead(notificationId)
        +sendAppointmentConfirmation(appointmentId)
        +sendAppointmentCancellation(appointmentId)
        +sendPrescriptionNotification(prescriptionId)
        +sendCustomNotification(userId, title, message)
        +createBroadcast(title, message, recipients)
    }

    class QRCodeService {
        <<EXTERNAL>>
        +generatePrescriptionQR(prescriptionId)
        +generateAppointmentQR(appointmentId)
        +generatePatientCheckInQR(patientId)
        +verifyPrescription(token)
        +verifyQRCode(content)
    }

    class ReminderService {
        <<EXTERNAL>>
        +processReminders()
        +createReminder(appointmentId, reminderTime, type)
        +getPendingCount()
        +getDueReminders(hours)
        +getReminderHistory(appointmentId)
        +cancelReminders(appointmentId)
    }

    %% ============================================
    %% ENUMERATIONS
    %% ============================================

    class UserRole {
        <<enumeration>>
        patient
        doctor
        admin
    }

    class Gender {
        <<enumeration>>
        male
        female
        other
    }

    class DayOfWeek {
        <<enumeration>>
        0_Sunday
        1_Monday
        2_Tuesday
        3_Wednesday
        4_Thursday
        5_Friday
        6_Saturday
    }

    class AppointmentStatus {
        <<enumeration>>
        pending
        confirmed
        in_progress
        completed
        cancelled
        no_show
    }

    class ExceptionType {
        <<enumeration>>
        vacation
        sick_leave
        personal
        other
    }

    class ExceptionStatus {
        <<enumeration>>
        pending
        approved
        rejected
    }

    class LabPriority {
        <<enumeration>>
        routine
        urgent
        stat
    }

    class LabStatus {
        <<enumeration>>
        pending
        sample_collected
        processing
        completed
    }

    class BillingStatus {
        <<enumeration>>
        pending
        paid
        cancelled
        refunded
    }

    class RenewalStatus {
        <<enumeration>>
        pending
        approved
        rejected
    }

    class WaitingStatus {
        <<enumeration>>
        waiting
        notified
        booked
        cancelled
    }

    class NotificationType {
        <<enumeration>>
        appointment
        prescription
        lab_result
        billing
        system
    }

    class ReminderType {
        <<enumeration>>
        email
        sms
    }

    class ReminderStatus {
        <<enumeration>>
        pending
        sent
        failed
        cancelled
    }

    %% ============================================
    %% RELATIONSHIPS
    %% ============================================

    %% User Hierarchy
    User "1" -- "0..1" Patient : has profile
    User "1" -- "0..1" Doctor : has profile
    User "1" -- "0..1" Administrator : has profile
    User "*" -- "1" Role : belongs to

    %% Doctor Relations
    Doctor "*" -- "1" Specialty : practices
    Doctor "1" -- "*" Schedule : has
    Doctor "1" -- "*" ScheduleException : has
    Doctor "1" -- "*" Appointment : attends
    Doctor "1" -- "*" DoctorRating : receives
    Doctor "1" -- "*" Prescription : issues
    Doctor "1" -- "*" LabReport : orders

    %% Patient Relations
    Patient "1" -- "*" Appointment : books
    Patient "1" -- "1" MedicalRecord : has
    Patient "1" -- "*" Prescription : receives
    Patient "1" -- "*" LabReport : has
    Patient "1" -- "*" DoctorRating : gives
    Patient "1" -- "*" SatisfactionSurvey : submits
    Patient "1" -- "*" PrescriptionRenewal : requests
    Patient "1" -- "*" WaitingList : enrolled in
    Patient "*" -- "0..1" InsuranceProvider : insured by

    %% Appointment Relations
    Appointment "*" -- "1" Specialty : for
    Appointment "*" -- "0..1" ConsultationRoom : held in
    Appointment "1" -- "0..1" ConsultationNote : documented by
    Appointment "1" -- "*" Prescription : generates
    Appointment "1" -- "*" LabReport : generates
    Appointment "1" -- "0..1" Billing : billed as
    Appointment "1" -- "0..1" DoctorRating : rated in
    Appointment "1" -- "0..1" SatisfactionSurvey : surveyed in
    Appointment "1" -- "*" Reminder : has
    Appointment "0..1" -- "*" Appointment : follow-up of

    %% Prescription Relations
    Prescription "1" o-- "*" Medication : contains
    Prescription "1" -- "*" PrescriptionRenewal : renewed by

    %% Billing Relations
    Billing "1" o-- "*" BillingItem : contains
    BillingItem "*" -- "0..1" MedicalService : references

    %% Medical Service Relations
    MedicalService "*" -- "0..1" Specialty : belongs to

    %% Notification Relations
    User "1" -- "*" Notification : receives
    User "1" -- "*" AuditLog : generates
    User "1" -- "*" PasswordReset : requests

    %% Business Services (Dependencies)
    AvailabilityService ..> Schedule : uses
    AvailabilityService ..> ScheduleException : uses
    AvailabilityService ..> Appointment : uses

    SchedulingService ..> Appointment : manages
    SchedulingService ..> AvailabilityService : uses

    ConsultationService ..> Appointment : manages
    ConsultationService ..> ConsultationNote : creates
    ConsultationService ..> Prescription : creates
    ConsultationService ..> MedicalRecord : reads

    BillingCalculationService ..> Billing : manages
    BillingCalculationService ..> BillingItem : manages
    BillingCalculationService ..> InsuranceProvider : uses

    ReportService ..> Appointment : aggregates
    ReportService ..> Billing : aggregates
    ReportService ..> DoctorRating : aggregates

    %% External Services (Dependencies)
    AuthService ..> User : manages
    AuthService ..> PasswordReset : manages

    NotificationService ..> Notification : manages
    NotificationService ..> User : notifies

    QRCodeService ..> Prescription : generates for
    QRCodeService ..> Appointment : generates for

    ReminderService ..> Reminder : manages
    ReminderService ..> Appointment : references
```

---

## 📝 Modeling Notes

1. **Stereotype Annotations**: Each class is annotated with `<<CRUD>>`, `<<BUSINESS>>`, or `<<EXTERNAL>>` indicating which microservice primarily manages it. CRUD API handles data persistence, Business API handles complex logic, External API handles integrations.

2. **User Role Polymorphism**: The system uses a composition pattern where `User` has optional one-to-one relationships with `Patient`, `Doctor`, and `Administrator` profiles. The `role` field in `User` determines which profile is active.

3. **Medication as Value Object**: `Medication` is modeled as a value object (part of `Prescription`) rather than a separate entity since it's always stored as JSON within prescriptions and doesn't have independent identity.

4. **LabReport vs MedicalRecord**: `LabReport` represents individual lab test orders/results, while `MedicalRecord` is a summary record containing aggregated patient health information. They are related through the patient but serve different purposes.

5. **Follow-up Appointments**: Self-referential relationship on `Appointment` (`parent_appointment_id`) allows tracking follow-up chains while maintaining appointment independence.

6. **Schedule Exception Workflow**: `ScheduleException` has a `status` field supporting an approval workflow (pending → approved/rejected) for doctor absence requests.

7. **Billing Calculation Flow**: The `BillingCalculationService` orchestrates the creation of `Billing` and `BillingItem` records, applying insurance calculations from `InsuranceProvider`.

8. **QR Code Storage**: `Prescription` stores both `qr_code` (base64 image) and `qr_token` (verification token) for flexible verification scenarios.

9. **Audit Logging**: All significant operations generate `AuditLog` entries through middleware, storing before/after values as JSON for change tracking.

10. **TODO: Verify** - The relationship between `ConsultationRoom` and `Schedule` is not explicitly defined in the API; rooms appear to be assigned per-appointment rather than per-schedule block.

---

## 🏗️ Architecture Layers

| Layer | Microservice | Port | Responsibility |
|-------|--------------|------|----------------|
| **Data** | CRUD API | 3001 | Entity persistence, basic CRUD operations |
| **Logic** | Business API | 3002 | Complex workflows, calculations, validations |
| **Integration** | External API | 3003 | Authentication, notifications, QR codes, reminders |

---

*Document Version: 1.0*  
*Based on: API_DOCUMENTATION.md v2.0 and PRODUCT_BACKLOG_EN.md*  
*Last Updated: February 2026*
