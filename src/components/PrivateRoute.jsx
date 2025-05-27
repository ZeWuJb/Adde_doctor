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
  const [routeDecisionMade, setRouteDecisionMade] = useState(false)

  // Handle route access based on user role
  useEffect(() => {
    console.log(
      "PrivateRoute - Loading:",
      loading,
      "Session:",
      !!session,
      "Path:",
      location.pathname,
      "Role:",
      session?.role,
    )

    // Reset route decision when path changes
    if (!routeDecisionMade) {
      setLocalLoading(true)
    }

    // Only make routing decisions when auth context has finished loading
    if (!loading) {
      const currentPath = location.pathname

      // If no session exists, redirect to signin
      if (!session) {
        console.log("No session found, redirecting to signin")
        setRedirectPath("/signin")
        setRouteDecisionMade(true)
        setLocalLoading(false)
        return
      }

      // If session exists but no role, there's a problem
      if (!session.role) {
        console.error("Session exists but no role found, redirecting to signin")
        setRedirectPath("/signin")
        setRouteDecisionMade(true)
        setLocalLoading(false)
        return
      }

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
        setRouteDecisionMade(true)
        setLocalLoading(false)
        return
      }

      // Role-based routing logic
      if (session.role === "admin") {
        if (isDoctorRoute) {
          console.log("Admin attempting doctor route, redirecting to /admin-dashboard")
          setRedirectPath("/admin-dashboard")
        } else if (!isAdminRoute) {
          // Admin accessing unknown route, redirect to admin dashboard
          console.log("Admin accessing unknown route, redirecting to /admin-dashboard")
          setRedirectPath("/admin-dashboard")
        } else {
          // Admin accessing valid admin route - allow access
          console.log("Admin accessing valid admin route:", currentPath)
          setRedirectPath(null)
        }
      } else if (session.role === "doctor") {
        if (isAdminRoute) {
          console.log("Doctor attempting admin route, redirecting to /dashboard")
          setRedirectPath("/dashboard")
        } else if (!isDoctorRoute) {
          // Doctor accessing unknown route, redirect to doctor dashboard
          console.log("Doctor accessing unknown route, redirecting to /dashboard")
          setRedirectPath("/dashboard")
        } else {
          // Doctor accessing valid doctor route - allow access
          console.log("Doctor accessing valid doctor route:", currentPath)
          setRedirectPath(null)
        }
      }

      setRouteDecisionMade(true)
      setLocalLoading(false)
    }
  }, [location.pathname, session, loading, routeDecisionMade])

  // Reset route decision when location changes
  useEffect(() => {
    setRouteDecisionMade(false)
    setRedirectPath(null)
  }, [location.pathname])

  // Set a maximum timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localLoading && !routeDecisionMade) {
        console.log("Loading timeout reached, forcing state update")
        setLocalLoading(false)
        setRouteDecisionMade(true)
        // If we timeout and still have no session, redirect to signin
        if (!session) {
          setRedirectPath("/signin")
        }
      }
    }, 2000) // 2 second maximum loading time

    return () => clearTimeout(timeoutId)
  }, [localLoading, routeDecisionMade, session])

  // Show loading state while checking session and making route decisions
  if (loading || localLoading || !routeDecisionMade) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    )
  }

  // If no session after all checks, redirect to signin
  if (!session) {
    console.log("No session, redirecting to /signin")
    // Save the current location to redirect back after login
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  // If there's a redirect path, execute the redirect
  if (redirectPath) {
    console.log("Redirecting to:", redirectPath)
    return <Navigate to={redirectPath} replace />
  }

  console.log("Rendering protected route:", location.pathname)
  return <Outlet />
}

export default PrivateRoute
