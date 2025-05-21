"use client"

import { Navigate, useLocation } from "react-router-dom"
import { UserAuth } from "./context/AuthContext"
import { useEffect, useState } from "react"

function App() {
  const { session, loading } = UserAuth()
  const location = useLocation()
  const [localLoading, setLocalLoading] = useState(true)

  useEffect(() => {
    // Log navigation for debugging
    console.log("App component rendered", {
      path: location.pathname,
      hasSession: !!session,
      isLoading: loading,
      role: session?.role,
    })

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (localLoading) {
        console.log("App loading timeout reached, forcing render")
        setLocalLoading(false)
      }
    }, 3000) // 3 second maximum loading time

    // If auth context has finished loading, update our local state
    if (!loading) {
      setLocalLoading(false)
    }

    return () => clearTimeout(timeoutId)
  }, [location.pathname, session, loading, localLoading])

  // If still loading, show a minimal loader
  if (loading || localLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // If we have a session, redirect to the appropriate dashboard
  if (session) {
    console.log("Redirecting based on role:", session.role)
    if (session.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />
    } else if (session.role === "doctor") {
      return <Navigate to="/dashboard" replace />
    } else {
      console.warn("Unknown role, defaulting to signin")
      return <Navigate to="/signin" replace />
    }
  }

  // Default redirect to signin
  return <Navigate to="/signin" replace />
}

export default App
