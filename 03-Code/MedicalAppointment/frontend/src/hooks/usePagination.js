/**
 * usePagination Hook
 * Hook for handling pagination state
 * 
 * @module hooks/usePagination
 */

import { useState, useCallback, useMemo } from 'react';
import { PAGINATION } from '../config/constants';

/**
 * Custom hook for pagination
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination utilities
 */
const usePagination = (options = {}) => {
  const {
    initialPage = PAGINATION.DEFAULT_PAGE,
    initialLimit = PAGINATION.DEFAULT_LIMIT,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(total / limit) || 1;
  }, [total, limit]);

  /**
   * Check if there's a next page
   */
  const hasNextPage = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  /**
   * Check if there's a previous page
   */
  const hasPrevPage = useMemo(() => {
    return page > 1;
  }, [page]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  /**
   * Change limit and reset to page 1
   */
  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  /**
   * Get pagination params for API calls
   */
  const getParams = useCallback(() => {
    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }, [page, limit]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    reset,
    getParams,
  };
};

export default usePagination;
