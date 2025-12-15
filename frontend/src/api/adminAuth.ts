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
   * Backend returns 201 (Created) on successful login
   */
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await axios.post<AdminLoginResponse>(
      `${API_BASE_URL}/admin/auth/login`,
      credentials,
      {
        // Explicitly accept 201 (Created) as success
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("Invalid response: missing data");
    }

    if (!response.data.accessToken) {
      throw new Error("Invalid response: missing accessToken");
    }

    if (!response.data.admin) {
      throw new Error("Invalid response: missing admin");
    }

    console.log("[AdminAuth] Login successful:", {
      status: response.status,
      hasToken: !!response.data.accessToken,
      adminEmail: response.data.admin.email,
    });

    return response.data;
  },
};
