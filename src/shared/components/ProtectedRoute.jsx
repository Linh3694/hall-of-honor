import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loading state nếu đang kiểm tra auth
  if (loading) {
    return <div>Đang tải...</div>;
  }

  // Nếu chưa đăng nhập, chuyển hướng về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có yêu cầu về role và user không có role phù hợp
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  // Nếu đã đăng nhập và có đủ quyền, hiển thị component
  return children;
};

export default ProtectedRoute; 