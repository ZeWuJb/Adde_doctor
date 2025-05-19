"use client";

import { Outlet, Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const PrivateRoute = () => {
  const { session, loading } = UserAuth();
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState(null);

  // Check access rights whenever location or session changes
  useEffect(() => {
    if (!loading && session) {
      const currentPath = location.pathname;

      // Define route patterns with more comprehensive matching
      const adminRoutes = [
        "/admin-dashboard",
        "/admin", // Explicitly include /admin
        /^\/admin(\/.*)?$/, // Match /admin and any sub-routes
      ];

      const doctorRoutes = [
        "/dashboard",
        "/profile",
        "/appointments",
        "/availability",
        "/statistics",
        "/patients",
        "/reports",
        "/settings",
        "/help",
        /^\/dashboard(\/.*)?$/, // Match /dashboard and sub-routes
        /^\/patients(\/.*)?$/, // Match /patients and sub-routes
      ];

      // Check if current path is an admin route
      const isAdminRoute = adminRoutes.some((route) =>
        typeof route === "string"
          ? currentPath === route
          : route.test(currentPath)
      );

      // Check if current path is a doctor route
      const isDoctorRoute = doctorRoutes.some((route) =>
        typeof route === "string"
          ? currentPath === route
          : route.test(currentPath)
      );

      // Validate session.role
      const validRoles = ["admin", "doctor"];
      if (!validRoles.includes(session.role)) {
        console.error("Invalid role:", session.role);
        setRedirectPath("/signin"); // Redirect to sign-in for invalid roles
        return;
      }

      // Handle role-based redirects
      if (session.role === "admin" && isDoctorRoute) {
        setRedirectPath("/admin-dashboard");
      } else if (session.role === "doctor" && isAdminRoute) {
        setRedirectPath("/dashboard");
      } else {
        setRedirectPath(null);
      }
    }
  }, [location.pathname, session, loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  // Perform role-based redirect if needed
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // If all checks pass, render the protected route
  return <Outlet />;
};

export default PrivateRoute;