import axios, { AxiosError, AxiosInstance } from 'axios';
import { authService } from './auth';
import { config } from '../config';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
}) as AxiosInstance & { isAxiosError: typeof axios.isAxiosError };

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
