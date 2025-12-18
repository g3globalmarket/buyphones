/**
 * Shipping configuration service
 * Reads shipping address and contact info from environment variables
 * This info is stored as a snapshot when a request is approved
 */
export interface ShippingInfo {
  recipientName: string;
  phone: string;
  postalCode?: string;
  address1: string;
  address2?: string;
  note?: string;
}

/**
 * Get current shipping info from environment variables
 * Returns null if required fields are missing
 */
export function getShippingInfo(): ShippingInfo | null {
  const recipientName = process.env.SHIP_TO_RECIPIENT_NAME;
  const phone = process.env.SHIP_TO_PHONE;
  const address1 = process.env.SHIP_TO_ADDRESS1;

  // Required fields
  if (!recipientName || !phone || !address1) {
    return null;
  }

  return {
    recipientName: recipientName.trim(),
    phone: phone.trim(),
    postalCode: process.env.SHIP_TO_POSTAL_CODE?.trim(),
    address1: address1.trim(),
    address2: process.env.SHIP_TO_ADDRESS2?.trim(),
    note: process.env.SHIP_TO_NOTE?.trim(),
  };
}

