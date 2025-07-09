import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../core/config";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 🔧 FIX: Safari localStorage debug
      console.log("🔍 Checking auth status...");

      let token;
      try {
        token = localStorage.getItem("authToken");
        console.log(
          "📱 Browser:",
          navigator.userAgent.includes("Safari") &&
            !navigator.userAgent.includes("Chrome")
            ? "Safari"
            : "Other"
        );
        console.log("🔑 Token exists:", !!token);
      } catch (error) {
        console.error("❌ Safari: localStorage access failed:", error);
        setLoading(false);
        return;
      }

      if (!token) {
        console.log("❌ No token found");
        setLoading(false);
        return;
      }

      // Kiểm tra token hết hạn
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        console.log("⏰ Token expires at:", new Date(decoded.exp * 1000));
        console.log("⏰ Current time:", new Date());

        if (decoded.exp && decoded.exp < currentTime) {
          // Token đã hết hạn
          console.log("⚠️ Token expired");
          await logout();
          return;
        }

        // Token còn hạn, lấy thông tin user
        console.log("✅ Token valid, fetching user profile...");
        await fetchUserProfile(token);
      } catch (error) {
        console.error("❌ Lỗi decode token:", error);
        await logout();
      }
    } catch (error) {
      console.error("❌ Lỗi kiểm tra trạng thái auth:", error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      console.log("📡 Fetching user profile from API...");
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 API Response:", response.data);

      if (response.data.success) {
        const userData = response.data.user;
        console.log("👤 User data received:", userData?.fullname || "No name");
        setUser(userData);

        // 🔧 FIX: Safari localStorage fallback
        try {
          localStorage.setItem("role", userData.role);
        } catch (error) {
          console.warn("⚠️ Safari: Cannot save role to localStorage:", error);
        }
      } else {
        console.error("❌ API returned unsuccessful response");
        await logout();
      }
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin người dùng:", error);
      await logout();
      toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại");
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;

        // Lưu token và role
        localStorage.setItem("authToken", token);
        localStorage.setItem("role", userData.role);

        // Cập nhật state user
        setUser(userData);

        toast.success("Đăng nhập thành công!");
        return { success: true };
      } else {
        toast.error(response.data.message || "Đăng nhập thất bại");
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("role");
    setUser(null);
    toast.success("Đăng xuất thành công!");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};
