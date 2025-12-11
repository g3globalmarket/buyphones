import { adminApiClient } from "./adminClient";

export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  id: string;
  email: string; // this is our login ID (아이디)
  role: AdminRole;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
  role: AdminRole;
  name?: string;
}

export interface UpdateAdminUserDto {
  role?: AdminRole;
  name?: string;
}

export interface ChangeAdminPasswordDto {
  newPassword: string;
}

export const adminUsersApi = {
  async list(): Promise<AdminUser[]> {
    const res = await adminApiClient.get<AdminUser[]>("/admin/users");
    return res.data;
  },

  async create(payload: CreateAdminUserDto): Promise<AdminUser> {
    const res = await adminApiClient.post<AdminUser>("/admin/users", payload);
    return res.data;
  },

  async update(id: string, payload: UpdateAdminUserDto): Promise<AdminUser> {
    const res = await adminApiClient.patch<AdminUser>(
      `/admin/users/${id}`,
      payload
    );
    return res.data;
  },

  async changePassword(
    id: string,
    payload: ChangeAdminPasswordDto
  ): Promise<void> {
    await adminApiClient.patch(`/admin/users/${id}/password`, payload);
  },

  async remove(id: string): Promise<void> {
    await adminApiClient.delete(`/admin/users/${id}`);
  },
};
