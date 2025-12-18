export type DeviceCategory = "iphone" | "ps5" | "switch";

export interface ModelPrice {
  _id: string;
  category: DeviceCategory;
  modelCode: string;
  modelName: string;
  storageGb?: number;
  color?: string;
  buyPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BuyRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "cancelled";

export interface BuyRequestStatusHistoryEntry {
  status: BuyRequestStatus;
  changedAt: string;
  changedBy?: string; // 'user' | 'admin' | admin email
}

export interface ShippingInfo {
  recipientName: string;
  phone: string;
  postalCode?: string;
  address1: string;
  address2?: string;
  note?: string;
}

export interface BuyRequest {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  modelPriceId: string;
  deviceCategory: string;
  modelCode: string;
  modelName: string;
  storageGb?: number;
  color?: string;
  buyPrice: number;
  currency: string;
  status: BuyRequestStatus;
  notes?: string;
  adminNotes?: string;
  imeiSerial?: string;
  hasReceipt?: boolean;
  photoUrls?: string[];
  finalPrice?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  shippingMethod?: string;
  shippingTrackingCode?: string;
  shippingTrackingUrl?: string;
  shippingSubmittedAt?: string;
  shippingInfo?: ShippingInfo;
  approvedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  approvedBy?: string;
  cancelledBy?: string;
  statusHistory?: BuyRequestStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuyRequestDto {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  modelPriceId: string;
  notes?: string;
  imeiSerial?: string;
  hasReceipt?: boolean;
  photoUrls?: string[];
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface UpdateMyRequestDto {
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  shippingMethod?: string;
  shippingTrackingCode?: string;
  shippingTrackingUrl?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
