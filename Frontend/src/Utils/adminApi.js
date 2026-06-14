const API_BASE = 'http://localhost:3000';

export const adminFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 403 || response.status === 401) {
    const error = new Error(data.message || 'Admin access required');
    error.status = response.status;
    throw error;
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Admin request failed');
  }

  return data.data ?? data;
};

export const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};
