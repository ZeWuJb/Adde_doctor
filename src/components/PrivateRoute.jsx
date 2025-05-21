// PrivateRoute.jsx
"use client"

import { Outlet, Navigate, useLocation } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"

const PrivateRoute = () => {
  const { session, loading } = UserAuth()
  const location = useLocation()
  const [redirectPath, setRedirectPath] = useState(null)
  const [localLoading, setLocalLoading] = useState(true)

  // Handle route access based on user role
  useEffect(() => {
    console.log("PrivateRoute - Loading:", loading, "Session:", !!session, "Path:", location.pathname)

    if (!loading && session) {
      const currentPath = location.pathname

      const adminRoutes = ["/admin-dashboard", "/admin", /^\/admin(\/.*)?$/]

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
        /^\/dashboard(\/.*)?$/,
        /^\/patients(\/.*)?$/,
      ]

      const isAdminRoute = adminRoutes.some((route) =>
        typeof route === "string" ? currentPath === route : route.test(currentPath),
      )

      const isDoctorRoute = doctorRoutes.some((route) =>
        typeof route === "string" ? currentPath === route : route.test(currentPath),
      )

      const validRoles = ["admin", "doctor"]
      if (!validRoles.includes(session.role)) {
        console.error("Invalid role:", session.role)
        setRedirectPath("/signin")
        return
      }

      if (session.role === "admin" && isDoctorRoute) {
        console.log("Admin attempting doctor route, redirecting to /admin-dashboard")
        setRedirectPath("/admin-dashboard")
      } else if (session.role === "doctor" && isAdminRoute) {
        console.log("Doctor attempting admin route, redirecting to /dashboard")
        setRedirectPath("/dashboard")
      } else {
        setRedirectPath(null)
      }

      setLocalLoading(false)
    } else if (!loading) {
      // If not loading and we don't have a session
      setLocalLoading(false)
    }
  }, [location.pathname, session, loading])

  // Set a maximum timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localLoading) {
        console.log("Loading timeout reached, forcing state update")
        setLocalLoading(false)
      }
    }, 2000) // 2 second maximum loading time

    return () => clearTimeout(timeoutId)
  }, [localLoading])

  // Show loading state while checking session
  if (loading || localLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    )
  }

  // If no session, redirect to signin
  if (!session) {
    console.log("No session, redirecting to /signin")
    // Save the current location to redirect back after login
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  if (redirectPath) {
    console.log("Redirecting to:", redirectPath)
    return <Navigate to={redirectPath} replace />
  }

  console.log("Rendering protected route:", location.pathname)
  return <Outlet />
}

export default PrivateRoute
