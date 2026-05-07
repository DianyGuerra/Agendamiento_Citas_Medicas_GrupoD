import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import {
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  EyeIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { ConsultationModel, PrescriptionModel, AppointmentModel, MedicalRecordModel, DoctorModel } from '../../models';

// Wizard Steps
const STEPS = [
  { id: 1, name: 'Signos Vitales', icon: HeartIcon },
  { id: 2, name: 'Notas SOAP', icon: ClipboardDocumentListIcon },
  { id: 3, name: 'Recetas', icon: DocumentTextIcon },
  { id: 4, name: 'Órdenes de Lab', icon: BeakerIcon }
];

export default function DoctorConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if came from patient history, agenda, or dashboard
  const fromPatientHistory = location.state?.fromPatientHistory;
  const patientIdFromHistory = location.state?.patientId;
  const fromAgenda = location.state?.fromAgenda;
  const fromDashboard = location.state?.fromDashboard;
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [patientMedicalRecord, setPatientMedicalRecord] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [existingNoteId, setExistingNoteId] = useState(null); // Track if note already exists
  const [notification, setNotification] = useState(null); // Toast notifications
  const [showConfirmModal, setShowConfirmModal] = useState(null); // Confirmation modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpSlots, setFollowUpSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [followUpAppointmentExists, setFollowUpAppointmentExists] = useState(false);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    date: '',
    time: '',
    reason: '',
    notifyPatient: true
  });
  const [modalSlots, setModalSlots] = useState([]);
  const [loadingModalSlots, setLoadingModalSlots] = useState(false);
  
  // Vital signs
  const [vitalSigns, setVitalSigns] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: ''
  });
  
  // SOAP Notes
  const [consultationData, setConsultationData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    notes: '',
    follow_up_required: false,
    follow_up_date: '',
    follow_up_time: '09:00'
  });
  
  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  // Lab Orders
  const [labOrders, setLabOrders] = useState([]);
  const [showLabForm, setShowLabForm] = useState(false);
  const [newLabOrder, setNewLabOrder] = useState({
    test_name: '',
    priority: 'normal',
    notes: ''
  });
  
  const commonLabTests = [
    'Hemograma completo',
    'Glucosa en ayunas',
    'Perfil lipídico',
    'Función renal (BUN, Creatinina)',
    'Función hepática',
    'Urianálisis',
    'Electrolitos séricos',
    'Hemoglobina glicosilada (HbA1c)',
    'TSH (Tiroides)',
    'PCR (Proteína C Reactiva)'
  ];

  useEffect(() => {
    loadConsultationData();
  }, [appointmentId]);

  const loadConsultationData = async () => {
    try {
      setLoading(true);
      
      // Load appointment details
      const appointmentData = await AppointmentModel.getById(appointmentId);
      
      if (!appointmentData) {
        console.error('No appointment data received');
        setLoading(false);
        return;
      }
      
      // Check if appointment is cancelled or no_show - redirect back if so
      // Try multiple sources for status: appointment_status.code, status, or status_id
      const status = appointmentData?.appointment_status?.code || appointmentData?.status;
      const statusId = appointmentData?.status_id;
      
      // Map status_id to status code if we only have the ID
      // IDs based on database: 1=scheduled, 2=confirmed, 3=in_progress, 4=completed, 5=cancelled, 6=no_show
      let effectiveStatus = status;
      if (!effectiveStatus && statusId) {
        const statusMap = { 1: 'scheduled', 2: 'confirmed', 3: 'in_progress', 4: 'completed', 5: 'cancelled', 6: 'no_show' };
        effectiveStatus = statusMap[statusId] || 'scheduled';
      }
      
      // For cancelled or no_show appointments, still allow viewing but mark as read-only
      // The UI will show appropriate banners for these statuses
      
      // Auto-start consultation if not in progress yet
      if (effectiveStatus === 'scheduled' || effectiveStatus === 'confirmed') {
        try {
          await AppointmentModel.update(appointmentId, { status: 'in_progress' });
          effectiveStatus = 'in_progress';
          console.log('Consultation auto-started for appointment:', appointmentId);
        } catch (autoStartError) {
          console.error('Error auto-starting consultation:', autoStartError);
          // Continue anyway - the UI will show appropriate state
        }
      }
      
      setAppointment(appointmentData);
      
      // Check if appointment is completed, cancelled, or no_show
      const completed = effectiveStatus === 'completed';
      const noShow = effectiveStatus === 'no_show';
      const cancelled = effectiveStatus === 'cancelled';
      setIsCompleted(completed || noShow || cancelled);
      
      // Store the actual status for display purposes
      setAppointmentStatus(effectiveStatus);
      
      // Extract patient info - merge user info with patientDetails from patients table
      if (appointmentData.patient) {
        // Combine patient user info with patients table data
        const patientData = {
          ...appointmentData.patient,
          // Add fields from patients table if available
          date_of_birth: appointmentData.patientDetails?.date_of_birth,
          gender: appointmentData.patientDetails?.gender,
          blood_type: appointmentData.patientDetails?.blood_type,
          allergies: appointmentData.patientDetails?.allergies,
          medical_conditions: appointmentData.patientDetails?.medical_conditions
        };
        setPatient(patientData);
        
        // Load patient's previous consultations (completed appointments with notes)
        try {
          const history = await ConsultationModel.getPatientHistory(appointmentData.patient.id);
          // Filter to only show completed consultations with assessment/notes, excluding current appointment
          const completedConsultations = (Array.isArray(history) ? history : [])
            .filter(h => h.status === 'completed' && h.id !== appointmentId && (h.assessment || h.notes));
          setPatientHistory(completedConsultations);
        } catch (err) {
          console.log('No consultation history found');
          setPatientHistory([]);
        }
        
        // Load patient's medical record (general info like diagnoses, treatments)
        try {
          const medicalRecord = await MedicalRecordModel.getByPatient(appointmentData.patient.id);
          if (medicalRecord && typeof medicalRecord === 'object') {
            setPatientMedicalRecord(medicalRecord);
          }
        } catch (err) {
          console.log('No medical record found');
        }
      }
      
      // Load existing consultation notes if any
      try {
        const notes = await ConsultationModel.getNotesByAppointment(appointmentId);
        if (notes) {
          // Save the note ID for updates
          setExistingNoteId(notes.id);
          
          // Check if notes field contains JSON (legacy fix for incorrectly saved data)
          let parsedFromNotes = null;
          if (notes.notes && typeof notes.notes === 'string' && notes.notes.trim().startsWith('{')) {
            try {
              parsedFromNotes = JSON.parse(notes.notes);
              console.log('[Notes] Detected JSON in notes field, parsing:', parsedFromNotes);
            } catch (e) {
              console.log('[Notes] notes field is not JSON');
            }
          }
          
          // Use parsed values from notes field if individual fields are empty
          const effectiveSubjective = notes.subjective || parsedFromNotes?.subjective || '';
          const effectiveObjective = notes.objective || parsedFromNotes?.objective || '';
          const effectiveAssessment = notes.assessment || parsedFromNotes?.assessment || '';
          const effectivePlan = notes.plan || parsedFromNotes?.plan || '';
          const effectiveNotes = parsedFromNotes ? (parsedFromNotes.notes || '') : (notes.notes || '');
          const effectiveFollowUpRequired = notes.follow_up_required || parsedFromNotes?.follow_up_required || false;
          const effectiveFollowUpDate = notes.follow_up_date || parsedFromNotes?.follow_up_date || '';
          let effectiveFollowUpTime = notes.follow_up_time || parsedFromNotes?.follow_up_time || '';
          
          // Normalize follow_up_time format (DB returns HH:MM:SS, we need HH:MM)
          console.log('[FollowUp] Raw from DB:', { 
            follow_up_required: effectiveFollowUpRequired, 
            follow_up_date: effectiveFollowUpDate, 
            follow_up_time: effectiveFollowUpTime 
          });
          if (effectiveFollowUpTime && effectiveFollowUpTime.length > 5) {
            effectiveFollowUpTime = effectiveFollowUpTime.substring(0, 5); // "09:00:00" -> "09:00"
          }
          
          setConsultationData(prev => ({
            ...prev,
            subjective: effectiveSubjective,
            objective: effectiveObjective,
            assessment: effectiveAssessment,
            plan: effectivePlan,
            notes: effectiveNotes,
            follow_up_required: effectiveFollowUpRequired,
            follow_up_date: effectiveFollowUpDate,
            follow_up_time: effectiveFollowUpTime
          }));
          
          // Load vital signs if present
          if (notes.vital_signs) {
            setVitalSigns(notes.vital_signs);
          }
          
          // Load available slots if follow-up date is set
          if (effectiveFollowUpDate && appointmentData?.doctors?.id) {
            try {
              const response = await DoctorModel.getAvailableSlots(appointmentData.doctors.id, effectiveFollowUpDate);
              const slots = response?.slots || response?.data?.slots || [];
              setFollowUpSlots(Array.isArray(slots) ? slots : []);
            } catch (slotErr) {
              console.log('Could not load follow-up slots:', slotErr);
            }
          }
          
          // If consultation is completed and follow-up is required, check if follow-up appointment exists
          if (completed && effectiveFollowUpRequired && effectiveFollowUpDate) {
            try {
              // Check if a follow-up appointment already exists
              const patientAppointments = await AppointmentModel.getByPatient(appointmentData.patient.id);
              console.log('[FollowUp] Patient appointments:', patientAppointments);
              
              if (Array.isArray(patientAppointments)) {
                // Look for an appointment on the follow-up date with the same doctor
                const followUpExists = patientAppointments.some(appt => {
                  // scheduled_start is like "2026-03-27T13:30:00" - extract the date part
                  const apptDate = appt.scheduled_start?.split('T')[0];
                  const isDoctorMatch = appt.doctor_id === appointmentData.doctors?.id;
                  const isNotCurrent = appt.id !== appointmentId;
                  const isDateMatch = apptDate === effectiveFollowUpDate;
                  
                  console.log('[FollowUp] Checking appt:', { 
                    apptId: appt.id, 
                    apptDate, 
                    effectiveFollowUpDate, 
                    doctorMatch: isDoctorMatch, 
                    dateMatch: isDateMatch 
                  });
                  
                  return isDateMatch && isDoctorMatch && isNotCurrent;
                });
                setFollowUpAppointmentExists(followUpExists);
                console.log('[FollowUp] Follow-up exists:', followUpExists);
              }
            } catch (err) {
              console.log('Could not check for existing follow-up:', err);
            }
          }
        }
      } catch (err) {
        console.log('No existing consultation notes');
      }
      
      // Load existing prescriptions for this appointment
      try {
        const existingPrescriptions = await PrescriptionModel.getByAppointment(appointmentId);
        if (existingPrescriptions && existingPrescriptions.medications) {
          setPrescriptions(existingPrescriptions.medications);
        }
      } catch (err) {
        console.log('No existing prescriptions');
      }

      // Load existing lab orders for this appointment
      try {
        const existingLabOrders = await MedicalRecordModel.getLabReportsByAppointment(appointmentId);
        if (existingLabOrders && existingLabOrders.length > 0) {
          // Transform lab_reports to labOrders format
          const loadedLabOrders = existingLabOrders.map(report => ({
            id: report.id,
            test_name: report.test_name,
            notes: report.doctor_notes || '',
            status: report.status
          }));
          setLabOrders(loadedLabOrders);
        }
      } catch (err) {
        console.log('No existing lab orders');
      }
      
    } catch (error) {
      console.error('Error loading consultation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    const weight = parseFloat(vitalSigns.weight);
    const height = parseFloat(vitalSigns.height) / 100; // cm to m
    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  // Get BMI classification
  const getBMIClassification = (bmi) => {
    if (!bmi) return null;
    const value = parseFloat(bmi);
    if (value < 18.5) return { text: 'Bajo peso', color: 'text-blue-600' };
    if (value < 25) return { text: 'Normal', color: 'text-green-600' };
    if (value < 30) return { text: 'Sobrepeso', color: 'text-yellow-600' };
    return { text: 'Obesidad', color: 'text-red-600' };
  };

  // Add prescription to list
  const handleAddPrescription = () => {
    if (!newPrescription.medication || !newPrescription.dosage) {
      showNotification('Por favor ingrese medicamento y dosis', 'warning');
      return;
    }
    
    setPrescriptions([...prescriptions, { ...newPrescription }]);
    setNewPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setShowPrescriptionForm(false);
  };

  // Remove prescription
  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  // Add lab order
  const handleAddLabOrder = () => {
    if (!newLabOrder.test_name) {
      showNotification('Por favor seleccione un examen', 'warning');
      return;
    }
    
    setLabOrders([...labOrders, { ...newLabOrder, id: Date.now() }]);
    setNewLabOrder({
      test_name: '',
      priority: 'normal',
      notes: ''
    });
    setShowLabForm(false);
  };

  // Remove lab order
  const handleRemoveLabOrder = (index) => {
    setLabOrders(labOrders.filter((_, i) => i !== index));
  };

  // Load available slots for the modal when date changes
  const loadModalFollowUpSlots = async (date) => {
    if (!date || !appointment?.doctors?.id) {
      setModalSlots([]);
      return;
    }

    try {
      setLoadingModalSlots(true);
      const response = await DoctorModel.getAvailableSlots(appointment.doctors.id, date);
      const slots = response?.slots || response?.data?.slots || [];
      setModalSlots(Array.isArray(slots) ? slots : []);
      
      // Auto-select first available slot
      if (Array.isArray(slots) && slots.length > 0) {
        const firstSlot = typeof slots[0] === 'object' ? slots[0].time : slots[0];
        setFollowUpData(prev => ({ ...prev, time: firstSlot }));
      }
    } catch (error) {
      console.error('Error loading modal follow-up slots:', error);
      setModalSlots([]);
    } finally {
      setLoadingModalSlots(false);
    }
  };

  // Load available slots when follow-up date changes
  const loadFollowUpSlots = async (date) => {
    if (!date || !appointment?.doctors?.id) {
      setFollowUpSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      const response = await DoctorModel.getAvailableSlots(appointment.doctors.id, date);
      // Response structure: { doctorId, date, slots: [...], totalSlots }
      const slots = response?.slots || response?.data?.slots || [];
      setFollowUpSlots(Array.isArray(slots) ? slots : []);
      
      // Auto-select first available slot if current time is not available
      if (Array.isArray(slots) && slots.length > 0) {
        const currentTime = consultationData.follow_up_time;
        const isCurrentTimeAvailable = slots.some(slot => slot.time === currentTime || slot === currentTime);
        if (!isCurrentTimeAvailable) {
          const firstSlot = typeof slots[0] === 'object' ? slots[0].time : slots[0];
          setConsultationData(prev => ({ ...prev, follow_up_time: firstSlot }));
        }
      }
    } catch (error) {
      console.error('Error loading follow-up slots:', error);
      setFollowUpSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle follow-up date change
  const handleFollowUpDateChange = (date) => {
    setConsultationData(prev => ({ ...prev, follow_up_date: date, follow_up_time: '' }));
    loadFollowUpSlots(date);
  };

  // Create missing follow-up appointment
  const handleCreateFollowUpAppointment = async () => {
    try {
      setCreatingFollowUp(true);
      
      const result = await ConsultationModel.createFollowUpAppointment(appointmentId);
      
      // The result from the API is { followUpAppointment: {...}, message: "..." }
      // If we get here without an error, the request was successful
      setFollowUpAppointmentExists(true);
      showNotification(result.message || 'Cita de seguimiento creada exitosamente', 'success');
      
      // If there's a follow-up appointment ID, log it
      if (result.followUpAppointment?.id) {
        console.log('[FollowUp] Created appointment ID:', result.followUpAppointment.id);
      }
    } catch (error) {
      console.error('Error creating follow-up appointment:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear la cita de seguimiento';
      showNotification(errorMessage, 'error');
    } finally {
      setCreatingFollowUp(false);
    }
  };

  // Navigate steps
  const goToNextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const goToPrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Save progress (without completing)
  const handleSaveProgress = async () => {
    // Prevent saving if already completed
    if (isCompleted) {
      showNotification('Esta consulta ya ha sido completada. No se pueden guardar cambios.', 'error');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Save consultation notes with vital signs
      // Explicitly structure the note data to avoid issues
      const noteData = {
        appointment_id: appointmentId,
        subjective: consultationData.subjective || '',
        objective: consultationData.objective || '',
        assessment: consultationData.assessment || '',
        plan: consultationData.plan || '',
        notes: consultationData.notes || '', // Ensure this is a string, not an object
        follow_up_required: consultationData.follow_up_required || false,
        follow_up_date: consultationData.follow_up_date || null,
        follow_up_time: consultationData.follow_up_time || null,
        vital_signs: vitalSigns
      };
      
      console.log('[Save] Sending note data:', noteData);
      
      // Update if note exists, otherwise create
      if (existingNoteId) {
        await ConsultationModel.updateNote(existingNoteId, noteData);
      } else {
        const newNote = await ConsultationModel.createNote(noteData);
        // Save the new note ID for future updates
        if (newNote?.id || newNote?.data?.id) {
          setExistingNoteId(newNote.id || newNote.data?.id);
        }
      }
      
      // 2. Save prescriptions if any (creates/updates in background)
      if (prescriptions.length > 0) {
        try {
          const prescriptionData = {
            medications: prescriptions,
            notes: consultationData.plan,
            diagnosis: consultationData.assessment || 'Pendiente de diagnóstico'
          };
          await PrescriptionModel.createForAppointment(appointmentId, prescriptionData);
        } catch (rxError) {
          console.log('Error saving prescriptions (may already exist):', rxError);
        }
      }
      
      // 3. Save lab orders if any - only save NEW ones (without existing id)
      const newLabOrders = labOrders.filter(order => !order.id || typeof order.id === 'number');
      if (newLabOrders.length > 0) {
        try {
          await MedicalRecordModel.createLabReports({
            patient_id: patient.id,
            appointment_id: appointmentId,
            orders: newLabOrders
          });
          
          // Reload lab orders to get the IDs from database
          const updatedLabOrders = await MedicalRecordModel.getLabReportsByAppointment(appointmentId);
          if (updatedLabOrders && updatedLabOrders.length > 0) {
            const loadedLabOrders = updatedLabOrders.map(report => ({
              id: report.id,
              test_name: report.test_name,
              notes: report.doctor_notes || '',
              status: report.status
            }));
            setLabOrders(loadedLabOrders);
          }
        } catch (labError) {
          console.log('Error saving lab orders:', labError);
        }
      }
      
      showNotification('Progreso guardado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error saving progress:', error);
      showNotification('Error al guardar el progreso', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  // Show notification toast
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Complete consultation - SAVES EVERYTHING
  const handleCompleteConsultation = async () => {
    // Prevent completing if already completed
    if (isCompleted) {
      showNotification('Esta consulta ya ha sido completada', 'error');
      return;
    }

    // Validation
    if (!consultationData.assessment) {
      showNotification('Por favor ingrese el diagnóstico (Evaluación)', 'warning');
      setCurrentStep(2);
      return;
    }
    
    // Show confirmation modal
    setShowConfirmModal({
      title: 'Completar Consulta',
      message: '¿Está seguro de completar la consulta? Esta acción finalizará la cita.',
      onConfirm: executeCompleteConsultation,
      confirmText: 'Sí, completar',
      cancelText: 'Cancelar'
    });
  };

  // Execute the completion after confirmation
  const executeCompleteConsultation = async () => {
    setShowConfirmModal(null);
    
    try {
      setSaving(true);
      
      // 1. Save consultation notes with vital signs
      const noteData = {
        appointment_id: appointmentId,
        ...consultationData,
        vital_signs: vitalSigns
      };
      
      // Update if note exists, otherwise create
      if (existingNoteId) {
        await ConsultationModel.updateNote(existingNoteId, noteData);
      } else {
        await ConsultationModel.createNote(noteData);
      }
      
      // 2. Save prescriptions if any
      if (prescriptions.length > 0) {
        const prescriptionData = {
          medications: prescriptions,
          notes: consultationData.plan,
          diagnosis: consultationData.assessment || 'Pendiente de diagnóstico'
        };
        
        try {
          await PrescriptionModel.createForAppointment(appointmentId, prescriptionData);
        } catch (rxError) {
          console.error('Error saving prescriptions:', rxError);
          // Continue even if prescription save fails
        }
      }
      
      // 3. Save lab orders if any - only save NEW ones (without existing id)
      const newLabOrders = labOrders.filter(order => !order.id || typeof order.id === 'number');
      if (newLabOrders.length > 0) {
        try {
          await MedicalRecordModel.createLabReports({
            patient_id: patient.id,
            appointment_id: appointmentId,
            orders: newLabOrders
          });
        } catch (labError) {
          console.error('Error saving lab orders:', labError);
        }
      }
      
      // 4. End consultation (updates appointment status to completed)
      await ConsultationModel.endConsultation(appointmentId, consultationData);
      
      showNotification('Consulta completada exitosamente', 'success');
      
      // Navigate after a short delay to show notification
      setTimeout(() => {
        navigate('/doctor/appointments');
      }, 1500);
      
    } catch (error) {
      console.error('Error completing consultation:', error);
      showNotification('Error al completar la consulta', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle back navigation
  const handleGoBack = () => {
    if (fromPatientHistory && patientIdFromHistory) {
      // Go back to patient history view
      navigate('/doctor/patients', { state: { selectedPatientId: patientIdFromHistory } });
    } else if (fromDashboard) {
      // Go back to dashboard
      navigate('/doctor/dashboard');
    } else if (fromAgenda) {
      // Go back to agenda/appointments
      navigate('/doctor/appointments');
    } else {
      // Default: go to dashboard
      navigate('/doctor/dashboard');
    }
  };

  // Create follow-up appointment
  const handleCreateFollowUp = async () => {
    if (!followUpData.date) {
      showNotification('Por favor seleccione una fecha para la cita de seguimiento', 'warning');
      return;
    }

    if (!followUpData.time) {
      showNotification('Por favor seleccione un horario disponible', 'warning');
      return;
    }

    try {
      setSaving(true);
      
      // Normalize time format (ensure HH:MM format)
      const timeStr = followUpData.time.includes(':') ? followUpData.time : '09:00';
      const [hours, minutes] = timeStr.split(':');
      const endHour = (parseInt(hours) + 1).toString().padStart(2, '0');
      
      // Create follow-up appointment
      const followUpAppointment = {
        patient_user_id: patient?.id || appointment?.patient_user_id,
        doctor_id: appointment?.doctor_id,
        scheduled_start: `${followUpData.date}T${hours}:${minutes}:00`,
        scheduled_end: `${followUpData.date}T${endHour}:${minutes}:00`,
        reason: followUpData.reason || `Seguimiento de consulta del ${new Date(appointment?.scheduled_start).toLocaleDateString('es-ES')}`,
        status: 'scheduled'
      };

      await AppointmentModel.create(followUpAppointment);

      // TODO: If notifyPatient is true, send notification email
      if (followUpData.notifyPatient) {
        console.log('Sending follow-up notification to patient...');
        // This would trigger an email notification through the external API
      }

      showNotification('Cita de seguimiento creada exitosamente' + (followUpData.notifyPatient ? '. El paciente será notificado.' : ''), 'success');
      setShowFollowUpModal(false);
      setFollowUpData({ date: '', time: '', reason: '', notifyPatient: true });

    } catch (error) {
      console.error('Error creating follow-up:', error);
      showNotification('Error al crear la cita de seguimiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DoctorLayout>
    );
  }

  if (!appointment) {
    return (
      <DoctorLayout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Consulta no encontrada</h2>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {fromPatientHistory ? 'Volver al historial del paciente' : fromAgenda ? 'Volver a Mi Agenda' : fromDashboard ? 'Volver al Dashboard' : 'Volver al Dashboard'}
          </button>
        </div>
      </DoctorLayout>
    );
  }

  const bmi = calculateBMI();
  const bmiClass = getBMIClassification(bmi);
  
  // Input props for read-only mode when consultation is completed
  const readOnlyProps = isCompleted ? {
    disabled: true,
    readOnly: true,
    className: 'bg-gray-100 cursor-not-allowed'
  } : {};
  
  // Check if we can add prescriptions/labs even when completed (exceptional cases)
  const canAddMedications = !isCompleted; // For now, disable when completed
  const canAddLabs = !isCompleted; // For now, disable when completed

  return (
    <DoctorLayout>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
          {notification.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
          {notification.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{showConfirmModal.title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{showConfirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showConfirmModal.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showConfirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Completed/Cancelled/NoShow Consultation Banner */}
        {isCompleted && (
          <div className={`border rounded-xl p-4 flex items-center justify-between ${
            appointmentStatus === 'completed' 
              ? 'bg-blue-50 border-blue-200' 
              : appointmentStatus === 'cancelled'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <EyeIcon className={`w-6 h-6 ${
                appointmentStatus === 'completed' 
                  ? 'text-blue-600' 
                  : appointmentStatus === 'cancelled'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`} />
              <div>
                <p className={`font-semibold ${
                  appointmentStatus === 'completed' 
                    ? 'text-blue-800' 
                    : appointmentStatus === 'cancelled'
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }`}>
                  {appointmentStatus === 'completed' 
                    ? 'Modo de solo lectura' 
                    : appointmentStatus === 'cancelled'
                    ? 'Cita Cancelada'
                    : 'Paciente No Asistió'}
                </p>
                <p className={`text-sm ${
                  appointmentStatus === 'completed' 
                    ? 'text-blue-600' 
                    : appointmentStatus === 'cancelled'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}>
                  {appointmentStatus === 'completed' 
                    ? 'Esta consulta ya fue completada. Los datos no pueden ser modificados.' 
                    : appointmentStatus === 'cancelled'
                    ? 'Esta cita fue cancelada. No se realizó ninguna consulta.'
                    : 'El paciente no se presentó a la cita programada.'}
                </p>
              </div>
            </div>
            {/* Show follow-up button only if completed, has follow-up configured, but appointment doesn't exist yet */}
            {appointmentStatus === 'completed' && consultationData.follow_up_required && 
             consultationData.follow_up_date && !followUpAppointmentExists && (
              <button
                onClick={handleCreateFollowUpAppointment}
                disabled={creatingFollowUp}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingFollowUp ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <CalendarDaysIcon className="w-5 h-5" />
                    Crear Cita de Seguimiento
                  </>
                )}
              </button>
            )}
            {/* Show modal button if completed but NO follow-up was configured during consultation */}
            {appointmentStatus === 'completed' && !consultationData.follow_up_required && (
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <CalendarDaysIcon className="w-5 h-5" />
                Agendar Seguimiento
              </button>
            )}
            {(appointmentStatus === 'cancelled' || appointmentStatus === 'no_show') && (
              <button
                onClick={() => setShowFollowUpModal(true)}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                  appointmentStatus === 'cancelled' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                <CalendarDaysIcon className="w-5 h-5" />
                Reagendar Cita
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleGoBack}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
                title={fromPatientHistory ? 'Volver al historial del paciente' : fromAgenda ? 'Volver a Mi Agenda' : fromDashboard ? 'Volver al Dashboard' : 'Volver al Dashboard'}
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {isCompleted ? (
                    <>
                      <EyeIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        appointmentStatus === 'completed' 
                          ? 'text-blue-600' 
                          : appointmentStatus === 'cancelled'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`} />
                      {appointmentStatus === 'completed' 
                        ? 'Detalle de Consulta' 
                        : appointmentStatus === 'cancelled'
                        ? 'Cita Cancelada'
                        : 'Cita No Asistida'}
                    </>
                  ) : (
                    'Consulta Médica'
                  )}
                </h1>
                <p className="text-gray-600">
                  {appointment.scheduled_start ? (
                    <>
                      {new Date(appointment.scheduled_start).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} - {new Date(appointment.scheduled_start).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </>
                  ) : 'Fecha no disponible'}
                  {isCompleted && (
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      appointmentStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointmentStatus === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointmentStatus === 'completed' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                      {appointmentStatus === 'completed' 
                        ? 'Completada' 
                        : appointmentStatus === 'cancelled'
                        ? 'Cancelada'
                        : 'No Asistió'}
                    </span>
                  )}
                </p>
                {fromPatientHistory && (
                  <p className="text-sm text-blue-600 mt-1">
                    Viendo desde historial del paciente
                  </p>
                )}
              </div>
            </div>
            
            {!isCompleted && (
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSaveProgress}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1 sm:gap-2 text-sm"
                >
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Guardar Progreso</span>
                <span className="sm:hidden">Guardar</span>
              </button>
              <button
                onClick={handleCompleteConsultation}
                disabled={saving}
                className="flex-1 sm:flex-none px-3 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1 sm:gap-2 text-sm"
              >
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Completar Consulta'}</span>
                <span className="sm:hidden">{saving ? 'Guardando...' : 'Completar'}</span>
              </button>
            </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar - Patient Info */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 order-2 lg:order-1">
            {/* Patient Card */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
              <div className="flex lg:flex-col items-center lg:text-center gap-3 lg:gap-0 lg:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center lg:mx-auto lg:mb-3 flex-shrink-0">
                  <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient?.first_name || patient?.user?.first_name} {patient?.last_name || patient?.user?.last_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {calculateAge(patient?.date_of_birth)} años • {patient?.gender ? (patient.gender === 'male' ? 'M' : 'F') : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {(patient?.phone_number || patient?.user?.phone) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{patient?.phone_number || patient?.user?.phone}</span>
                  </div>
                )}
                {patient?.blood_type && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tipo de sangre:</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      {patient.blood_type}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {(patient?.allergies || patient?.chronic_conditions) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Alertas Médicas
                </h4>
                {patient?.allergies && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-red-700">Alergias:</p>
                    <p className="text-sm text-red-600">{patient.allergies}</p>
                  </div>
                )}
                {patient?.chronic_conditions && (
                  <div>
                    <p className="text-xs font-medium text-red-700">Condiciones crónicas:</p>
                    <p className="text-sm text-red-600">{patient.chronic_conditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Medical Record Summary */}
            {patientMedicalRecord && (patientMedicalRecord.diagnoses || patientMedicalRecord.treatments || patientMedicalRecord.medical_history) && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-4 h-4" />
                  Historial Médico
                </h4>
                {patientMedicalRecord.diagnoses && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-blue-700">Diagnósticos:</p>
                    <p className="text-sm text-blue-900">{patientMedicalRecord.diagnoses}</p>
                  </div>
                )}
                {patientMedicalRecord.treatments && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-blue-700">Tratamientos:</p>
                    <p className="text-sm text-blue-900">{patientMedicalRecord.treatments}</p>
                  </div>
                )}
                {patientMedicalRecord.current_medications && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-blue-700">Medicamentos actuales:</p>
                    <p className="text-sm text-blue-900">{patientMedicalRecord.current_medications}</p>
                  </div>
                )}
                {patientMedicalRecord.medical_history && (
                  <div>
                    <p className="text-xs font-medium text-blue-700">Historia:</p>
                    <p className="text-sm text-blue-900">{patientMedicalRecord.medical_history}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Consultations */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Consultas Anteriores</h4>
              {patientHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Sin consultas previas registradas</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patientHistory.slice(0, 5).map((record, idx) => (
                    <div key={record.id || idx} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium text-gray-700">{record.assessment || record.reason || 'Consulta'}</p>
                      {record.plan && (
                        <p className="text-xs text-gray-600 mt-1">Plan: {record.plan}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {record.scheduled_start ? new Date(record.scheduled_start).toLocaleDateString('es-ES') : 
                         record.created_at ? new Date(record.created_at).toLocaleDateString('es-ES') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            {/* Step Indicator */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium hidden xs:inline sm:inline">{step.name}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`hidden sm:block flex-1 h-1 mx-1 sm:mx-2 rounded min-w-[16px] ${
                        currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              {/* Step 1: Vital Signs */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                    Signos Vitales
                    {isCompleted && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs sm:text-sm font-normal text-gray-500">
                        <LockClosedIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Solo lectura</span>
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Blood Pressure - Systolic */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        P. Sistólica <span className="hidden sm:inline">(mmHg)</span>
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.blood_pressure_systolic}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, blood_pressure_systolic: e.target.value})}
                        placeholder="120"
                        disabled={isCompleted}
                        className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* Blood Pressure - Diastolic */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        P. Diastólica <span className="hidden sm:inline">(mmHg)</span>
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.blood_pressure_diastolic}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, blood_pressure_diastolic: e.target.value})}
                        placeholder="80"
                        disabled={isCompleted}
                        className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* Heart Rate */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        F. Cardíaca <span className="hidden sm:inline">(bpm)</span>
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.heart_rate}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, heart_rate: e.target.value})}
                        placeholder="60-100"
                        disabled={isCompleted}
                        className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Temp. <span className="hidden sm:inline">(°C)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={vitalSigns.temperature}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, temperature: e.target.value})}
                        placeholder="36.5"
                        disabled={isCompleted}
                        className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* Respiratory Rate */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        F. Resp. <span className="hidden sm:inline">(rpm)</span>
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.respiratory_rate}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, respiratory_rate: e.target.value})}
                        placeholder="12-20"
                        disabled={isCompleted}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    {/* Oxygen Saturation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saturación O₂ (%)
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.oxygen_saturation}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, oxygen_saturation: e.target.value})}
                        placeholder="95-100"
                        disabled={isCompleted}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={vitalSigns.weight}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, weight: e.target.value})}
                        placeholder="70"
                        disabled={isCompleted}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Altura (cm)
                      </label>
                      <input
                        type="number"
                        value={vitalSigns.height}
                        onChange={(e) => !isCompleted && setVitalSigns({...vitalSigns, height: e.target.value})}
                        placeholder="170"
                        disabled={isCompleted}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* BMI Calculator */}
                  {bmi && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">IMC Calculado:</span>{' '}
                        <span className={`font-bold ${bmiClass?.color}`}>
                          {bmi} - {bmiClass?.text}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: SOAP Notes */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />
                    Notas de Consulta (SOAP)
                    {isCompleted && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-gray-500">
                        <LockClosedIcon className="w-4 h-4" />
                        Solo lectura
                      </span>
                    )}
                  </h3>
                  
                  {/* Subjective */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      S - Subjetivo (Motivo de consulta)
                    </label>
                    <textarea
                      value={consultationData.subjective}
                      onChange={(e) => !isCompleted && setConsultationData({...consultationData, subjective: e.target.value})}
                      placeholder="¿Qué refiere el paciente? Síntomas, duración, intensidad..."
                      disabled={isCompleted}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={3}
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      O - Objetivo (Examen físico)
                    </label>
                    <textarea
                      value={consultationData.objective}
                      onChange={(e) => !isCompleted && setConsultationData({...consultationData, objective: e.target.value})}
                      placeholder="Hallazgos del examen físico..."
                      disabled={isCompleted}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={3}
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      A - Evaluación (Diagnóstico) *
                    </label>
                    <textarea
                      value={consultationData.assessment}
                      onChange={(e) => !isCompleted && setConsultationData({...consultationData, assessment: e.target.value})}
                      placeholder="Diagnóstico o impresión diagnóstica..."
                      disabled={isCompleted}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={2}
                      required
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      P - Plan (Tratamiento)
                    </label>
                    <textarea
                      value={consultationData.plan}
                      onChange={(e) => !isCompleted && setConsultationData({...consultationData, plan: e.target.value})}
                      placeholder="Plan de tratamiento, indicaciones..."
                      disabled={isCompleted}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={3}
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Notas Adicionales
                    </label>
                    <textarea
                      value={consultationData.notes}
                      onChange={(e) => !isCompleted && setConsultationData({...consultationData, notes: e.target.value})}
                      placeholder="Observaciones adicionales..."
                      disabled={isCompleted}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={2}
                    />
                  </div>

                  {/* Follow-up */}
                  <div className="flex flex-wrap items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={consultationData.follow_up_required}
                        onChange={(e) => !isCompleted && setConsultationData({...consultationData, follow_up_required: e.target.checked})}
                        disabled={isCompleted}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Requiere seguimiento</span>
                    </label>
                    
                    {consultationData.follow_up_required && (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Fecha</label>
                            <input
                              type="date"
                              value={consultationData.follow_up_date}
                              onChange={(e) => !isCompleted && handleFollowUpDateChange(e.target.value)}
                              disabled={isCompleted}
                              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Horario disponible</label>
                            {loadingSlots ? (
                              <div className="px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Cargando...
                              </div>
                            ) : !consultationData.follow_up_date ? (
                              <div className="px-3 py-2 border rounded-lg bg-gray-100 text-gray-400">
                                Seleccione fecha primero
                              </div>
                            ) : followUpSlots.length === 0 ? (
                              <div className="px-3 py-2 border rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                                No hay horarios disponibles
                              </div>
                            ) : (
                              <select
                                value={consultationData.follow_up_time}
                                onChange={(e) => !isCompleted && setConsultationData({...consultationData, follow_up_time: e.target.value})}
                                disabled={isCompleted}
                                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[140px] ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              >
                                <option value="">Seleccionar hora</option>
                                {followUpSlots.map((slot, idx) => {
                                  const time = typeof slot === 'object' ? slot.time : slot;
                                  return (
                                    <option key={idx} value={time}>
                                      {time}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        </div>
                        
                        {/* Follow-up status message or create button */}
                        {!isCompleted ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Se creará cita de seguimiento automáticamente al completar
                          </span>
                        ) : followUpAppointmentExists ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4" />
                            Cita de seguimiento creada
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className="text-sm text-yellow-600 flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              La cita de seguimiento no fue creada
                            </span>
                            <button
                              onClick={handleCreateFollowUpAppointment}
                              disabled={creatingFollowUp}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {creatingFollowUp ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Creando...
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="w-4 h-4" />
                                  Crear cita de seguimiento
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Prescriptions */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <DocumentTextIcon className="w-6 h-6 text-purple-500" />
                      Recetas Médicas
                      {isCompleted && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-gray-500">
                          <LockClosedIcon className="w-4 h-4" />
                          Solo lectura
                        </span>
                      )}
                    </h3>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowPrescriptionForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Agregar Medicamento
                      </button>
                    )}
                  </div>

                  {/* Prescription List */}
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No hay medicamentos {isCompleted ? 'registrados en esta consulta' : 'agregados'}</p>
                      {!isCompleted && <p className="text-sm">Haga clic en "Agregar Medicamento" para crear una receta</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((rx, idx) => (
                        <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-gray-900">{rx.medication}</p>
                            </div>
                            <div className="ml-8 space-y-1 text-sm">
                              <p className="text-gray-700">
                                <span className="font-medium">Dosis:</span> {rx.dosage}
                              </p>
                              {rx.frequency && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Frecuencia:</span> {rx.frequency}
                                </p>
                              )}
                              {rx.duration && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Duración:</span> {rx.duration}
                                </p>
                              )}
                              {rx.instructions && (
                                <p className="text-gray-500 italic">{rx.instructions}</p>
                              )}
                            </div>
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleRemovePrescription(idx)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Prescription Form */}
                  {showPrescriptionForm && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-4">Nuevo Medicamento</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicamento *
                          </label>
                          <input
                            type="text"
                            value={newPrescription.medication}
                            onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                            placeholder="Nombre del medicamento"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosis *
                          </label>
                          <input
                            type="text"
                            value={newPrescription.dosage}
                            onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                            placeholder="Ej: 500mg"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frecuencia
                          </label>
                          <input
                            type="text"
                            value={newPrescription.frequency}
                            onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                            placeholder="Ej: Cada 8 horas"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración
                          </label>
                          <input
                            type="text"
                            value={newPrescription.duration}
                            onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                            placeholder="Ej: 7 días"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instrucciones
                          </label>
                          <input
                            type="text"
                            value={newPrescription.instructions}
                            onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                            placeholder="Ej: Tomar después de las comidas"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddPrescription}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => setShowPrescriptionForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Lab Orders */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <BeakerIcon className="w-6 h-6 text-teal-500" />
                      Órdenes de Laboratorio
                      {isCompleted && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-gray-500">
                          <LockClosedIcon className="w-4 h-4" />
                          Solo lectura
                        </span>
                      )}
                    </h3>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowLabForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Agregar Examen
                      </button>
                    )}
                  </div>

                  {/* Lab Orders List */}
                  {labOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BeakerIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No hay exámenes {isCompleted ? 'registrados en esta consulta' : 'ordenados'}</p>
                      {!isCompleted && <p className="text-sm">Haga clic en "Agregar Examen" para ordenar laboratorios</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {labOrders.map((order, idx) => (
                        <div key={order.id || idx} className="p-4 bg-teal-50 border border-teal-200 rounded-lg flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-gray-900">{order.test_name}</p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                order.priority === 'urgent' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {order.priority === 'urgent' ? 'Urgente' : 'Normal'}
                              </span>
                            </div>
                            {order.notes && (
                              <p className="ml-8 text-sm text-gray-600">{order.notes}</p>
                            )}
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleRemoveLabOrder(idx)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Lab Order Form */}
                  {showLabForm && !isCompleted && (
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <h5 className="font-semibold text-teal-900 mb-4">Nueva Orden de Laboratorio</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Examen *
                          </label>
                          <select
                            value={newLabOrder.test_name}
                            onChange={(e) => setNewLabOrder({...newLabOrder, test_name: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Seleccione un examen</option>
                            {commonLabTests.map((test, idx) => (
                              <option key={idx} value={test}>{test}</option>
                            ))}
                            <option value="other">Otro (especificar)</option>
                          </select>
                        </div>
                        
                        {newLabOrder.test_name === 'other' && (
                          <div>
                            <input
                              type="text"
                              placeholder="Especifique el examen"
                              onChange={(e) => setNewLabOrder({...newLabOrder, test_name: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prioridad
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="priority"
                                value="normal"
                                checked={newLabOrder.priority === 'normal'}
                                onChange={(e) => setNewLabOrder({...newLabOrder, priority: e.target.value})}
                                className="text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm">Normal</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="priority"
                                value="urgent"
                                checked={newLabOrder.priority === 'urgent'}
                                onChange={(e) => setNewLabOrder({...newLabOrder, priority: e.target.value})}
                                className="text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm text-red-600">Urgente</span>
                            </label>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas/Indicaciones
                          </label>
                          <input
                            type="text"
                            value={newLabOrder.notes}
                            onChange={(e) => setNewLabOrder({...newLabOrder, notes: e.target.value})}
                            placeholder="Indicaciones especiales..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddLabOrder}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => setShowLabForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  onClick={goToPrevStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-500">
                  Paso {currentStep} de {STEPS.length}
                </div>
                
                <button
                  onClick={goToNextStep}
                  disabled={currentStep === 4}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    currentStep === 4
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Siguiente
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up Appointment Modal */}
        {showFollowUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                  Crear Cita de Seguimiento
                </h3>
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente
                  </label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                    {patient?.first_name || patient?.user?.first_name} {patient?.last_name || patient?.user?.last_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de seguimiento *
                  </label>
                  <input
                    type="date"
                    value={followUpData.date}
                    onChange={(e) => {
                      setFollowUpData({...followUpData, date: e.target.value, time: ''});
                      loadModalFollowUpSlots(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario disponible *
                  </label>
                  {loadingModalSlots ? (
                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Cargando horarios...
                    </div>
                  ) : !followUpData.date ? (
                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-400">
                      Seleccione una fecha primero
                    </div>
                  ) : modalSlots.length === 0 ? (
                    <div className="w-full px-3 py-2 border rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                      No hay horarios disponibles para esta fecha
                    </div>
                  ) : (
                    <select
                      value={followUpData.time}
                      onChange={(e) => setFollowUpData({...followUpData, time: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar horario</option>
                      {modalSlots.map((slot, idx) => {
                        const time = typeof slot === 'object' ? slot.time : slot;
                        return (
                          <option key={idx} value={time}>
                            {time}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del seguimiento
                  </label>
                  <textarea
                    value={followUpData.reason}
                    onChange={(e) => setFollowUpData({...followUpData, reason: e.target.value})}
                    placeholder="Ej: Revisión de resultados de laboratorio, control de tratamiento..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="notifyPatient"
                    checked={followUpData.notifyPatient}
                    onChange={(e) => setFollowUpData({...followUpData, notifyPatient: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notifyPatient" className="flex items-center gap-2 text-sm text-blue-800 cursor-pointer">
                    <BellAlertIcon className="w-5 h-5" />
                    Notificar al paciente por correo electrónico
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateFollowUp}
                  disabled={saving || !followUpData.date || !followUpData.time}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <CalendarDaysIcon className="w-5 h-5" />
                      Crear Cita
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
