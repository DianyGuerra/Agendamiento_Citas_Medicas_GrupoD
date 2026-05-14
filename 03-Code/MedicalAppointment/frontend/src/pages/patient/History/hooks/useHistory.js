import { useState, useEffect, useMemo } from 'react';
import { MedicalRecordModel } from '../../../../models';

/**
 * Hook for managing medical history state and logic
 */
export function useHistory() {
  const [loading, setLoading] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const recordResponse = await MedicalRecordModel.get();
      setMedicalRecord(recordResponse.data || recordResponse);

      const notesResponse = await MedicalRecordModel.getConsultationNotes();
      const notesData = notesResponse.data || notesResponse;
      setConsultationNotes(Array.isArray(notesData) ? notesData : []);
    } catch (e) {
      console.error('Error loading medical history:', e);
      setError('Error al cargar el historial médico.');
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    const ys = new Set();
    consultationNotes.forEach((r) => {
      const d = new Date(r.scheduled_start);
      if (!Number.isNaN(d.getTime())) ys.add(String(d.getFullYear()));
    });
    return Array.from(ys).sort((a, b) => Number(b) - Number(a));
  }, [consultationNotes]);

  const specialties = useMemo(() => {
    const specs = new Set();
    consultationNotes.forEach((r) => {
      if (r.specialty_name) specs.add(r.specialty_name);
    });
    return Array.from(specs).sort((a, b) => a.localeCompare(b));
  }, [consultationNotes]);

  const filteredHistory = useMemo(() => {
    const s = search.trim().toLowerCase();

    return consultationNotes.filter((r) => {
      const d = new Date(r.scheduled_start);
      const rYear = !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : '';

      const doctor = `${r.doctor_first_name || ''} ${r.doctor_last_name || ''}`
        .trim()
        .toLowerCase();
      const specialtyName = (r.specialty_name || '').toLowerCase();
      const diagnosis = (r.diagnosis || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();

      const matchesSearch =
        !s || doctor.includes(s) || specialtyName.includes(s) || diagnosis.includes(s) || notes.includes(s);
      const matchesYear = !year || rYear === year;
      const matchesSpecialty = !specialty || r.specialty_name === specialty;

      return matchesSearch && matchesYear && matchesSpecialty;
    });
  }, [consultationNotes, search, year, specialty]);

  return {
    loading,
    medicalRecord,
    consultationNotes,
    filteredHistory,
    search,
    setSearch,
    year,
    setYear,
    specialty,
    setSpecialty,
    years,
    specialties,
    error,
    loadMedicalHistory,
  };
}

/**
 * Parse notes content from JSON to readable text
 */
export function parseNotesContent(rawContent) {
  if (!rawContent) return null;

  if (typeof rawContent === 'string' && !rawContent.trim().startsWith('{')) {
    return rawContent;
  }

  try {
    const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

    if (parsed.subjective || parsed.objective || parsed.assessment || parsed.plan) {
      const parts = [];
      if (parsed.subjective) parts.push(`Subjetivo: ${parsed.subjective}`);
      if (parsed.objective) parts.push(`Objetivo: ${parsed.objective}`);
      if (parsed.assessment) parts.push(`Evaluación: ${parsed.assessment}`);
      if (parsed.plan) parts.push(`Plan: ${parsed.plan}`);
      return parts.join('\n');
    }

    if (typeof parsed === 'object') {
      return Object.entries(parsed)
        .filter(([_, value]) => value && value !== '')
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${value}`)
        .join('\n');
    }

    return rawContent;
  } catch {
    return rawContent;
  }
}

/**
 * Format date string to locale
 */
export function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Fecha no válida';
  return d.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time string to locale
 */
export function formatDateTime(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Fecha no válida';
  return d.toLocaleString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
