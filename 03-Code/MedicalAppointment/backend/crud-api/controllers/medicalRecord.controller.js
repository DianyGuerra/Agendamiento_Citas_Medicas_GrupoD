/**
 * Medical Record Controller
 * Handles HTTP requests for Medical Record CRUD operations
 * 
 * @module crud-api/controllers/MedicalRecordController
 */

const medicalRecordRepository = require('../repositories/medicalRecord.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError } = require('../../shared/errors');
const { supabase } = require('../../shared/config/database.config');
const { createAuditLog, AuditActions } = require('../../shared/utils/audit.utils');

class MedicalRecordController {
  /**
   * GET /medical-records
   * Get current patient's medical record
   */
  getByPatient = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;
    
    const record = await medicalRecordRepository.findOrCreate(patientUserId);

    return ResponseBuilder.success(res, record);
  });

  /**
   * GET /medical-records/lab-reports
   * Get current patient's lab reports
   */
  getLabReports = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;
    
    const { data, error } = await supabase
      .from('lab_reports')
      .select(`
        id,
        test_name,
        order_date,
        doctor_notes,
        status,
        created_at,
        doctors (
          id,
          users (
            first_name,
            last_name
          )
        ),
        lab_results (
          id,
          parameter_name,
          result_value,
          unit,
          reference_range,
          status
        )
      `)
      .eq('patient_user_id', patientUserId)
      .order('order_date', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform data for frontend
    const reports = (data || []).map(report => {
      const doctorFirstName = report.doctors?.users?.first_name || '';
      const doctorLastName = report.doctors?.users?.last_name || '';
      const doctorFullName = doctorFirstName && doctorLastName 
        ? `Dr. ${doctorFirstName} ${doctorLastName}`
        : 'Dr. Desconocido';
      
      return {
        id: report.id,
        test_name: report.test_name,
        order_date: report.order_date,
        doctor_notes: report.doctor_notes,
        status: report.status,
        created_at: report.created_at,
        doctor_first_name: doctorFirstName,
        doctor_last_name: doctorLastName,
        doctor_full_name: doctorFullName,
        lab_results: report.lab_results || []
      };
    });

    return ResponseBuilder.success(res, reports);
  });

  /**
   * GET /medical-records/:patientId
   * Get medical record by patient ID (doctor/admin)
   * Returns empty object if no record exists (instead of 404)
   */
  getById = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    
    const record = await medicalRecordRepository.findByPatient(patientId);
    
    // Return empty object instead of 404 if no record exists
    // This is friendlier for checking if a patient has medical history
    if (!record) {
      return ResponseBuilder.success(res, null, 200, 'No hay historial médico registrado');
    }

    return ResponseBuilder.success(res, record);
  });

  /**
   * PUT /medical-records
   * Update current patient's medical record
   */
  update = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;
    const updateData = req.body;

    // Ensure record exists
    await medicalRecordRepository.findOrCreate(patientUserId);

    const updated = await medicalRecordRepository.updateByPatient(patientUserId, updateData);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.MEDICAL_RECORD_UPDATED,
      tableName: 'medical_records',
      recordId: updated.id,
      newValues: Object.keys(updateData),
      description: `Historial médico actualizado por paciente`,
      req
    });

    return ResponseBuilder.success(res, updated, 200, 'Historial médico actualizado');
  });

  /**
   * PUT /medical-records/:patientId
   * Update medical record by patient ID (doctor/admin)
   */
  updateByPatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const updateData = req.body;
    const doctorUserId = req.user.id;

    // Get doctor ID from doctors table (if user is a doctor)
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .single();

    // Find or create medical record
    const existing = await medicalRecordRepository.findByPatient(patientId);  /// Correccion de error de ESLint: no-unused-vars, esta variable se usa para decidir si crear o no el registro

    if (!existing) {
      // Create if doesn't exist
      await medicalRecordRepository.create({
        patient_user_id: patientId,
        last_updated_by_doctor_id: doctor?.id
      });
    }

    // Add last_updated_by_doctor_id to update data
    if (doctor?.id) {
      updateData.last_updated_by_doctor_id = doctor.id;
    }

    const updated = await medicalRecordRepository.updateByPatient(patientId, updateData);

    // Audit log
    createAuditLog({
      userId: req.user.id,
      action: AuditActions.MEDICAL_RECORD_UPDATED,
      tableName: 'medical_records',
      recordId: updated.id,
      newValues: Object.keys(updateData),
      description: `Historial médico del paciente ${patientId} actualizado por doctor/admin`,
      req
    });

    return ResponseBuilder.success(res, updated, 200, 'Historial médico actualizado');
  });

  /**
   * POST /medical-records
   * Add entry to a patient's medical record (doctor only)
   * Used for lab orders, notes, etc.
   * Note: The medical_records table uses a single-row-per-patient model with JSONB fields
   */
  create = asyncHandler(async (req, res) => {
    const { patient_id, record_type, notes } = req.body;
    const doctorUserId = req.user.id;

    if (!patient_id) {
      return ResponseBuilder.error(res, 'patient_id is required', 400);
    }

    // Get doctor ID from doctors table
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .single();

    // Get or create patient's medical record
    let record = await medicalRecordRepository.findByPatient(patient_id);
    
    if (!record) {
      // Create new record for patient
      record = await medicalRecordRepository.create({
        patient_user_id: patient_id,
        last_updated_by_doctor_id: doctor?.id
      });
    }

    // If this is a lab order, append to treatments field as JSON
    if (record_type === 'lab_order' && notes) {
      const currentTreatments = record.treatments || [];
      const parsedNotes = typeof notes === 'string' ? JSON.parse(notes) : notes;
      
      const newTreatment = {
        type: 'lab_order',
        data: parsedNotes,
        added_at: new Date().toISOString(),
        added_by_doctor_id: doctor?.id
      };

      const updatedTreatments = [...currentTreatments, newTreatment];
      
      const updated = await medicalRecordRepository.updateByPatient(patient_id, {
        treatments: updatedTreatments,
        last_updated_by_doctor_id: doctor?.id
      });

      return ResponseBuilder.created(res, updated, 'Orden de laboratorio agregada');
    }

    // For other types, just return success (future expansion)
    return ResponseBuilder.success(res, record, 200, 'Registro médico procesado');
  });

  /**
   * POST /medical-records/lab-reports
   * Create lab report/order for a patient (doctor only)
   * Saves to lab_reports table
   */
  createLabReport = asyncHandler(async (req, res) => {
    const { patient_id, appointment_id, test_name, doctor_notes, orders } = req.body;
    const doctorUserId = req.user.id;

    if (!patient_id) {
      return ResponseBuilder.error(res, 'patient_id is required', 400);
    }

    // Get doctor ID
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .single();

    if (!doctor) {
      return ResponseBuilder.error(res, 'Doctor not found', 404);
    }

    // If orders array is provided, create multiple lab reports
    if (orders && Array.isArray(orders)) {
      const createdReports = [];
      
      for (const order of orders) {
        const { data: report, error } = await supabase
          .from('lab_reports')
          .insert({
            patient_user_id: patient_id,
            doctor_id: doctor.id,
            appointment_id: appointment_id || null,
            test_name: order.test_name,
            order_date: new Date().toISOString().split('T')[0],
            doctor_notes: order.notes || doctor_notes || null,
            status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating lab report:', error);
          continue;
        }
        createdReports.push(report);
      }

      return ResponseBuilder.created(res, createdReports, 'Órdenes de laboratorio creadas');
    }

    // Single lab report
    if (!test_name) {
      return ResponseBuilder.error(res, 'test_name is required', 400);
    }

    const { data: report, error } = await supabase
      .from('lab_reports')
      .insert({
        patient_user_id: patient_id,
        doctor_id: doctor.id,
        appointment_id: appointment_id || null,
        test_name,
        order_date: new Date().toISOString().split('T')[0],
        doctor_notes: doctor_notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.created(res, report, 'Orden de laboratorio creada');
  });

  /**
   * GET /medical-records/lab-reports/appointment/:appointmentId
   * Get lab reports for a specific appointment (doctor)
   */
  getLabReportsByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const { data, error } = await supabase
      .from('lab_reports')
      .select(`
        id,
        test_name,
        order_date,
        doctor_notes,
        status,
        created_at
      `)
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.success(res, data || []);
  });

  /**
   * GET /medical-records/lab-reports/doctor
   * Get all lab reports for current doctor's patients
   */
  getDoctorLabReports = asyncHandler(async (req, res) => {
    const doctorUserId = req.user.id;
    const { status } = req.query;

    // Get doctor ID
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .single();

    if (!doctor) {
      return ResponseBuilder.error(res, 'Doctor not found', 404);
    }

    // Query lab_reports - join with users directly since patient_user_id references users.id
    let query = supabase
      .from('lab_reports')
      .select(`
        id,
        test_name,
        order_date,
        doctor_notes,
        status,
        created_at,
        patient_user_id,
        appointment_id
      `)
      .eq('doctor_id', doctor.id)
      .order('order_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!reports || reports.length === 0) {
      return ResponseBuilder.success(res, []);
    }

    // Get unique patient user IDs to fetch their names
    const patientUserIds = [...new Set(reports.map(r => r.patient_user_id).filter(Boolean))];
    
    // Fetch user names
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', patientUserIds);

    const userMap = {};
    (users || []).forEach(u => {
      userMap[u.id] = `${u.first_name} ${u.last_name}`;
    });

    // Fetch lab_results for all reports
    const reportIds = reports.map(r => r.id);
    const { data: allResults } = await supabase
      .from('lab_results')
      .select('id, report_id, parameter_name, result_value, unit, reference_range, status')
      .in('report_id', reportIds);

    // Group results by report_id
    const resultsMap = {};
    (allResults || []).forEach(result => {
      if (!resultsMap[result.report_id]) {
        resultsMap[result.report_id] = [];
      }
      resultsMap[result.report_id].push(result);
    });

    // Transform data
    const transformedReports = reports.map(report => ({
      id: report.id,
      test_name: report.test_name,
      order_date: report.order_date,
      doctor_notes: report.doctor_notes,
      status: report.status,
      created_at: report.created_at,
      patient_user_id: report.patient_user_id,
      appointment_id: report.appointment_id,
      patient_name: userMap[report.patient_user_id] || 'Paciente desconocido',
      lab_results: resultsMap[report.id] || []
    }));

    return ResponseBuilder.success(res, transformedReports);
  });

  /**
   * PUT /medical-records/lab-reports/:reportId/results
   * Upload results for a lab report (doctor)
   */
  uploadLabResults = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { results, interpretation, status: newStatus } = req.body;
    const doctorUserId = req.user.id;

    // Verify doctor owns this report
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', doctorUserId)
      .single();

    if (!doctor) {
      return ResponseBuilder.error(res, 'Doctor not found', 404);
    }

    const { data: report } = await supabase
      .from('lab_reports')
      .select('id, doctor_id')
      .eq('id', reportId)
      .single();

    if (!report) {
      return ResponseBuilder.notFound(res, 'Lab report not found');
    }

    if (report.doctor_id !== doctor.id) {
      return ResponseBuilder.error(res, 'Not authorized to modify this report', 403);
    }

    // Update report status
    const { error: updateError } = await supabase
      .from('lab_reports')
      .update({
        status: newStatus || 'completed',
        doctor_notes: interpretation || null
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Insert lab results (array of parameters)
    if (results && Array.isArray(results) && results.length > 0) {
      const labResultsToInsert = results.map(r => ({
        report_id: reportId,
        parameter_name: r.parameter_name || r.name,
        result_value: r.result_value || r.value,
        unit: r.unit || null,
        reference_range: r.reference_range || r.range || null,
        status: r.status || 'normal'
      }));

      const { error: resultsError } = await supabase
        .from('lab_results')
        .insert(labResultsToInsert);

      if (resultsError) {
        console.error('Error inserting lab results:', resultsError);
      }
    }

    return ResponseBuilder.success(res, null, 200, 'Resultados subidos exitosamente');
  });

  /**
   * POST /medical-records/lab-reports/patient-upload
   * Allow patient to upload their own lab results (external labs)
   */
  patientUploadLabReport = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;
    const { test_name, lab_name, order_date, results, notes } = req.body;

    if (!test_name) {
      return ResponseBuilder.error(res, 'test_name is required', 400);
    }

    // Create lab report with patient as uploader (no doctor_id)
    const { data: report, error } = await supabase
      .from('lab_reports')
      .insert({
        patient_user_id: patientUserId,
        doctor_id: null, // Patient uploaded
        test_name,
        order_date: order_date || new Date().toISOString().split('T')[0],
        doctor_notes: notes ? `Laboratorio externo: ${lab_name || 'No especificado'}\n${notes}` : `Laboratorio externo: ${lab_name || 'No especificado'}`,
        status: 'completed' // Patient uploads are already completed
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Insert results if provided
    if (results && Array.isArray(results) && results.length > 0) {
      const labResultsToInsert = results.map(r => ({
        report_id: report.id,
        parameter_name: r.parameter_name || r.name,
        result_value: r.result_value || r.value,
        unit: r.unit || null,
        reference_range: r.reference_range || r.range || null,
        status: r.status || 'normal'
      }));

      await supabase
        .from('lab_results')
        .insert(labResultsToInsert);
    }

    return ResponseBuilder.created(res, report, 'Resultados de laboratorio subidos');
  });

  /**
   * PUT /medical-records/lab-reports/:reportId/patient-results
   * Allow patient to upload results for their own pending lab reports
   */
  patientUploadResults = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { results, interpretation, status: newStatus } = req.body;
    const patientUserId = req.user.id;

    // Get the report and verify it belongs to this patient
    const { data: report, error: reportError } = await supabase
      .from('lab_reports')
      .select('id, patient_user_id, status')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return ResponseBuilder.notFound(res, 'Lab report not found');
    }

    // Verify patient owns this report
    if (report.patient_user_id !== patientUserId) {
      return ResponseBuilder.error(res, 'Not authorized to modify this report', 403);
    }

    // Only allow uploading to pending reports
    if (report.status !== 'pending') {
      return ResponseBuilder.error(res, 'This report already has results', 400);
    }

    // Update report status
    const { error: updateError } = await supabase
      .from('lab_reports')
      .update({
        status: newStatus || 'completed',
        doctor_notes: interpretation || null
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Insert lab results
    if (results && Array.isArray(results) && results.length > 0) {
      const labResultsToInsert = results.map(r => ({
        report_id: reportId,
        parameter_name: r.parameter_name || r.name,
        result_value: r.result_value || r.value,
        unit: r.unit || null,
        reference_range: r.reference_range || r.range || null,
        status: r.status || 'normal'
      }));

      const { error: resultsError } = await supabase
        .from('lab_results')
        .insert(labResultsToInsert);

      if (resultsError) {
        console.error('Error inserting lab results:', resultsError);
      }
    }

    return ResponseBuilder.success(res, null, 200, 'Resultados subidos exitosamente');
  });

  /**
   * GET /medical-records/lab-reports/all
   * Get all lab reports (admin)
   */
  getAllLabReports = asyncHandler(async (req, res) => {
    const { status, date } = req.query;

    let query = supabase
      .from('lab_reports')
      .select(`
        id,
        test_name,
        order_date,
        doctor_notes,
        status,
        created_at,
        patient_user_id,
        doctor_id,
        appointment_id
      `)
      .order('order_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('order_date', date);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!reports || reports.length === 0) {
      return ResponseBuilder.success(res, []);
    }

    // Get unique patient and doctor IDs
    const patientUserIds = [...new Set(reports.map(r => r.patient_user_id).filter(Boolean))];
    const doctorIds = [...new Set(reports.map(r => r.doctor_id).filter(Boolean))];

    // Fetch patient names
    const { data: patients } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', patientUserIds);

    const patientMap = {};
    (patients || []).forEach(p => {
      patientMap[p.id] = `${p.first_name} ${p.last_name}`;
    });

    // Fetch doctors with user info
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, users(first_name, last_name)')
      .in('id', doctorIds);

    const doctorMap = {};
    (doctors || []).forEach(d => {
      const firstName = d.users?.first_name || '';
      const lastName = d.users?.last_name || '';
      doctorMap[d.id] = firstName && lastName ? `Dr. ${firstName} ${lastName}` : 'Dr. Desconocido';
    });

    // Fetch lab_results for all reports
    const reportIds = reports.map(r => r.id);
    const { data: allResults } = await supabase
      .from('lab_results')
      .select('id, report_id, parameter_name, result_value, unit, reference_range, status')
      .in('report_id', reportIds);

    const resultsMap = {};
    (allResults || []).forEach(result => {
      if (!resultsMap[result.report_id]) {
        resultsMap[result.report_id] = [];
      }
      resultsMap[result.report_id].push(result);
    });

    // Transform data
    const transformedReports = reports.map(report => ({
      id: report.id,
      test_name: report.test_name,
      order_date: report.order_date,
      doctor_notes: report.doctor_notes,
      status: report.status,
      created_at: report.created_at,
      patient_user_id: report.patient_user_id,
      doctor_id: report.doctor_id,
      appointment_id: report.appointment_id,
      patient_name: patientMap[report.patient_user_id] || 'Paciente desconocido',
      doctor_name: doctorMap[report.doctor_id] || 'Doctor desconocido',
      lab_results: resultsMap[report.id] || []
    }));

    return ResponseBuilder.success(res, transformedReports);
  });

  /**
   * PATCH /medical-records/lab-reports/:reportId/status
   * Update lab report status (admin)
   */
  updateLabReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return ResponseBuilder.error(res, 'Estado inválido', 400);
    }

    const { data, error } = await supabase
      .from('lab_reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return ResponseBuilder.success(res, data, 200, 'Estado actualizado');
  });

  /**
   * POST /medical-records/lab-reports/:reportId/results (admin)
   * Add results to a lab report
   */
  addLabReportResults = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { results, notes } = req.body;

    // Verify lab report exists
    const { data: report, error: reportError } = await supabase
      .from('lab_reports')
      .select('id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return ResponseBuilder.error(res, 'Orden de laboratorio no encontrada', 404);
    }

    // Insert results
    if (results && results.length > 0) {
      const labResultsToInsert = results.map(r => ({
        report_id: reportId,
        parameter_name: r.parameter_name,
        result_value: r.result_value,
        unit: r.unit || '',
        reference_range: r.reference_range || '',
        status: r.status || 'normal'
      }));

      const { error: resultsError } = await supabase
        .from('lab_results')
        .insert(labResultsToInsert);

      if (resultsError) {
        throw new Error(`Error al insertar resultados: ${resultsError.message}`);
      }
    }

    // Update notes and status
    const { error: updateError } = await supabase
      .from('lab_reports')
      .update({ 
        doctor_notes: notes || '',
        status: 'completed'
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Error al actualizar orden: ${updateError.message}`);
    }

    return ResponseBuilder.success(res, null, 200, 'Resultados guardados exitosamente');
  });
}

module.exports = new MedicalRecordController();
