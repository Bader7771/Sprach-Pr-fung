import axios from 'axios';

const PRODUCTION_API_ORIGIN = 'https://sprach-pr-fung-server.vercel.app';
const LOCAL_API_ORIGIN = 'http://localhost:5001';

function normalizeApiOrigin(value) {
  const fallback = process.env.NODE_ENV === 'production' ? PRODUCTION_API_ORIGIN : LOCAL_API_ORIGIN;
  const raw = String(value || '').trim();

  if (!raw || raw === 'undefined' || raw === 'null') {
    return fallback;
  }

  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
}

export const apiOrigin = normalizeApiOrigin(process.env.REACT_APP_API_URL);
export const apiBaseURL = `${apiOrigin}/api`;

export function getErrorMessage(error) {
  if (!error.response) {
    return 'Backend unavailable. Please check the server deployment and network connection.';
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message;

  if (status === 401) return serverMessage || 'Unauthorized. Please sign in again.';
  if (status === 400) return serverMessage || 'Please check the form values and try again.';
  if (status >= 500) return 'Server error. Please try again later.';
  return serverMessage || 'Request failed. Please try again.';
}

const http = axios.create({
  baseURL: apiBaseURL
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('sms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = getErrorMessage(error);

    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_admin');
      window.dispatchEvent(new Event('sms:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default http;
