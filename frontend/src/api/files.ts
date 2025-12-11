import { apiClient } from "./client";

export interface UploadPhotosResponse {
  urls: string[];
}

/**
 * Upload photo files to the server
 * @param files Array of File objects to upload
 * @returns Array of URLs where the uploaded files can be accessed
 */
export async function uploadPhotos(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("photos", file);
  });

  // Note: Don't set Content-Type header manually - axios will set it automatically
  // with the correct boundary for multipart/form-data
  const response = await apiClient.post<UploadPhotosResponse>(
    "/files/photos",
    formData
  );

  return response.data.urls;
}
