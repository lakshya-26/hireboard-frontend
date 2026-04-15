import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireboard_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  const status = error?.response?.status;
  if (status === 403) {
    return 'Invalid credentials';
  }
  if (status === 404) {
    return 'Account not found';
  }
  return 'Something went wrong. Please try again.';
}
