import { apiClient } from "./client";
import { adminApiClient } from "./adminClient";
import {
  BuyRequest,
  CreateBuyRequestDto,
  BuyRequestStatus,
  PaginatedResult,
} from "../types";

export const buyRequestsApi = {
  // Admin: get all requests (paginated)
  getAll: async (
    status?: BuyRequestStatus,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<PaginatedResult<BuyRequest>> => {
    const params: Record<string, string | number> = { page, limit };
    if (status) {
      params.status = status;
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await adminApiClient.get<PaginatedResult<BuyRequest>>(
      "/buy-requests",
      { params }
    );
    return response.data;
  },

  // Admin: get single request
  getById: async (id: string): Promise<BuyRequest> => {
    const response = await adminApiClient.get<BuyRequest>(
      `/buy-requests/${id}`
    );
    return response.data;
  },

  // Public: create buy request
  create: async (data: CreateBuyRequestDto): Promise<BuyRequest> => {
    const response = await apiClient.post<BuyRequest>("/buy-requests", data);
    return response.data;
  },

  // Admin: update request status
  update: async (
    id: string,
    data: {
      status?: BuyRequestStatus;
      adminNotes?: string;
      finalPrice?: number;
    }
  ): Promise<BuyRequest> => {
    const response = await adminApiClient.patch<BuyRequest>(
      `/buy-requests/${id}`,
      data
    );
    return response.data;
  },

  // Admin: delete request
  delete: async (id: string): Promise<void> => {
    await adminApiClient.delete(`/buy-requests/${id}`);
  },

  // Admin: mark request as paid
  markPaid: async (id: string): Promise<BuyRequest> => {
    const response = await adminApiClient.patch<BuyRequest>(
      `/buy-requests/${id}/mark-paid`
    );
    return response.data;
  },
};
