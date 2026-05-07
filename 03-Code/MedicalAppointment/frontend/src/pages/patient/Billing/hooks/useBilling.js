import { useState, useEffect } from 'react';
import { BillingModel } from '../../../../models';

/**
 * Hook for managing patient billing state and logic
 */
export function useBilling() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadBillings();
  }, []);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const response = await BillingModel.getMyBillings();
      setBillings(response.data || response || []);
    } catch (error) {
      console.error('Error loading billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBillings = billings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const pendingTotal = billings
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const paidTotal = billings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const openDetail = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedBilling(null);
  };

  return {
    billings,
    loading,
    filter,
    setFilter,
    filteredBillings,
    pendingTotal,
    paidTotal,
    selectedBilling,
    showDetailModal,
    openDetail,
    closeDetail,
    loadBillings,
  };
}

/**
 * Format currency to USD
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

/**
 * Format date string to locale
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get status configuration for billing
 */
export function getStatusInfo(status) {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Pendiente',
      iconColor: 'text-yellow-600',
    },
    paid: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Pagado',
      iconColor: 'text-green-600',
    },
  };
  return statusConfig[status] || statusConfig.pending;
}

/**
 * Payment method labels in Spanish
 */
export const paymentMethodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta de Crédito/Débito',
  transfer: 'Transferencia Bancaria',
  insurance: 'Seguro Médico',
};
