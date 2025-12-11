import { apiClient } from "./client";
import { BuyRequest, UpdateMyRequestDto, PaginatedResult } from "../types";

export const meApi = {
  getMyRequests: async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<BuyRequest>> => {
    const response = await apiClient.get<PaginatedResult<BuyRequest>>(
      "/me/requests",
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  updateMyRequest: async (
    id: string,
    payload: UpdateMyRequestDto
  ): Promise<BuyRequest> => {
    const response = await apiClient.patch<BuyRequest>(
      `/me/requests/${id}`,
      payload
    );
    return response.data;
  },

  cancelMyRequest: async (id: string): Promise<BuyRequest> => {
    const response = await apiClient.patch<BuyRequest>(
      `/me/requests/${id}/cancel`,
      {}
    );
    return response.data;
  },

  deleteMyRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/requests/${id}`);
  },
};
