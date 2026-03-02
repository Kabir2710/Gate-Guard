import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export const mockAuthService = {
  signup: async (role, name, email, password, houseId) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, name, email, password, houseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const isSecureEnv = window.location.protocol === "https:";

      // Ensure consistent formatting (similar to old mocked logic)
      Cookies.set("auth_token", data.token, {
        expires: 7, // 7 days
        secure: isSecureEnv,
        sameSite: "strict",
        path: "/",
      });

      return {
        token: data.token,
        user: data.user,
      };
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    const isSecureEnv = window.location.protocol === "https:";
    Cookies.remove("auth_token", {
      secure: isSecureEnv,
      sameSite: "strict",
      path: "/",
    });
  },

  verifySession: () => {
    const token = Cookies.get("auth_token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);

      // Check basic expiration
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        mockAuthService.logout();
        return null;
      }
      return decoded;
    } catch (err) {
      console.error("Invalid token:", err);
      mockAuthService.logout();
      return null;
    }
  },
};
