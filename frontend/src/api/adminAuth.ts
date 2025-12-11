import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: {
    id: string;
    email: string;
    role: "super_admin" | "admin";
    name?: string;
  };
}

/**
 * Admin authentication API client
 * New JWT-based admin login (separate from legacy ADMIN_TOKEN)
 */
export const adminAuthApi = {
  /**
   * Login with email and password
   * Returns JWT token for admin authentication
   */
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await axios.post<AdminLoginResponse>(
      `${API_BASE_URL}/admin/auth/login`,
      credentials
    );
    return response.data;
  },
};
