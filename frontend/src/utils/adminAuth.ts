const ADMIN_TOKEN_KEY = "admin_token";

export const adminAuth = {
  getToken: (): string | null => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!adminAuth.getToken();
  },
};
