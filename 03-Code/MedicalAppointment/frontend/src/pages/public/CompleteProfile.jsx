import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crudApi } from '../../services/httpClient';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    cedula: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If OAuth callback included a payload in 'oauth' param (base64), process it
    const params = new URLSearchParams(location.search);
    const oauthParam = params.get('oauth');
    if (oauthParam) {
      try {
        const binaryString = atob(oauthParam);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.codePointAt(i);
        const decoder = new TextDecoder('utf-8');
        const jsonPayload = decoder.decode(bytes);
        const payload = JSON.parse(jsonPayload);
        if (payload.token) localStorage.setItem('token', payload.token);
        if (payload.user) {
          localStorage.setItem('user', JSON.stringify(payload.user));
          if (updateUser) updateUser(payload.user);
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error processing OAuth payload', err);
      }
    }

    if (user) {
      setForm((f) => ({
        ...f,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || user.phone || '',
        cedula: user.cedula || '',
      }));
    }

    // Fetch profile from API to prefill more fields
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Not authenticated - redirect to login
        navigate('/login');
        return;
      }
      try {
        const resp = await crudApi.get('/patients/me');
        const data = resp.data;
        setForm((s) => ({ 
          ...s, 
          cedula: data.cedula || s.cedula || '', 
          first_name: data.first_name || s.first_name || '',
          last_name: data.last_name || s.last_name || '',
          phone_number: data.phone_number || s.phone_number || '', 
          address: data.address || '', 
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || ''
        }));
      } catch (err) {
        console.error('Error fetching profile', err);
      }
    };

    fetchProfile();
  }, [user, location.search, navigate, updateUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.first_name || !form.last_name || !form.cedula) {
      setError('Cédula, nombre y apellido son obligatorios');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(form.cedula)) {
      setError('La cédula debe tener 10 dígitos numéricos');
      setLoading(false);
      return;
    }

    try {
      const resp = await crudApi.put('/patients/me', form);
      const data = resp.data;
      if (updateUser) updateUser(data.user || data);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full p-6 bg-white shadow rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Completa tu perfil</h2>
          <button onClick={() => navigate('/login')} className="text-sm text-gray-700 underline">Volver a inicio de sesión</button>
        </div>

        {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="cedula" value={form.cedula} onChange={handleChange} placeholder="Cédula" maxLength={10} className="border p-2 rounded w-full" required />
            <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded w-full" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellido" className="border p-2 rounded w-full" required />
            <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" placeholder="Fecha de nacimiento" className="border p-2 rounded w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Teléfono" maxLength={10} className="border p-2 rounded w-full" />
            <select name="gender" value={form.gender} onChange={handleChange} className="border p-2 rounded w-full">
              <option value="">Género</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded w-full" />
          </div>

          <div className="flex items-center justify-end">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
