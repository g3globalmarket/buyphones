import { apiClient } from "./client";
import { AuthResponse } from "../types";

export const authApi = {
  requestCode: async (email: string): Promise<void> => {
    await apiClient.post("/auth/request-code", { email });
  },

  verifyCode: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/verify-code", {
      email,
      code,
    });
    return response.data;
  },
};
