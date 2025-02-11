import axiosInstance from './axiosConfig';
import { config } from '../config';

// Create axios instance with base URL from config
// export const axiosInstance = axios.create({
//   baseURL: config.apiBaseUrl,
//   withCredentials: true,
// });

// Add request interceptor to handle authorization
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('auth_token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Add response interceptor to handle auth errors
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       // Clear token and redirect to login
//       localStorage.removeItem('auth_token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name?: string;
  username?: string;
}

class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'user';

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    this.setToken(response.data.token);
    this.setUser(response.data.user);
    return response.data;
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await axiosInstance.post('/api/auth/register', data);
    this.setToken(response.data.token);
    this.setUser(response.data.user);
    return response.data;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await axiosInstance.get('/api/auth/me');
      this.setUser(response.data);
      return response.data;
    } catch (error) {
      // Don't call logout here as it will trigger a re-render loop
      return null;
    }
  }

  logout(): void {
    axiosInstance.post('/api/auth/logout').finally(() => {
      localStorage.removeItem(AuthService.TOKEN_KEY);
      localStorage.removeItem(AuthService.USER_KEY);
    });
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(AuthService.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  init() {
    // Initialize auth state from localStorage
    const token = this.getToken();
    if (token) {
      this.getCurrentUser();
    }
  }
}

export const authService = new AuthService();

// authService.init(); // Remove this line to avoid circular dependency issues
