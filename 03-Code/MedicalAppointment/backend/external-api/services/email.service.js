/**
 * Email Service
 * Handles all email notifications for the medical appointment system
 * 
 * @module external-api/services/EmailService
 */

const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    this.fromEmail = process.env.EMAIL_FROM || 'ericktufinoortiz@gmail.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Sistema de Citas Médicas';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * Get common email styles
   */
  _getStyles() {
    return `
      <style>
        .email-container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; }
        .email-header { padding: 30px; text-align: center; }
        .email-header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .email-body { padding: 30px; }
        .info-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .info-card.success { border-left-color: #10b981; background: #f0fdf4; }
        .info-card.warning { border-left-color: #f59e0b; background: #fffbeb; }
        .info-card.danger { border-left-color: #ef4444; background: #fef2f2; }
        .info-card.purple { border-left-color: #8b5cf6; background: #faf5ff; }
        .btn { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; }
        .btn-primary { background: #2563eb; color: #ffffff !important; }
        .btn-success { background: #10b981; color: #ffffff !important; }
        .btn-warning { background: #f59e0b; color: #ffffff !important; }
        .email-footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .email-footer p { color: #6b7280; font-size: 12px; margin: 5px 0; }
      </style>
    `;
  }

  /**
   * Get email wrapper template
   */
  _getEmailTemplate(headerColor, headerIcon, headerTitle, content) {
    const headerBg = {
      primary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${this._getStyles()}
      </head>
      <body style="margin: 0; padding: 20px; background: #f3f4f6;">
        <div class="email-container" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div class="email-header" style="background: ${headerBg[headerColor] || headerBg.primary};">
            <div style="font-size: 48px; margin-bottom: 10px;">${headerIcon}</div>
            <h1>${headerTitle}</h1>
          </div>
          <div class="email-body">
            ${content}
          </div>
          <div class="email-footer">
            <p><strong>Sistema de Citas Médicas</strong></p>
            <p>Este es un mensaje automático, por favor no responder.</p>
            <p>© ${new Date().getFullYear()} Medical Appointment System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // =========================================================================
  // APPOINTMENT EMAILS
  // =========================================================================

  /**
   * Send appointment confirmation email (new appointment created)
   */
  async sendAppointmentConfirmation(data) {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      specialty, 
      date, 
      time, 
      room,
      reason
    } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Tu cita médica ha sido agendada exitosamente. A continuación los detalles:</p>
      
      <div class="info-card success">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>📅 Fecha:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>🕐 Hora:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${specialty || 'Medicina General'}</td>
          </tr>
          ${room ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>🚪 Consultorio:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${room}</td>
          </tr>
          ` : ''}
          ${reason ? `
          <tr>
            <td style="padding: 10px 0;"><strong>📋 Motivo:</strong></td>
            <td style="padding: 10px 0;">${reason}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;">
          <strong>⏰ Importante:</strong> Por favor llega 15 minutos antes de tu cita para el registro.
        </p>
      </div>

      <p style="color: #4b5563;">Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments" class="btn btn-primary" style="color: #ffffff;">
          Ver Mis Citas
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `✅ Cita Confirmada - ${date} a las ${time}`,
      html: this._getEmailTemplate('success', '📅', 'Cita Confirmada', content)
    });
  }

  /**
   * Send appointment rescheduled email
   */
  async sendAppointmentRescheduled(data) {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      specialty,
      oldDate,
      oldTime,
      newDate, 
      newTime,
      room,
      rescheduledBy 
    } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Tu cita médica ha sido reprogramada. Revisa los nuevos detalles:</p>
      
      <div class="info-card danger" style="margin-bottom: 10px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">❌ Horario Anterior:</p>
        <p style="margin: 0; color: #7f1d1d; text-decoration: line-through;">
          ${oldDate} a las ${oldTime}
        </p>
      </div>

      <div class="info-card success">
        <p style="margin: 0 0 15px 0; font-weight: 600; color: #166534;">✅ Nuevo Horario:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>📅 Fecha:</strong></td>
            <td style="padding: 8px 0;">${newDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>🕐 Hora:</strong></td>
            <td style="padding: 8px 0;">${newTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 8px 0;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 8px 0;">${specialty || 'Medicina General'}</td>
          </tr>
          ${room ? `
          <tr>
            <td style="padding: 8px 0;"><strong>🚪 Consultorio:</strong></td>
            <td style="padding: 8px 0;">${room}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${rescheduledBy ? `<p style="color: #6b7280; font-size: 14px;">Reprogramado por: ${rescheduledBy}</p>` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments" class="btn btn-primary" style="color: #ffffff;">
          Ver Mis Citas
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `🔄 Cita Reprogramada - Nuevo horario: ${newDate} a las ${newTime}`,
      html: this._getEmailTemplate('warning', '🔄', 'Cita Reprogramada', content)
    });
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(data) {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      specialty,
      date, 
      time, 
      reason,
      cancelledBy 
    } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Lamentamos informarte que tu cita ha sido cancelada:</p>
      
      <div class="info-card danger">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>📅 Fecha:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>🕐 Hora:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 8px 0;">${specialty || 'Medicina General'}</td>
          </tr>
        </table>
        ${reason ? `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fecaca;">
          <strong>📝 Motivo de cancelación:</strong>
          <p style="margin: 5px 0 0 0; color: #7f1d1d;">${reason}</p>
        </div>
        ` : ''}
      </div>

      ${cancelledBy ? `<p style="color: #6b7280; font-size: 14px;">Cancelado por: ${cancelledBy}</p>` : ''}

      <p style="color: #4b5563;">Si deseas agendar una nueva cita, puedes hacerlo desde nuestra plataforma.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments/new" class="btn btn-primary" style="color: #ffffff;">
          Agendar Nueva Cita
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `❌ Cita Cancelada - ${date}`,
      html: this._getEmailTemplate('danger', '❌', 'Cita Cancelada', content)
    });
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(data) {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      specialty, 
      date, 
      time, 
      room,
      hoursUntil 
    } = data;

    const urgencyText = hoursUntil <= 2 
      ? '¡Tu cita es muy pronto!' 
      : hoursUntil <= 24 
        ? 'Tu cita es mañana' 
        : `Tu cita es en ${hoursUntil} horas`;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563; font-size: 18px;"><strong>${urgencyText}</strong></p>
      
      <div class="info-card warning">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;"><strong>📅 Fecha:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;"><strong>🕐 Hora:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 10px 0;">${specialty || 'Medicina General'}</td>
          </tr>
          ${room ? `
          <tr>
            <td style="padding: 10px 0;"><strong>🚪 Consultorio:</strong></td>
            <td style="padding: 10px 0;">${room}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>⏰ Recuerda:</strong> Llega 15 minutos antes para el registro y trae tu identificación.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments" class="btn btn-warning" style="color: #ffffff;">
          Ver Detalles de la Cita
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `⏰ Recordatorio: Cita ${hoursUntil <= 24 ? 'mañana' : `en ${hoursUntil} horas`} - ${date} a las ${time}`,
      html: this._getEmailTemplate('warning', '⏰', 'Recordatorio de Cita', content)
    });
  }

  /**
   * Send follow-up appointment notification
   */
  async sendFollowUpNotification(data) {
    const { 
      patientEmail, 
      patientName, 
      doctorName, 
      specialty, 
      followUpDate, 
      followUpTime,
      room,
      diagnosis 
    } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Tu doctor ha programado una cita de seguimiento como parte de tu tratamiento:</p>
      
      <div class="info-card success">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>📅 Fecha:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${followUpDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>🕐 Hora:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${followUpTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 10px 0;">${specialty || 'Medicina General'}</td>
          </tr>
          ${room ? `
          <tr>
            <td style="padding: 10px 0;"><strong>🚪 Consultorio:</strong></td>
            <td style="padding: 10px 0;">${room}</td>
          </tr>
          ` : ''}
          ${diagnosis ? `
          <tr>
            <td style="padding: 10px 0;"><strong>📋 Motivo:</strong></td>
            <td style="padding: 10px 0;">Seguimiento: ${diagnosis}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="color: #4b5563;">Esta cita fue creada automáticamente por tu doctor. Si necesitas reprogramar, contáctanos con anticipación.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments" class="btn btn-success" style="color: #ffffff;">
          Ver Mis Citas
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `📋 Cita de Seguimiento Programada - ${followUpDate}`,
      html: this._getEmailTemplate('success', '📋', 'Cita de Seguimiento', content)
    });
  }

  // =========================================================================
  // PRESCRIPTION EMAILS
  // =========================================================================

  /**
   * Send new prescription notification
   */
  async sendPrescriptionNotification(data) {
    const { patientEmail, patientName, doctorName, specialty, diagnosis, medications, duration } = data;

    let medicationList = '';
    if (Array.isArray(medications)) {
      medicationList = medications.map(med => 
        `<li style="padding: 8px 0; border-bottom: 1px solid #e9d5ff;">
          <strong>${med.name || med.medication}</strong><br>
          <span style="color: #6b7280; font-size: 14px;">
            ${med.dosage ? `Dosis: ${med.dosage}` : ''} 
            ${med.frequency ? `| ${med.frequency}` : ''}
            ${med.duration ? `| ${med.duration}` : ''}
          </span>
        </li>`
      ).join('');
    } else if (typeof medications === 'string') {
      medicationList = `<li style="padding: 8px 0;">${medications}</li>`;
    }

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">El Dr(a). ${doctorName} te ha generado una nueva receta médica:</p>
      
      <div class="info-card purple">
        ${diagnosis ? `
        <div style="margin-bottom: 15px;">
          <strong>📋 Diagnóstico:</strong>
          <p style="margin: 5px 0 0 0; color: #5b21b6;">${diagnosis}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 15px;">
          <strong>💊 Medicamentos:</strong>
          <ul style="margin: 10px 0; padding-left: 20px; list-style: none;">
            ${medicationList || '<li>Ver detalles en la plataforma</li>'}
          </ul>
        </div>

        ${duration ? `
        <div>
          <strong>⏱️ Duración del tratamiento:</strong>
          <p style="margin: 5px 0 0 0;">${duration}</p>
        </div>
        ` : ''}
      </div>

      <p style="color: #4b5563;">Puedes ver tu receta completa con código QR para validación en farmacias desde la plataforma.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/prescriptions" class="btn btn-primary" style="color: #ffffff; background: #8b5cf6;">
          Ver Mi Receta
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `💊 Nueva Receta Médica - Dr(a). ${doctorName}`,
      html: this._getEmailTemplate('purple', '💊', 'Nueva Receta Médica', content)
    });
  }

  /**
   * Send prescription renewal request notification (to doctor)
   */
  async sendPrescriptionRenewalRequest(data) {
    const { doctorEmail, doctorName, patientName, diagnosis, medications, requestReason } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola Dr(a). <strong>${doctorName}</strong>,</p>
      <p style="color: #4b5563;">El paciente <strong>${patientName}</strong> ha solicitado la renovación de una receta:</p>
      
      <div class="info-card warning">
        <div style="margin-bottom: 15px;">
          <strong>📋 Diagnóstico original:</strong>
          <p style="margin: 5px 0 0 0;">${diagnosis || 'No especificado'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>💊 Medicamentos:</strong>
          <p style="margin: 5px 0 0 0;">${medications || 'Ver en plataforma'}</p>
        </div>

        <div>
          <strong>📝 Motivo de la solicitud:</strong>
          <p style="margin: 5px 0 0 0; color: #92400e;">${requestReason || 'Sin motivo especificado'}</p>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/doctor/prescriptions" class="btn btn-warning" style="color: #ffffff;">
          Revisar Solicitud
        </a>
      </div>
    `;

    return this._sendEmail({
      to: doctorEmail,
      subject: `🔄 Solicitud de Renovación de Receta - ${patientName}`,
      html: this._getEmailTemplate('warning', '🔄', 'Solicitud de Renovación', content)
    });
  }

  /**
   * Send prescription renewal approved notification (to patient)
   */
  async sendPrescriptionRenewalApproved(data) {
    const { patientEmail, patientName, doctorName, doctorResponse, duration } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">¡Buenas noticias! Tu solicitud de renovación de receta ha sido aprobada:</p>
      
      <div class="info-card success">
        <div style="margin-bottom: 15px;">
          <strong>👨‍⚕️ Aprobado por:</strong>
          <p style="margin: 5px 0 0 0;">Dr(a). ${doctorName}</p>
        </div>
        
        ${duration ? `
        <div style="margin-bottom: 15px;">
          <strong>⏱️ Nueva duración:</strong>
          <p style="margin: 5px 0 0 0;">${duration}</p>
        </div>
        ` : ''}

        ${doctorResponse ? `
        <div>
          <strong>💬 Mensaje del doctor:</strong>
          <p style="margin: 5px 0 0 0; color: #166534;">${doctorResponse}</p>
        </div>
        ` : ''}
      </div>

      <p style="color: #4b5563;">Tu receta ha sido actualizada y está lista para usar.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/prescriptions" class="btn btn-success" style="color: #ffffff;">
          Ver Mi Receta
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `✅ Renovación de Receta Aprobada`,
      html: this._getEmailTemplate('success', '✅', 'Renovación Aprobada', content)
    });
  }

  /**
   * Send prescription renewal rejected notification (to patient)
   */
  async sendPrescriptionRenewalRejected(data) {
    const { patientEmail, patientName, doctorName, rejectionReason } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Lamentamos informarte que tu solicitud de renovación de receta no fue aprobada:</p>
      
      <div class="info-card danger">
        <div style="margin-bottom: 15px;">
          <strong>👨‍⚕️ Revisado por:</strong>
          <p style="margin: 5px 0 0 0;">Dr(a). ${doctorName}</p>
        </div>
        
        <div>
          <strong>📝 Motivo:</strong>
          <p style="margin: 5px 0 0 0; color: #991b1b;">${rejectionReason || 'Consulte con su doctor para más información.'}</p>
        </div>
      </div>

      <p style="color: #4b5563;">Te recomendamos agendar una cita para revisar tu tratamiento.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/appointments/new" class="btn btn-primary" style="color: #ffffff;">
          Agendar Cita
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `❌ Renovación de Receta No Aprobada`,
      html: this._getEmailTemplate('danger', '❌', 'Renovación No Aprobada', content)
    });
  }

  // =========================================================================
  // AUTHENTICATION EMAILS
  // =========================================================================

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data) {
    const { email, userName, role } = data;

    const roleText = {
      patient: 'Como paciente, podrás agendar citas, ver tu historial médico y acceder a tus recetas.',
      doctor: 'Como doctor, podrás gestionar tus citas, consultas y generar recetas médicas.',
      admin: 'Como administrador, tendrás acceso completo al sistema de gestión.'
    };

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
      <p style="color: #4b5563;">¡Bienvenido/a al Sistema de Citas Médicas!</p>
      <p style="color: #4b5563;">Tu cuenta ha sido creada exitosamente.</p>
      
      <div class="info-card success">
        <p style="margin: 0; color: #166534;">${roleText[role] || roleText.patient}</p>
      </div>

      <p style="color: #4b5563;">Con tu cuenta puedes:</p>
      <ul style="color: #4b5563;">
        <li>📅 Agendar y gestionar citas médicas</li>
        <li>📋 Ver tu historial de consultas</li>
        <li>💊 Acceder a tus recetas médicas</li>
        <li>🔔 Recibir recordatorios de citas</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/login" class="btn btn-success" style="color: #ffffff;">
          Iniciar Sesión
        </a>
      </div>
    `;

    return this._sendEmail({
      to: email,
      subject: `🎉 ¡Bienvenido/a al Sistema de Citas Médicas!`,
      html: this._getEmailTemplate('success', '🎉', '¡Bienvenido/a!', content)
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data) {
    const { email, userName, resetToken, resetUrl } = data;

    const link = resetUrl || `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
      <p style="color: #4b5563;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      
      <div class="info-card warning">
        <p style="margin: 0;">Haz clic en el botón de abajo para crear una nueva contraseña.</p>
        <p style="margin: 10px 0 0 0; color: #92400e;"><strong>⚠️ Este enlace expirará en 1 hora.</strong></p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" class="btn btn-primary" style="color: #ffffff;">
          Restablecer Contraseña
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual permanecerá sin cambios.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
      </p>
    `;

    return this._sendEmail({
      to: email,
      subject: `🔐 Restablecer tu Contraseña`,
      html: this._getEmailTemplate('primary', '🔐', 'Restablecer Contraseña', content)
    });
  }

  /**
   * Send temporary password email (admin-generated)
   */
  async sendTemporaryPassword(data) {
    const { email, userName, temporaryPassword, adminName } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
      <p style="color: #4b5563;">El administrador del sistema te ha asignado una nueva contraseña temporal.</p>
      
      <div class="info-card warning">
        <p style="margin: 0 0 15px 0;"><strong>Tu contraseña temporal es:</strong></p>
        <div style="background: #ffffff; border: 2px dashed #f59e0b; border-radius: 8px; padding: 15px; text-align: center;">
          <code style="font-size: 20px; font-weight: bold; color: #1f2937; letter-spacing: 2px;">${temporaryPassword}</code>
        </div>
        <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px;">
          <strong>⚠️ Por seguridad, cambia esta contraseña después de iniciar sesión.</strong>
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/login" class="btn btn-primary" style="color: #ffffff;">
          Iniciar Sesión
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        Si no esperabas este cambio, contacta al administrador inmediatamente.
      </p>
      
      ${adminName ? `<p style="color: #9ca3af; font-size: 12px;">Generado por: ${adminName}</p>` : ''}
    `;

    return this._sendEmail({
      to: email,
      subject: `🔑 Tu Nueva Contraseña Temporal`,
      html: this._getEmailTemplate('warning', '🔑', 'Contraseña Temporal Asignada', content)
    });
  }

  /**
   * Send password reset link email (admin-generated token)
   */
  async sendAdminPasswordResetLink(data) {
    const { email, userName, resetToken, expiresAt, adminName } = data;

    const link = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    const expirationDate = new Date(expiresAt).toLocaleString('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
      <p style="color: #4b5563;">El administrador del sistema ha generado un enlace para que puedas restablecer tu contraseña.</p>
      
      <div class="info-card primary">
        <p style="margin: 0;">Haz clic en el botón de abajo para crear una nueva contraseña.</p>
        <p style="margin: 10px 0 0 0; color: #1e40af;"><strong>📅 Este enlace expira el: ${expirationDate}</strong></p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" class="btn btn-primary" style="color: #ffffff;">
          Restablecer Contraseña
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje o contactar al administrador.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
      </p>
      
      ${adminName ? `<p style="color: #9ca3af; font-size: 12px;">Generado por: ${adminName}</p>` : ''}
    `;

    return this._sendEmail({
      to: email,
      subject: `🔐 Enlace para Restablecer tu Contraseña`,
      html: this._getEmailTemplate('primary', '🔐', 'Restablecer Contraseña', content)
    });
  }

  // =========================================================================
  // CONSULTATION EMAILS
  // =========================================================================

  /**
   * Send consultation completed notification
   */
  async sendConsultationCompleted(data) {
    const { patientEmail, patientName, doctorName, specialty, diagnosis, hasFollowUp, followUpDate } = data;

    const content = `
      <p style="font-size: 16px; color: #374151;">Hola <strong>${patientName}</strong>,</p>
      <p style="color: #4b5563;">Tu consulta médica ha sido completada exitosamente.</p>
      
      <div class="info-card success">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>👨‍⚕️ Doctor:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">Dr(a). ${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;"><strong>🏥 Especialidad:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #d1fae5;">${specialty || 'Medicina General'}</td>
          </tr>
          ${diagnosis ? `
          <tr>
            <td style="padding: 10px 0;"><strong>📋 Diagnóstico:</strong></td>
            <td style="padding: 10px 0;">${diagnosis}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${hasFollowUp && followUpDate ? `
      <div class="info-card warning">
        <p style="margin: 0;"><strong>📅 Cita de seguimiento programada:</strong> ${followUpDate}</p>
      </div>
      ` : ''}

      <p style="color: #4b5563;">Puedes ver los detalles completos de tu consulta y cualquier receta en la plataforma.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/patient/medical-records" class="btn btn-success" style="color: #ffffff;">
          Ver Mi Historial
        </a>
      </div>
    `;

    return this._sendEmail({
      to: patientEmail,
      subject: `✅ Consulta Completada - Dr(a). ${doctorName}`,
      html: this._getEmailTemplate('success', '✅', 'Consulta Completada', content)
    });
  }

  // =========================================================================
  // GENERIC NOTIFICATION
  // =========================================================================

  /**
   * Send generic notification email
   */
  async sendNotification(data) {
    const { to, subject, title, message, actionUrl, actionText, type = 'primary' } = data;

    const content = `
      <div style="margin: 20px 0;">
        ${message}
      </div>
      ${actionUrl && actionText ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" class="btn btn-${type}" style="color: #ffffff;">
          ${actionText}
        </a>
      </div>
      ` : ''}
    `;

    return this._sendEmail({
      to,
      subject,
      html: this._getEmailTemplate(type, '📢', title, content)
    });
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  async _sendEmail({ to, subject, html }) {
    const msg = {
      to,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject,
      html
    };

    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('📧 Email would be sent (SendGrid not configured):');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        return { success: true, simulated: true };
      }

      console.log(`📧 Sending email to ${to}...`);
      console.log(`   From: ${this.fromEmail}`);
      console.log(`   Subject: ${subject}`);
      
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${to} (Status: ${response[0]?.statusCode})`);
      return { success: true, statusCode: response[0]?.statusCode };
    } catch (error) {
      console.error('❌ Email error:', error.message);
      
      if (error.response) {
        console.error('SendGrid Error:', {
          statusCode: error.response.statusCode,
          body: error.response.body
        });
        
        if (error.response.statusCode === 403) {
          console.error('⚠️  SENDER NOT VERIFIED: Verify sender at https://app.sendgrid.com/settings/sender_auth');
        } else if (error.response.statusCode === 401) {
          console.error('⚠️  INVALID API KEY: Check SENDGRID_API_KEY in .env');
        }
      }
      
      throw error;
    }
  }
}

module.exports = new EmailService();
