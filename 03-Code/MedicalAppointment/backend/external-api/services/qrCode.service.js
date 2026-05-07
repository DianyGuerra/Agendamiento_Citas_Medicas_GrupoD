/**
 * QR Code Service
 * Generates and manages QR codes for prescriptions and appointments
 * 
 * @module external-api/services/QRCodeService
 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const { supabase } = require('../../shared/config/database.config');
const { NotFoundError } = require('../../shared/errors');

class QRCodeService {
  /**
   * Generate unique QR token
   * @returns {string} 32-character hex token
   */
  generateToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate QR code for a prescription
   * @param {string} prescriptionId - Prescription UUID
   * @returns {Promise<Object>} QR code data with qr_token, qr_image, verification_url
   */
  async generatePrescriptionQR(prescriptionId) {
    // Check if prescription exists
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select('id, patient_user_id, doctor_id')
      .eq('id', prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      throw new NotFoundError('Receta', prescriptionId);
    }

    // Check if QR already exists for this prescription
    const { data: existingQR } = await supabase
      .from('prescription_qr_codes')
      .select('*')
      .eq('prescription_id', prescriptionId)
      .eq('is_valid', true)
      .single();

    if (existingQR) {
      return {
        id: existingQR.id,
        prescription_id: existingQR.prescription_id,
        qr_token: existingQR.qr_token,
        qr_image: existingQR.qr_image,
        verification_url: existingQR.verification_url,
        is_valid: existingQR.is_valid,
        created_at: existingQR.created_at
      };
    }

    // Generate unique token
    const qrToken = this.generateToken();
    
    // Create verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://medical-appointment-web-system.vercel.app';
    const verificationUrl = `${frontendUrl}/verify-prescription/${qrToken}`;

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    // Store in prescription_qr_codes table
    const { data: qrData, error: insertError } = await supabase
      .from('prescription_qr_codes')
      .insert({
        prescription_id: prescriptionId,
        qr_token: qrToken,
        qr_image: qrCodeDataUrl,
        verification_url: verificationUrl,
        is_valid: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting QR code:', insertError);
      throw new Error(`Error al crear código QR: ${insertError.message}`);
    }

    // Log access
    await this.logQRAccess(qrToken, prescriptionId, 'created', null);

    return {
      id: qrData.id,
      prescription_id: qrData.prescription_id,
      qr_token: qrData.qr_token,
      qr_image: qrData.qr_image,
      verification_url: qrData.verification_url,
      is_valid: qrData.is_valid,
      created_at: qrData.created_at
    };
  }

  /**
   * Log QR code access
   * @param {string} qrToken - QR token
   * @param {string} prescriptionId - Prescription ID
   * @param {string} action - Action performed (created, scanned, verified)
   * @param {string} ipAddress - IP address
   */
  async logQRAccess(qrToken, prescriptionId, action, ipAddress) {
    try {
      await supabase
        .from('qr_access_logs')
        .insert({
          qr_token: qrToken,
          prescription_id: prescriptionId,
          action: action,
          ip_address: ipAddress,
          accessed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging QR access:', error);
    }
  }

  /**
   * Generate QR code for an appointment
   * @param {string} appointmentId - Appointment UUID
   * @returns {Promise<Object>} QR code data
   */
  async generateAppointmentQR(appointmentId) {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        status_id,
        appointment_status(code, label),
        patient:users!patient_user_id(first_name, last_name),
        doctor:doctors(user:users(first_name, last_name), specialty:specialties(name))
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Cita', appointmentId);
    }

    const appointmentDate = new Date(appointment.scheduled_start);
    const qrContent = {
      type: 'appointment',
      id: appointment.id,
      patient: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
      doctor: `${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`,
      specialty: appointment.doctor.specialty?.name,
      date: appointmentDate.toISOString().split('T')[0],
      time: appointmentDate.toTimeString().slice(0, 5),
      status: appointment.appointment_status?.code,
      checkInUrl: `${process.env.FRONTEND_URL}/check-in/${appointmentId}`
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrContent), {
      width: 300,
      margin: 2
    });

    return {
      appointmentId,
      qrCode: qrCodeDataUrl,
      content: qrContent
    };
  }

  /**
   * Verify QR code content
   * @param {string} qrData - QR code data (JSON string)
   * @returns {Promise<Object>} Verification result
   */
  async verifyQRCode(qrData) {
    try {
      const content = JSON.parse(qrData);

      if (content.type === 'prescription') {
        return this._verifyPrescription(content.id);
      } else if (content.type === 'appointment') {
        return this._verifyAppointment(content.id);
      }

      return {
        valid: false,
        message: 'Tipo de QR no reconocido'
      };
    } catch (err) {
      return {
        valid: false,
        message: 'QR inválido o corrupto'
      };
    }
  }

  /**
   * Generate check-in QR for patient
   * @param {string} patientUserId - Patient user UUID
   * @returns {Promise<Object>} QR code data
   */
  async generatePatientCheckInQR(patientUserId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', patientUserId)
      .single();

    if (error || !user) {
      throw new NotFoundError('Paciente', patientUserId);
    }

    const qrContent = {
      type: 'patient_checkin',
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`,
      timestamp: new Date().toISOString()
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrContent), {
      width: 250,
      margin: 2
    });

    return {
      userId: user.id,
      qrCode: qrCodeDataUrl,
      validFor: '1 day'
    };
  }

  // ===== Private Methods =====

  async _verifyPrescription(prescriptionId) {
    // Note: prescriptions table does NOT have is_active column
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        diagnosis,
        medications,
        instructions,
        duration,
        created_at,
        patient:users!patient_user_id(first_name, last_name),
        doctor:doctors(
          professional_id,
          user:users(first_name, last_name),
          specialty:specialties(name)
        )
      `)
      .eq('id', prescriptionId)
      .single();

    if (error || !data) {
      return {
        valid: false,
        type: 'prescription',
        message: 'Receta no encontrada'
      };
    }

    // Parse medications JSON
    let medicationsList = [];
    try {
      if (data.medications) {
        const parsed = JSON.parse(data.medications);
        medicationsList = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (e) {
      // If not JSON, treat as plain text
      medicationsList = data.medications ? [{ name: data.medications }] : [];
    }

    return {
      valid: true,
      type: 'prescription',
      isActive: true, // prescriptions table has no is_active, assume active if exists
      prescription: {
        id: data.id,
        diagnosis: data.diagnosis || 'No especificado',
        medications: medicationsList,
        instructions: data.instructions,
        duration: data.duration,
        createdAt: data.created_at
      },
      patient: `${data.patient.first_name} ${data.patient.last_name}`,
      doctor: {
        name: `${data.doctor.user.first_name} ${data.doctor.user.last_name}`,
        professionalId: data.doctor.professional_id,
        specialty: data.doctor.specialty?.name
      },
      message: 'Receta válida y verificada'
    };
  }

  /**
   * Verify prescription by QR token
   * @param {string} qrToken - QR token from URL
   * @param {string} ipAddress - IP address of requester
   * @returns {Promise<Object>} Verification result with prescription details
   */
  async verifyPrescriptionByToken(qrToken, ipAddress = null) {
    // Find QR code by token
    const { data: qrData, error: qrError } = await supabase
      .from('prescription_qr_codes')
      .select('*')
      .eq('qr_token', qrToken)
      .single();

    if (qrError || !qrData) {
      return {
        valid: false,
        message: 'Código QR no encontrado o inválido'
      };
    }

    if (!qrData.is_valid) {
      return {
        valid: false,
        message: 'Este código QR ha sido invalidado'
      };
    }

    // Log access
    await this.logQRAccess(qrToken, qrData.prescription_id, 'verified', ipAddress);

    // Get prescription details
    return this._verifyPrescription(qrData.prescription_id);
  }

  async _verifyAppointment(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        status_id,
        scheduled_start,
        scheduled_end,
        appointment_status(code, label),
        patient:users!patient_user_id(first_name, last_name),
        doctor:doctors(user:users(first_name, last_name))
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !data) {
      return {
        valid: false,
        type: 'appointment',
        message: 'Cita no encontrada'
      };
    }

    const appointmentDate = new Date(data.scheduled_start);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return {
      valid: true,
      type: 'appointment',
      status: data.appointment_status?.code,
      isToday,
      patient: `${data.patient.first_name} ${data.patient.last_name}`,
      doctor: `${data.doctor.user.first_name} ${data.doctor.user.last_name}`,
      date: dateStr,
      time: appointmentDate.toTimeString().slice(0, 5),
      message: isToday ? 'Cita válida para hoy' : 'Cita válida'
    };
  }
}

module.exports = new QRCodeService();
