"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "./components/AdminSidebar"
import AdminHeader from "./components/AdminHeader"
import AdminStats from "./components/AdminStats"
import DoctorsList from "./components/DoctorsList"
import RecentActivity from "./components/RecentActivity"
import { supabase } from "../supabaseClient"

const AdminDashboard = () => {
  // Update to use userData directly from context
  const { session, userData, loading, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    doctorsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    articlesCount: 0,
  })
  const location = useLocation()

  // Update the useEffect to fetch real data from Supabase instead of using mock data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch doctors from Supabase
        const { data: doctorsData, error: doctorsError } = await supabase
          .from("doctors")
          .select("*")
          .limit(4)
          .order("created_at", { ascending: false })

        if (doctorsError) throw doctorsError

        // Transform the data to match the expected format
        const formattedDoctors = doctorsData.map((doctor) => ({
          id: doctor.id,
          name: doctor.full_name,
          specialty: doctor.speciality || "General",
          patients: doctor.patients_count || 0,
          appointments: doctor.appointments_count || 0,
          avatar: doctor.profile_url || "https://randomuser.me/api/portraits/men/32.jpg",
        }))

        setDoctors(formattedDoctors)

        // Fetch actual counts from database
        try {
          // Get doctors count
          const { count: doctorsCount } = await supabase.from("doctors").select("*", { count: "exact", head: true })

          // Get patients (mothers) count
          const { count: patientsCount } = await supabase.from("mothers").select("*", { count: "exact", head: true })

          // Get appointments count
          const { count: appointmentsCount } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })

          // Get articles count
          const { count: articlesCount } = await supabase
            .from("education_articles")
            .select("*", { count: "exact", head: true })

          setStats({
            doctorsCount: doctorsCount || 0,
            patientsCount: patientsCount || 0,
            appointmentsCount: appointmentsCount || 0,
            articlesCount: articlesCount || 0,
          })
        } catch (err) {
          console.error("Error fetching stats:", err.message)
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message)
        setError("Failed to fetch dashboard data. Please try again later.")
      } finally {
        setDashboardLoading(false)
      }
    }

    if (session && session.role === "admin") {
      fetchDashboardData()
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
          <AdminStats stats={stats} />

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
