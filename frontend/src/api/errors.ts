import axios from "axios";

/**
 * Extracts a user-friendly error message from an error object.
 * Handles Axios errors and other error types.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message[0];
      }
      return String(data.message);
    }
    return "요청 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
  return "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
}
