import { BuyRequestStatus } from "../types";

/**
 * Short status labels for display in badges and lists
 */
export const STATUS_LABELS: Record<BuyRequestStatus, string> = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
  paid: "입금 완료",
  cancelled: "취소됨",
};

/**
 * Longer descriptions explaining what each status means
 */
export const STATUS_DESCRIPTIONS: Record<BuyRequestStatus, string> = {
  pending: "관리자 검토 대기 중입니다.",
  approved: "승인되었습니다. 입금 정보를 입력해주세요.",
  rejected: "신청이 거절되었습니다.",
  paid: "입금이 완료되었습니다. 거래가 완료되었습니다.",
  cancelled: "신청이 취소되었습니다.",
};
