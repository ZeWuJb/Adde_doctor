// PrivateRoute.jsx
"use client"

import { Outlet, Navigate, useLocation } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"

const PrivateRoute = () => {
  const { session, loading, refreshSession } = UserAuth()
  const location = useLocation()
  const [redirectPath, setRedirectPath] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastAttempt, setLastAttempt] = useState(0)
  const [localLoading, setLocalLoading] = useState(true)

  // Attempt to refresh session if needed
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      // Prevent multiple refresh attempts in quick succession
      const now = Date.now()
      if (now - lastAttempt < 5000) return // Don't try more than once every 5 seconds

      setLastAttempt(now)

      if (!session && !loading && !isRefreshing) {
        console.log("No session, attempting to refresh...")
        setIsRefreshing(true)

        try {
          const result = await refreshSession()
          console.log("Session refresh result:", result.success)
        } catch (err) {
          console.error("Error refreshing session:", err)
        } finally {
          setIsRefreshing(false)
          setLocalLoading(false)
        }
      } else if (!loading) {
        // If not loading and we have a session or definitely don't have one
        setLocalLoading(false)
      }
    }

    attemptSessionRefresh()
  }, [session, loading, refreshSession, isRefreshing, lastAttempt])

  // Handle route access based on user role
  useEffect(() => {
    console.log("PrivateRoute - Loading:", loading, "Session:", !!session, "Path:", location.pathname)

    if (!loading && !isRefreshing && session) {
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
    }
  }, [location.pathname, session, loading, isRefreshing])

  // Set a maximum timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localLoading) {
        console.log("Loading timeout reached, forcing state update")
        setLocalLoading(false)
      }
    }, 5000) // 5 second maximum loading time

    return () => clearTimeout(timeoutId)
  }, [localLoading])

  // Show loading state while checking session or refreshing
  if (loading || isRefreshing || localLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    )
  }

  // If no session after refresh attempt, redirect to signin
  if (!session) {
    console.log("No session after refresh, redirecting to /signin")
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
