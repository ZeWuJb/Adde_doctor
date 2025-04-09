"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import AdminHeader from "./components/AdminHeader"
import AdminStats from "./components/AdminStats"
import DoctorsList from "./components/DoctorsList"
import RecentActivity from "./components/RecentActivity"

const AdminDashboard = () => {
  // Update to use userData directly from context
  const { session, userData, loading, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // In a real app, this would be an API call to your backend
        const mockDoctors = [
          {
            id: 1,
            name: "Dr. Sarah Johnson",
            specialty: "Cardiology",
            patients: 42,
            appointments: 12,
            avatar: "https://randomuser.me/api/portraits/women/44.jpg",
          },
          {
            id: 2,
            name: "Dr. Michael Chen",
            specialty: "Neurology",
            patients: 38,
            appointments: 8,
            avatar: "https://randomuser.me/api/portraits/men/32.jpg",
          },
          {
            id: 3,
            name: "Dr. Emily Rodriguez",
            specialty: "Pediatrics",
            patients: 65,
            appointments: 15,
            avatar: "https://randomuser.me/api/portraits/women/68.jpg",
          },
          {
            id: 4,
            name: "Dr. James Wilson",
            specialty: "Orthopedics",
            patients: 29,
            appointments: 7,
            avatar: "https://randomuser.me/api/portraits/men/75.jpg",
          },
        ]
        setDoctors(mockDoctors)
      } catch (err) {
        console.error("Error fetching doctors:", err.message)
        setError("Failed to fetch doctors data. Please try again later.")
      } finally {
        setDashboardLoading(false)
      }
    }

    if (session && session.role === "admin") {
      fetchDoctors()
    } else {
      setDashboardLoading(false)
    }
  }, [session])

  console.log("AdminDashboard - session:", session, "loading:", loading, "dashboardLoading:", dashboardLoading)

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading || dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to access this page.</p>
          <button
            onClick={() => (window.location.href = "/signin")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  console.log("AdminDashboard - session details:", {
    role: session.role,
    userData: session.userData,
    user: session.user,
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Navigation */}
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {session?.userData?.full_name || "Administrator"}!</p>
          </div>

          {/* Stats Cards */}
          <AdminStats />

          {/* Doctors List */}
          <DoctorsList doctors={doctors} />

          {/* Recent Activity */}
          <RecentActivity />
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
