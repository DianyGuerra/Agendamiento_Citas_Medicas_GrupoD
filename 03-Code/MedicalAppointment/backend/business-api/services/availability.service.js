/**
 * Availability Service
 * Business logic for calculating doctor availability and appointment slots
 * 
 * @module business-api/services/AvailabilityService
 */

const { supabase } = require('../../shared/config/database.config');
const { BusinessError } = require('../../shared/errors');
const { timeToMinutes, formatDateISO } = require('../../shared/utils/helpers.utils');
const { APPOINTMENT_DURATION_MINUTES, BUSINESS_HOURS } = require('../../shared/constants/app.constants');

class AvailabilityService {
  /**
   * Get available appointment slots for a doctor on a specific date
   * @param {string} doctorId - Doctor UUID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Available time slots
   */
  async getAvailableSlots(doctorId, date) {
    // Validate date is not in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      throw new BusinessError('No se pueden consultar fechas pasadas');
    }

    // Check for schedule exceptions (vacations, blocked days)
    const exception = await this._getException(doctorId, date);
    if (exception) {
      // Check exception_type to determine if doctor is available
      if (exception.exception_type === 'vacation' || exception.exception_type === 'day_off') {
        return []; // Doctor not available this day
      }
      // If exception allows custom hours, use those
      if (exception.exception_start_time && exception.exception_end_time) {
        return this._generateSlots(
          exception.exception_start_time,
          exception.exception_end_time,
          date,
          doctorId
        );
      }
    }

    // Get regular schedule for this day of week
    const dayOfWeek = this._getDayOfWeek(date);
    const schedule = await this._getSchedule(doctorId, dayOfWeek);

    if (!schedule || !schedule.is_working_day) {
      return []; // No schedule for this day or not a working day
    }

    // Generate slots and filter out booked ones
    return this._generateSlots(
      schedule.start_time,
      schedule.end_time,
      date,
      doctorId,
      schedule.break_start_time,
      schedule.break_end_time
    );
  }

  /**
   * Check if a specific slot is available
   * @param {string} doctorId - Doctor UUID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} time - Time in HH:MM format
   * @returns {Promise<boolean>} True if slot is available
   */
  async isSlotAvailable(doctorId, date, time) {
    const slots = await this.getAvailableSlots(doctorId, date);
    return slots.some(slot => slot.time === time);
  }

  /**
   * Get doctor's weekly availability
   * @param {string} doctorId - Doctor UUID
   * @param {string} startDate - Start date
   * @param {number} weeks - Number of weeks to fetch
   * @returns {Promise<Object>} Weekly availability map
   */
  async getWeeklyAvailability(doctorId, startDate, weeks = 4) {
    const availability = {};
    const start = new Date(startDate);

    for (let i = 0; i < weeks * 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = formatDateISO(currentDate);
      
      try {
        const slots = await this.getAvailableSlots(doctorId, dateStr);
        if (slots.length > 0) {
          availability[dateStr] = slots;
        }
      } catch (error) {
        // Skip dates that throw errors (e.g., past dates)
        continue;
      }
    }

    return availability;
  }

  /**
   * Get next available appointment slot for a doctor
   * @param {string} doctorId - Doctor UUID
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Promise<Object|null>} Next available slot or null
   */
  async getNextAvailableSlot(doctorId, daysAhead = 30) {
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = formatDateISO(currentDate);

      try {
        const slots = await this.getAvailableSlots(doctorId, dateStr);
        
        // For today, filter slots that are in the future
        if (i === 0) {
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const futureSlots = slots.filter(slot => {
            const slotMinutes = timeToMinutes(slot.time);
            return slotMinutes > nowMinutes + 30; // At least 30 min buffer
          });
          
          if (futureSlots.length > 0) {
            return { date: dateStr, slot: futureSlots[0] };
          }
        } else if (slots.length > 0) {
          return { date: dateStr, slot: slots[0] };
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * Get schedule exception for a date
   * @private
   */
  async _getException(doctorId, date) {
    const { data, error } = await supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('exception_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get regular schedule for a day of week
   * @private
   */
  async _getSchedule(doctorId, dayOfWeek) {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Generate time slots and filter booked ones
   * @private
   */
  async _generateSlots(startTime, endTime, date, doctorId, breakStart = null, breakEnd = null) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const slotDuration = APPOINTMENT_DURATION_MINUTES || 30;
    
    const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
    const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;

    // Get existing appointments for this date
    const bookedSlots = await this._getBookedSlots(doctorId, date);

    const slots = [];
    let currentMinutes = startMinutes;

    while (currentMinutes + slotDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Skip break time
      const isInBreak = breakStartMinutes && breakEndMinutes && 
        currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;

      if (!isInBreak && !bookedSlots.includes(timeStr)) {
        slots.push({
          time: timeStr,
          available: true,
          duration: slotDuration
        });
      }

      currentMinutes += slotDuration;
    }

    return slots;
  }

  /**
   * Get booked appointment times for a date
   * Using scheduled_start timestamp and status_id with appointment_status join
   * @private
   */
  async _getBookedSlots(doctorId, date) {
    // Create date range for the day
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        scheduled_start,
        appointment_status!inner(code)
      `)
      .eq('doctor_id', doctorId)
      .gte('scheduled_start', startOfDay)
      .lte('scheduled_start', endOfDay)
      .in('appointment_status.code', ['scheduled', 'confirmed', 'in_progress']);

    if (error) {
      console.error('Error getting booked slots:', error);
      return [];
    }

    return (data || []).map(apt => {
      if (!apt.scheduled_start) return null;
      const date = new Date(apt.scheduled_start);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }).filter(Boolean);
  }

  /**
   * Get day of week as number (0-6) from date string
   * @private
   */
  _getDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  }
}

module.exports = new AvailabilityService();
