const API_BASE = '/api/v1/auth';

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const sendOtp = ({ phone, role }) =>
  request('/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, role }),
  });

export const verifyOtp = ({ phone, otp, role, name }) =>
  request('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, role, name }),
  });

export const adminLogin = ({ email, password }) =>
  request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const firebaseLogin = ({ idToken, name, role }) =>
  request('/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken, name, role }),
  });

export const logout = () =>
  request('/logout', {
    method: 'POST',
  });

export const getMe = () => request('/me');
