import { Outlet, Navigate } from "react-router-dom"
import { UserAuth } from "../context/AuthContext"

const PrivateRoute = () => {
  const { session, loading } = UserAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!session) {
    return <Navigate to="/signin" replace />
  }

  // Redirect non-admins away from admin dashboard
  if (session.role !== "admin" && window.location.pathname === "/admin-dashboard") {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PrivateRoute

