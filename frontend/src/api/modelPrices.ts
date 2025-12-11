import { apiClient } from "./client";
import { adminApiClient } from "./adminClient";
import { ModelPrice } from "../types";

export const modelPricesApi = {
  // Public: get active prices
  getAll: async (activeOnly: boolean = false): Promise<ModelPrice[]> => {
    const response = await apiClient.get<ModelPrice[]>("/model-prices", {
      params: { activeOnly },
    });
    return response.data;
  },

  // Public: get single price
  getById: async (id: string): Promise<ModelPrice> => {
    const response = await apiClient.get<ModelPrice>(`/model-prices/${id}`);
    return response.data;
  },

  // Admin: create price
  create: async (data: Partial<ModelPrice>): Promise<ModelPrice> => {
    const response = await adminApiClient.post<ModelPrice>(
      "/model-prices",
      data
    );
    return response.data;
  },

  // Admin: update price
  update: async (
    id: string,
    data: Partial<ModelPrice>
  ): Promise<ModelPrice> => {
    const response = await adminApiClient.patch<ModelPrice>(
      `/model-prices/${id}`,
      data
    );
    return response.data;
  },

  // Admin: delete price
  delete: async (id: string): Promise<void> => {
    await adminApiClient.delete(`/model-prices/${id}`);
  },
};
