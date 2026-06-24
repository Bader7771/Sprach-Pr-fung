import axios from 'axios';

const apiBaseURL = process.env.REACT_APP_API_URL || '/api';

const http = axios.create({
  baseURL: apiBaseURL
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('sms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
