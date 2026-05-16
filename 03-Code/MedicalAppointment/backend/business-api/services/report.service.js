/**
 * Report Service
 * Business logic for generating various reports
 * 
 * @module business-api/services/ReportService
 */

const { supabase } = require('../../shared/config/database.config');
const { BusinessError } = require('../../shared/errors');
const { AppointmentStatus } = require('../../shared/constants/app.constants');

class ReportService {
  // ==================== DOCTOR PERSONAL REPORTS ====================

  /**
   * Get doctor's personal statistics
   * @param {string} userId - User ID of the doctor
   * @param {Object} dateRange - Start and end dates
   * @returns {Promise<Object>} Doctor statistics
   */
  async getDoctorPersonalStats(userId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    // First get the doctor record
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (docError || !doctor) {
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        pendingAppointments: 0,
        uniquePatients: 0,
        completionRate: 0
      };
    }

    // Build query for appointments
    let query = supabase
      .from('appointments')
      .select('id, patient_user_id, status_id, appointment_status(code)')
      .eq('doctor_id', doctor.id);

    if (startDate) query = query.gte('scheduled_start', `${startDate}T00:00:00Z`);
    if (endDate) query = query.lte('scheduled_start', `${endDate}T23:59:59Z`);

    const { data: appointments, error: apptError } = await query;

    if (apptError) {
      console.error('Error fetching doctor appointments:', apptError);
      throw new BusinessError('Error al obtener estadísticas');
    }

    const total = appointments?.length || 0;
    const completed = appointments?.filter(a => a.appointment_status?.code === 'completed').length || 0;
    const cancelled = appointments?.filter(a => a.appointment_status?.code === 'cancelled').length || 0;
    const pending = appointments?.filter(a => 
      ['pending', 'scheduled', 'confirmed'].includes(a.appointment_status?.code)
    ).length || 0;
    const uniquePatients = new Set(appointments?.map(a => a.patient_user_id) || []).size;

    return {
      totalAppointments: total,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      pendingAppointments: pending,
      uniquePatients,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Get doctor's appointment history
   * @param {string} userId - User ID of the doctor
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Appointments list
   */
  async getDoctorAppointments(userId, options = {}) {
    const { startDate, endDate, status, limit = 50 } = options;

    // Get doctor record
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!doctor) return [];

    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        appointment_status(code, label),
        patient:patient_user_id(first_name, last_name, email)
      `)
      .eq('doctor_id', doctor.id)
      .order('scheduled_start', { ascending: false })
      .limit(limit);

    if (startDate) query = query.gte('scheduled_start', `${startDate}T00:00:00Z`);
    if (endDate) query = query.lte('scheduled_start', `${endDate}T23:59:59Z`);
    if (status) query = query.eq('appointment_status.code', status);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching doctor appointments:', error);
      return [];
    }

    // Format for frontend
    return (data || []).map(apt => ({
      id: apt.id,
      patient_name: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A',
      patient_email: apt.patient?.email,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      reason: apt.reason,
      status: apt.appointment_status?.code || 'unknown',
      status_label: apt.appointment_status?.label || 'Desconocido'
    }));
  }

  /**
   * Get doctor's ratings summary
   * @param {string} userId - User ID of the doctor
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Ratings data
   */
  async getDoctorRatings(userId, options = {}) {
    const { limit = 20 } = options;

    console.log('[getDoctorRatings] Getting ratings for user_id:', userId);

    // Get doctor record
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select('id, user_id')
      .eq('user_id', userId)
      .single();

    console.log('[getDoctorRatings] Doctor record:', doctor, 'Error:', docError);

    if (!doctor) {
      console.log('[getDoctorRatings] No doctor found for user_id:', userId);
      return { average: null, ratings: [], total: 0, breakdown: {} };
    }

    console.log('[getDoctorRatings] Searching ratings for doctor_id:', doctor.id);

    // Get ratings
    const { data: ratings, error } = await supabase
      .from('doctor_ratings')
      .select(`
        id,
        rating,
        punctuality_rating,
        attention_rating,
        recommendation_rating,
        comment,
        is_anonymous,
        created_at,
        doctor_id,
        patient:patient_user_id(first_name, last_name)
      `)
      .eq('doctor_id', doctor.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log('[getDoctorRatings] Ratings found:', ratings?.length, 'Error:', error);
    if (ratings?.length > 0) {
      console.log('[getDoctorRatings] First rating doctor_id:', ratings[0].doctor_id);
    }

    // DEBUG: Also get ALL ratings to see what doctor_ids exist
    const { data: allRatings } = await supabase
      .from('doctor_ratings')
      .select('id, doctor_id, rating, is_active')
      .limit(10);
    console.log('[getDoctorRatings] All ratings in DB (first 10):', JSON.stringify(allRatings, null, 2));
    console.log('[getDoctorRatings] Looking for doctor.id:', doctor.id, 'Type:', typeof doctor.id);

    if (error) {
      console.error('Error fetching doctor ratings:', error);
      return { average: null, ratings: [], total: 0, breakdown: {} };
    }

    // Calculate averages
    const total = ratings?.length || 0;
    if (total === 0) {
      return { average: null, ratings: [], total: 0, breakdown: {} };
    }

    const sumRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const sumPunctuality = ratings.reduce((sum, r) => sum + (r.punctuality_rating || 0), 0);
    const sumAttention = ratings.reduce((sum, r) => sum + (r.attention_rating || 0), 0);
    const sumRecommendation = ratings.reduce((sum, r) => sum + (r.recommendation_rating || 0), 0);

    // Breakdown by stars
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const star = Math.round(r.rating);
      if (star >= 1 && star <= 5) breakdown[star]++;
    });

    // Format ratings for display
    const formattedRatings = ratings.map(r => ({
      id: r.id,
      rating: r.rating,
      punctuality_rating: r.punctuality_rating,
      attention_rating: r.attention_rating,
      recommendation_rating: r.recommendation_rating,
      comment: r.comment,
      patient_name: r.is_anonymous ? 'Anónimo' : 
        (r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : 'Paciente'),
      created_at: r.created_at
    }));

    return {
      average: Number.parseFloat((sumRating / total).toFixed(1)),
      averagePunctuality: Number.parseFloat((sumPunctuality / total).toFixed(1)),
      averageAttention: Number.parseFloat((sumAttention / total).toFixed(1)),
      averageRecommendation: Number.parseFloat((sumRecommendation / total).toFixed(1)),
      ratings: formattedRatings,
      total,
      breakdown
    };
  }

  // ==================== ADMIN REPORTS ====================

  /**
   * Generate appointment report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Appointment report data
   */
  async generateAppointmentReport(filters = {}) {
    const { startDate, endDate, doctorId, status, specialtyId } = filters;

    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        reason,
        created_at,
        status_id,
        appointment_status(id, code, label),
        patient:patient_user_id(first_name, last_name),
        doctors!appointments_doctor_id_fkey(
          users(first_name, last_name),
          specialties(name)
        )
      `)
      .neq('status_id', AppointmentStatus.CANCELLED)
      .order('scheduled_start', { ascending: false });

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);
    if (doctorId) query = query.eq('doctor_id', doctorId);

    const { data, error } = await query;

    if (error) {
      console.error('Appointment report error:', error);
      throw new BusinessError('Error al generar reporte de citas');
    }

    // Calculate summary
    const summary = {
      total: data?.length || 0,
      byStatus: {},
      bySpecialty: {},
      byDayOfWeek: {},
      byMonth: {}
    };

    (data || []).forEach(apt => {
      // By status
      const statusCode = apt.appointment_status?.code || 'unknown';
      summary.byStatus[statusCode] = (summary.byStatus[statusCode] || 0) + 1;

      // By specialty
      const specialty = apt.doctors?.specialties?.name || 'Sin especialidad';
      summary.bySpecialty[specialty] = (summary.bySpecialty[specialty] || 0) + 1;

      // By day of week
      if (apt.scheduled_start) {
        const date = new Date(apt.scheduled_start);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        // Capitalize first letter
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        summary.byDayOfWeek[capitalizedDay] = (summary.byDayOfWeek[capitalizedDay] || 0) + 1;
        
        // By month
        const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        summary.byMonth[capitalizedMonth] = (summary.byMonth[capitalizedMonth] || 0) + 1;
      }
    });

    return {
      data: data || [],
      summary,
      filters: { startDate, endDate, doctorId, status },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate doctor productivity report
   * @param {string} doctorId - Doctor UUID (optional, for single doctor)
   * @param {Object} dateRange - Start and end dates
   * @returns {Promise<Object>} Productivity report
   */
  async generateDoctorProductivityReport(doctorId = null, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from('appointments')
      .select(`
        doctor_id,
        scheduled_start,
        scheduled_end,
        status_id,
        appointment_status(code),
        doctors!appointments_doctor_id_fkey(
          id,
          users(first_name, last_name),
          specialties(name)
        )
      `)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Productivity report error:', error);
      throw new BusinessError('Error al generar reporte de productividad');
    }

    // Group by doctor
    const doctorStats = {};

    (data || []).forEach(apt => {
      const docId = apt.doctor_id;
      
      if (!doctorStats[docId]) {
        doctorStats[docId] = {
          doctorInfo: apt.doctors,
          totalAppointments: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          totalConsultationTime: 0,
          avgConsultationTime: 0
        };
      }

      doctorStats[docId].totalAppointments++;

      const statusCode = apt.appointment_status?.code;
      switch (statusCode) {
        case 'completed':
          doctorStats[docId].completed++;
          // Calculate consultation duration
          if (apt.scheduled_start && apt.scheduled_end) {
            const duration = (new Date(apt.scheduled_end) - new Date(apt.scheduled_start)) / (1000 * 60);
            doctorStats[docId].totalConsultationTime += duration;
          }
          break;
        case 'cancelled':
          doctorStats[docId].cancelled++;
          break;
        case 'no_show':
          doctorStats[docId].noShow++;
          break;
      }
    });

    // Calculate averages and rates
    Object.values(doctorStats).forEach(stats => {
      stats.completionRate = stats.totalAppointments > 0
        ? ((stats.completed / stats.totalAppointments) * 100).toFixed(2)
        : 0;
      
      stats.avgConsultationTime = stats.completed > 0
        ? (stats.totalConsultationTime / stats.completed).toFixed(2)
        : 0;
    });

    return {
      doctors: Object.values(doctorStats),
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate patient flow report
   * @param {Object} dateRange - Start and end dates
   * @returns {Promise<Object>} Patient flow analysis
   */
  async generatePatientFlowReport(dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from('appointments')
      .select(`
        scheduled_start,
        status_id,
        appointment_status(code),
        doctors!appointments_doctor_id_fkey(specialties(name))
      `)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Patient flow report error:', error);
      throw new BusinessError('Error al generar reporte de flujo de pacientes');
    }

    // Analyze by hour
    const byHour = {};
    const byDayOfWeek = {
      'domingo': 0, 'lunes': 0, 'martes': 0, 'miércoles': 0,
      'jueves': 0, 'viernes': 0, 'sábado': 0
    };

    (data || []).forEach(apt => {
      if (!apt.scheduled_start) return;

      const date = new Date(apt.scheduled_start);
      
      // By hour
      const hour = date.getHours().toString().padStart(2, '0');
      byHour[hour] = (byHour[hour] || 0) + 1;

      // By day of week
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + 1;
    });

    // Find peak hours
    const peakHours = Object.entries(byHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    // Find busiest days
    const busiestDays = Object.entries(byDayOfWeek)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalAppointments: data?.length || 0,
      byHour,
      byDayOfWeek,
      peakHours,
      busiestDays,
      avgAppointmentsPerDay: dateRange.startDate && dateRange.endDate
        ? ((data?.length || 0) / this._daysBetween(startDate, endDate)).toFixed(2)
        : 'N/A',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate revenue report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Revenue report
   */
  async generateRevenueReport(filters = {}) {
    const { startDate, endDate, doctorId, groupBy = 'month' } = filters;

    let query = supabase
      .from('billings')
      .select(`
        *,
        doctors(
          users(first_name, last_name),
          specialties(name)
        )
      `);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (doctorId) query = query.eq('doctor_id', doctorId);

    const { data, error } = await query;

    if (error) {
      console.error('Revenue report error:', error);
      return {
        totals: {
          totalRevenue: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          insuranceCollected: 0,
          patientPayments: 0
        },
        byPeriod: {},
        bySpecialty: {},
        byDoctor: {},
        collectionRate: 0,
        filters,
        generatedAt: new Date().toISOString()
      };
    }

    // Calculate totals
    const totals = {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      insuranceCollected: 0,
      patientPayments: 0
    };

    const byPeriod = {};
    const bySpecialty = {};
    const byDoctor = {};

    (data || []).forEach(bill => {
      const amount = Number.parseFloat(bill.total_amount) || 0;
      totals.totalRevenue += amount;

      switch (bill.status) {
        case 'paid':
          totals.totalPaid += amount;
          break;
        case 'pending':
          totals.totalPending += amount;
          break;
        case 'overdue':
          totals.totalOverdue += amount;
          break;
      }

      if (bill.insurance_approved_amount) {
        totals.insuranceCollected += Number.parseFloat(bill.insurance_approved_amount) || 0;
      }
      if (bill.patient_responsibility) {
        totals.patientPayments += Number.parseFloat(bill.patient_responsibility) || 0;
      }

      const periodKey = this._getPeriodKey(bill.created_at, groupBy);
      if (!byPeriod[periodKey]) {
        byPeriod[periodKey] = { revenue: 0, count: 0 };
      }
      byPeriod[periodKey].revenue += amount;
      byPeriod[periodKey].count++;

      const specialty = bill.doctors?.specialties?.name || 'Sin especialidad';
      if (!bySpecialty[specialty]) {
        bySpecialty[specialty] = { revenue: 0, count: 0 };
      }
      bySpecialty[specialty].revenue += amount;
      bySpecialty[specialty].count++;

      const doctorName = bill.doctors?.users
        ? `${bill.doctors.users.first_name} ${bill.doctors.users.last_name}`
        : 'Desconocido';
      if (!byDoctor[doctorName]) {
        byDoctor[doctorName] = { revenue: 0, count: 0 };
      }
      byDoctor[doctorName].revenue += amount;
      byDoctor[doctorName].count++;
    });

    return {
      totals,
      byPeriod,
      bySpecialty,
      byDoctor,
      collectionRate: totals.totalRevenue > 0
        ? ((totals.totalPaid / totals.totalRevenue) * 100).toFixed(2)
        : 0,
      filters,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate specialty demand report
   */
  async generateSpecialtyDemandReport(dateRange = {}) {
    const { startDate, endDate } = dateRange;

    let query = supabase
      .from('appointments')
      .select(`
        status_id,
        appointment_status(code),
        doctors!appointments_doctor_id_fkey(specialties(id, name))
      `)
      .neq('status_id', AppointmentStatus.CANCELLED);

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Specialty demand report error:', error);
      throw new BusinessError('Error al generar reporte de demanda por especialidad');
    }

    const specialtyStats = {};

    (data || []).forEach(apt => {
      const specialty = apt.doctors?.specialties?.name || 'Sin especialidad';
      
      if (!specialtyStats[specialty]) {
        specialtyStats[specialty] = {
          name: specialty,
          totalAppointments: 0,
          completed: 0,
          cancelled: 0,
          demandScore: 0
        };
      }

      specialtyStats[specialty].totalAppointments++;
      
      const statusCode = apt.appointment_status?.code;
      if (statusCode === 'completed') {
        specialtyStats[specialty].completed++;
      } else if (statusCode === 'cancelled') {
        specialtyStats[specialty].cancelled++;
      }
    });

    const totalAppointments = data?.length || 0;
    Object.values(specialtyStats).forEach(stats => {
      stats.demandScore = totalAppointments > 0
        ? ((stats.totalAppointments / totalAppointments) * 100).toFixed(2)
        : 0;
      
      stats.completionRate = stats.totalAppointments > 0
        ? ((stats.completed / stats.totalAppointments) * 100).toFixed(2)
        : 0;
    });

    const rankedSpecialties = Object.values(specialtyStats)
      .sort((a, b) => b.totalAppointments - a.totalAppointments);

    return {
      specialties: rankedSpecialties,
      totalAppointments,
      dateRange,
      generatedAt: new Date().toISOString()
    };
  }

  // ===== Dashboard Stats Methods =====

  async getGeneralStats() {
    try {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id, active');

      // Note: specialties table doesn't have is_active column
      const { data: specialties } = await supabase
        .from('specialties')
        .select('id');

      const today = new Date().toISOString();
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select('id, status_id, appointment_status(code)')
        .neq('status_id', AppointmentStatus.CANCELLED)
        .gte('scheduled_start', today);

      const upcoming = (upcomingAppointments || []).filter(apt => 
        ['scheduled', 'confirmed'].includes(apt.appointment_status?.code)
      );

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyAppointments } = await supabase
        .from('appointments')
        .select('id')
        .neq('status_id', AppointmentStatus.CANCELLED)
        .gte('scheduled_start', startOfMonth.toISOString());

      return {
        totalDoctors: doctors?.length || 0,
        activeDoctors: doctors?.filter(d => d.active !== false).length || 0,
        totalSpecialties: specialties?.length || 0,
        upcomingAppointments: upcoming.length,
        totalAppointments: monthlyAppointments?.length || 0
      };
    } catch (error) {
      console.error('Error in getGeneralStats:', error);
      return {
        totalDoctors: 0,
        activeDoctors: 0,
        totalSpecialties: 0,
        upcomingAppointments: 0,
        totalAppointments: 0
      };
    }
  }

  async getDoctorStats() {
    try {
      const { data: doctors } = await supabase
        .from('doctors')
        .select(`id, active, specialties(name)`);

      const bySpecialty = {};
      let activeCount = 0;
      let inactiveCount = 0;

      (doctors || []).forEach(doctor => {
        const isActive = doctor.active !== false;
        if (isActive) {
          activeCount++;
        } else {
          inactiveCount++;
        }

        const specialtyName = doctor.specialties?.name || 'Sin especialidad';
        if (!bySpecialty[specialtyName]) {
          bySpecialty[specialtyName] = { total: 0, active: 0, inactive: 0 };
        }
        bySpecialty[specialtyName].total++;
        if (isActive) {
          bySpecialty[specialtyName].active++;
        } else {
          bySpecialty[specialtyName].inactive++;
        }
      });

      return {
        total: doctors?.length || 0,
        active: activeCount,
        inactive: inactiveCount,
        bySpecialty
      };
    } catch (error) {
      console.error('Error in getDoctorStats:', error);
      return { total: 0, active: 0, inactive: 0, bySpecialty: {} };
    }
  }

  async getAdvancedStats() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          doctor_id,
          created_at,
          status_id,
          appointment_status(code),
          doctors!appointments_doctor_id_fkey(
            id,
            users(first_name, last_name),
            specialties(name)
          )
        `)
        .gte('scheduled_start', thirtyDaysAgo.toISOString());

      const total = appointments?.length || 0;
      let completed = 0, cancelled = 0, noShow = 0;
      const peakHours = {};
      const doctorPerformance = {};
      const specialtyPerformance = {};

      (appointments || []).forEach(apt => {
        const statusCode = apt.appointment_status?.code;
        if (statusCode === 'completed') completed++;
        else if (statusCode === 'cancelled') cancelled++;
        else if (statusCode === 'no_show') noShow++;

        if (apt.scheduled_start) {
          const hour = new Date(apt.scheduled_start).getHours().toString().padStart(2, '0');
          peakHours[hour] = (peakHours[hour] || 0) + 1;
        }

        // Doctor performance - include doctor_id for unique key
        const doctorId = apt.doctor_id;
        const doctorName = apt.doctors?.users 
          ? `Dr. ${apt.doctors.users.first_name} ${apt.doctors.users.last_name}`
          : 'Desconocido';
        if (!doctorPerformance[doctorId]) {
          doctorPerformance[doctorId] = { 
            doctorId, 
            doctorName, 
            totalAppointments: 0, 
            completedAppointments: 0,
            cancelledAppointments: 0,
            noShowAppointments: 0
          };
        }
        doctorPerformance[doctorId].totalAppointments++;
        if (statusCode === 'completed') doctorPerformance[doctorId].completedAppointments++;
        if (statusCode === 'cancelled') doctorPerformance[doctorId].cancelledAppointments++;
        if (statusCode === 'no_show') doctorPerformance[doctorId].noShowAppointments++;

        // Specialty performance
        const specialty = apt.doctors?.specialties?.name || 'Sin especialidad';
        if (!specialtyPerformance[specialty]) {
          specialtyPerformance[specialty] = { 
            specialtyName: specialty, 
            totalAppointments: 0, 
            completedAppointments: 0 
          };
        }
        specialtyPerformance[specialty].totalAppointments++;
        if (statusCode === 'completed') specialtyPerformance[specialty].completedAppointments++;
      });

      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;
      const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(2) : 0;
      const noShowRate = total > 0 ? ((noShow / total) * 100).toFixed(2) : 0;

      const uniqueDays = new Set(
        (appointments || []).filter(a => a.scheduled_start)
          .map(a => new Date(a.scheduled_start).toISOString().split('T')[0])
      );
      const averageDailyAppointments = uniqueDays.size > 0 ? (total / uniqueDays.size).toFixed(2) : 0;

      const uniqueDoctors = new Set((appointments || []).map(a => a.doctor_id).filter(Boolean));
      const averageAppointmentsPerDoctor = uniqueDoctors.size > 0 ? (total / uniqueDoctors.size).toFixed(2) : 0;

      return {
        averageDailyAppointments: Number.parseFloat(averageDailyAppointments),
        averageAppointmentsPerDoctor: Number.parseFloat(averageAppointmentsPerDoctor),
        completionRate: Number.parseFloat(completionRate),
        cancellationRate: Number.parseFloat(cancellationRate),
        noShowRate: Number.parseFloat(noShowRate),
        peakHours,
        // Add efficiencyScore and completionRate to each doctor
        doctorPerformance: Object.values(doctorPerformance)
          .map(doc => {
            const completionRate = doc.totalAppointments > 0 
              ? ((doc.completedAppointments / doc.totalAppointments) * 100).toFixed(1) 
              : '0.0';
            return {
              ...doc,
              completionRate,
              efficiencyScore: completionRate // Same as completion rate
            };
          })
          .sort((a, b) => Number.parseFloat(b.efficiencyScore) - Number.parseFloat(a.efficiencyScore))
          .slice(0, 10),
        // Add completionRate, averageDuration and demandScore to each specialty
        specialtyPerformance: Object.values(specialtyPerformance).map(spec => {
          const completionRate = spec.totalAppointments > 0 
            ? ((spec.completedAppointments / spec.totalAppointments) * 100).toFixed(1) 
            : '0.0';
          // demandScore is based on total appointments relative to average
          const avgAppointments = total / Object.keys(specialtyPerformance).length;
          const demandScore = avgAppointments > 0 
            ? ((spec.totalAppointments / avgAppointments) * 100).toFixed(1)
            : '0.0';
          return {
            ...spec,
            completionRate,
            averageDuration: 30, // Default duration, could calculate from actual data
            demandScore
          };
        }),
        timeMetrics: { averageAdvanceBooking: 0, averageDuration: 30 }
      };
    } catch (error) {
      console.error('Error in getAdvancedStats:', error);
      return {
        averageDailyAppointments: 0,
        averageAppointmentsPerDoctor: 0,
        completionRate: 0,
        cancellationRate: 0,
        noShowRate: 0,
        peakHours: {},
        doctorPerformance: [],
        specialtyPerformance: [],
        timeMetrics: { averageAdvanceBooking: 0, averageDuration: 30 }
      };
    }
  }

  _daysBetween(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  }

  _getPeriodKey(dateStr, groupBy) {
    const date = new Date(dateStr);
    switch (groupBy) {
      case 'day': return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Semana ${weekStart.toISOString().split('T')[0]}`;
      case 'month': return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      case 'year': return date.getFullYear().toString();
      default: return date.toISOString().split('T')[0];
    }
  }
}

module.exports = new ReportService();
