[
  {
    "table_name": "administrators",
    "columnas": "id (uuid), user_id (uuid), permissions (ARRAY), is_super_admin (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "appointment_status",
    "columnas": "id (smallint), code (character varying), label (character varying)"
  },
  {
    "table_name": "appointments",
    "columnas": "id (uuid), patient_user_id (uuid), doctor_id (uuid), scheduled_start (timestamp with time zone), scheduled_end (timestamp with time zone), status_id (smallint), reason (text), created_at (timestamp with time zone), updated_at (timestamp with time zone), room_id (uuid), created_by_user_id (uuid), confirmed_at (timestamp with time zone), started_at (timestamp with time zone), completed_at (timestamp with time zone), checked_in_at (timestamp with time zone), consultation_room_id (uuid)"
  },
  {
    "table_name": "audit_logs",
    "columnas": "id (uuid), user_id (uuid), action (character varying), table_name (character varying), record_id (character varying), old_values (jsonb), new_values (jsonb), description (text), ip_address (inet), user_agent (text), timestamp (timestamp with time zone)"
  },
  {
    "table_name": "billing_items",
    "columnas": "id (uuid), billing_id (uuid), service_id (uuid), description (character varying), quantity (integer), unit_price (numeric), discount_percentage (numeric), total_price (numeric), added_by_user_id (uuid), notes (text), created_at (timestamp with time zone)"
  },
  {
    "table_name": "billing_summary",
    "columnas": "id (uuid), invoice_number (character varying), appointment_id (uuid), patient_user_id (uuid), patient_name (text), doctor_id (uuid), doctor_name (text), specialty_name (character varying), subtotal (numeric), insurance_discount_amount (numeric), tax_amount (numeric), total_amount (numeric), status (character varying), payment_method (character varying), payment_date (timestamp with time zone), insurance_provider (character varying), insurance_discount_rate (numeric), created_at (timestamp with time zone), item_count (bigint)"
  },
  {
    "table_name": "billings",
    "columnas": "id (uuid), appointment_id (uuid), patient_user_id (uuid), doctor_id (uuid), base_amount (numeric), specialty_multiplier (numeric), duration_multiplier (numeric), insurance_discount_percentage (numeric), insurance_discount_amount (numeric), additional_charges (numeric), total_amount (numeric), status (character varying), payment_date (timestamp with time zone), invoice_number (character varying), notes (text), created_at (timestamp with time zone), updated_at (timestamp with time zone), subtotal (numeric), tax_amount (numeric), tax_percentage (numeric), insurance_provider_id (uuid), insurance_claim_number (character varying), due_date (date), payment_method (character varying)"
  },
  {
    "table_name": "consultation_notes",
    "columnas": "id (uuid), appointment_id (uuid), doctor_id (uuid), notes (text), diagnosis (text), treatment_plan (text), prescriptions_given (text), follow_up_required (boolean), follow_up_date (date), created_at (timestamp with time zone), updated_at (timestamp with time zone), subjective (text), objective (text), assessment (text), plan (text), vital_signs (jsonb), follow_up_time (time without time zone)"
  },
  {
    "table_name": "consultation_rooms",
    "columnas": "id (uuid), name (character varying), room_number (character varying), capacity (integer), floor (integer), equipment (ARRAY), is_available (boolean), notes (text), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "doctor_average_ratings",
    "columnas": "doctor_id (uuid), user_id (uuid), first_name (character varying), last_name (character varying), specialty_name (character varying), total_ratings (bigint), average_rating (numeric), average_punctuality (numeric), average_attention (numeric), average_recommendation (numeric)"
  },
  {
    "table_name": "doctor_ratings",
    "columnas": "id (uuid), doctor_id (uuid), patient_user_id (uuid), appointment_id (uuid), rating (integer), punctuality_rating (integer), attention_rating (integer), recommendation_rating (integer), comment (text), is_anonymous (boolean), is_active (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "doctor_schedules",
    "columnas": "id (uuid), doctor_id (uuid), day_of_week (smallint), start_time (time without time zone), end_time (time without time zone), is_working_day (boolean), break_start_time (time without time zone), break_end_time (time without time zone), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "doctors",
    "columnas": "id (uuid), user_id (uuid), professional_id (character varying), specialty_id (uuid), bio (text), active (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "insurance_providers",
    "columnas": "id (uuid), name (character varying), code (character varying), discount_percentage (numeric), coverage_types (ARRAY), contact_phone (character varying), contact_email (character varying), is_active (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "lab_reports",
    "columnas": "id (uuid), patient_user_id (uuid), doctor_id (uuid), appointment_id (uuid), test_name (text), order_date (date), doctor_notes (text), status (text), created_at (timestamp with time zone)"
  },
  {
    "table_name": "lab_results",
    "columnas": "id (uuid), report_id (uuid), parameter_name (text), result_value (text), unit (text), reference_range (text), status (text)"
  },
  {
    "table_name": "medical_records",
    "columnas": "id (uuid), patient_user_id (uuid), allergies (text), diagnoses (text), treatments (text), prescriptions (text), medical_history (text), current_medications (text), last_updated_by_doctor_id (uuid), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "medical_services",
    "columnas": "id (uuid), name (character varying), description (text), category (character varying), base_price (numeric), specialty_id (uuid), is_active (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "metrics_cache",
    "columnas": "id (uuid), doctor_id (uuid), specialty_id (uuid), metric_date (date), total_consultations (integer), attendance_rate (numeric), average_consultation_time (numeric), cancellation_ratio (numeric), patient_satisfaction_index (numeric), operational_efficiency_index (numeric), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "password_resets",
    "columnas": "id (uuid), user_id (uuid), token (character varying), expires_at (timestamp with time zone), used (boolean), created_at (timestamp with time zone)"
  },
  {
    "table_name": "patients",
    "columnas": "id (uuid), user_id (uuid), date_of_birth (date), gender (character varying), address (character varying), city (character varying), state (character varying), postal_code (character varying), country (character varying), insurance_plan (character varying), insurance_number (character varying), emergency_contact_name (character varying), emergency_contact_phone (character varying), allergies (text), medical_conditions (text), current_medications (text), created_at (timestamp with time zone), updated_at (timestamp with time zone), blood_type (character varying), height (numeric), weight (numeric), emergency_contact_relation (character varying), home_phone (character varying)"
  },
  {
    "table_name": "prescription_qr_codes",
    "columnas": "id (bigint), prescription_id (uuid), qr_token (character varying), verification_url (text), is_valid (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone), qr_image (text)"
  },
  {
    "table_name": "prescription_renewals",
    "columnas": "id (uuid), original_prescription_id (uuid), patient_user_id (uuid), doctor_id (uuid), new_prescription_id (uuid), status (character varying), request_reason (text), patient_notes (text), doctor_response (text), rejection_reason (text), requested_at (timestamp with time zone), reviewed_at (timestamp with time zone), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  },
  {
    "table_name": "prescriptions",
    "columnas": "id (uuid), patient_user_id (uuid), doctor_id (uuid), diagnosis (text), medications (text), instructions (text), duration (character varying), created_at (timestamp with time zone), updated_at (timestamp with time zone), appointment_id (uuid)"
  },
  {
    "table_name": "qr_access_logs",
    "columnas": "id (bigint), qr_token (character varying), prescription_id (uuid), action (character varying), ip_address (inet), accessed_at (timestamp with time zone)"
  },
  {
    "table_name": "reminders",
    "columnas": "id (uuid), appointment_id (uuid), reminder_type (character varying), scheduled_send_time (timestamp with time zone), sent_at (timestamp with time zone), send_status (character varying), message_content (text), recipient_email (character varying), recipient_phone (character varying), retry_count (integer), created_at (timestamp with time zone)"
  },
  {
    "table_name": "roles",
    "columnas": "id (uuid), name (character varying), description (text), code (character varying), label (character varying)"
  },
  {
    "table_name": "satisfaction_surveys",
    "columnas": "id (uuid), appointment_id (uuid), patient_user_id (uuid), doctor_id (uuid), doctor_professionalism_rating (smallint), punctuality_rating (smallint), facilities_rating (smallint), overall_rating (smallint), comments (text), survey_date (date), created_at (timestamp with time zone)"
  },
  {
    "table_name": "schedule_exceptions",
    "columnas": "id (uuid), doctor_id (uuid), exception_date (date), exception_type (character varying), reason (text), is_all_day (boolean), exception_start_time (time without time zone), exception_end_time (time without time zone), created_at (timestamp with time zone), status (character varying), admin_notes (text), reviewed_at (timestamp with time zone), reviewed_by (uuid)"
  },
  {
    "table_name": "specialties",
    "columnas": "id (uuid), name (character varying), description (text), consultation_fee (numeric)"
  },
  {
    "table_name": "users",
    "columnas": "id (uuid), email (character varying), password_hash (character varying), is_email_verified (boolean), role_id (uuid), created_at (timestamp with time zone), updated_at (timestamp with time zone), first_name (character varying), last_name (character varying), phone_number (character varying), is_active (boolean), cedula (character varying), google_id (character varying)"
  },
  {
    "table_name": "vw_appointments_full",
    "columnas": "appointment_id (uuid), scheduled_start (timestamp with time zone), scheduled_end (timestamp with time zone), reason (text), status_code (character varying), status_label (character varying), patient_user_id (uuid), patient_first_name (character varying), patient_last_name (character varying), patient_email (character varying), doctor_id (uuid), doctor_first_name (character varying), doctor_last_name (character varying), doctor_email (character varying), specialty_name (character varying), room_name (character varying), room_number (character varying)"
  },
  {
    "table_name": "vw_doctors_full",
    "columnas": "doctor_id (uuid), user_id (uuid), professional_id (character varying), bio (text), active (boolean), email (character varying), first_name (character varying), last_name (character varying), phone_number (character varying), cedula (character varying), specialty_name (character varying), specialty_id (uuid)"
  },
  {
    "table_name": "vw_patients_full",
    "columnas": "patient_id (uuid), user_id (uuid), date_of_birth (date), gender (character varying), address (character varying), city (character varying), insurance_plan (character varying), email (character varying), first_name (character varying), last_name (character varying), phone_number (character varying), cedula (character varying)"
  },
  {
    "table_name": "waiting_list",
    "columnas": "id (uuid), patient_user_id (uuid), doctor_id (uuid), preferred_date (date), preferred_time_start (time without time zone), preferred_time_end (time without time zone), priority (integer), reason (text), notes (text), status (character varying), notified_at (timestamp with time zone), booked_at (timestamp with time zone), is_active (boolean), created_at (timestamp with time zone), updated_at (timestamp with time zone)"
  }
]