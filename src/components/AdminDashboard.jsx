"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { Users, Calendar, Settings, Bell, LogOut, Menu, X, User, PieChart, Activity, Clipboard } from "lucide-react"

const AdminDashboard = () => {
  // Update to use userData directly from context
  const { session, userData, loading, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState(null)

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
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-6 bg-gradient-to-r from-pink-500 to-purple-600">
            <h1 className="text-xl font-bold text-white">CareSync Admin</h1>
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex flex-col items-center py-6 border-b">
              <div className="relative w-20 h-20 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                {session?.user?.user_metadata?.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-gray-500" />
                )}
              </div>
              {/* Update the user info display to use userData */}
              <h2 className="text-lg font-medium">
                {userData?.full_name || session?.userData?.full_name || "Administrator"}
              </h2>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>

            <nav className="px-4 py-6">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-white bg-pink-600 rounded-md">
                    <PieChart className="w-5 h-5 mr-3" />
                    <span>Dashboard</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  >
                    <Users className="w-5 h-5 mr-3 text-gray-300" />
                    <span>Doctors</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  >
                    <Calendar className="w-5 h-5 mr-3 text-gray-300" />
                    <span>Appointments</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  >
                    <Activity className="w-5 h-5 mr-3 text-gray-300" />
                    <span>Analytics</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  >
                    <Settings className="w-5 h-5 mr-3 text-gray-300" />
                    <span>Settings</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-gray-600 md:hidden focus:outline-none"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center ml-auto">
              <button className="relative p-1 mr-4 text-gray-600 hover:text-gray-900 focus:outline-none">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative">
                <button className="flex items-center focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {session?.user?.user_metadata?.avatar_url ? (
                      <img
                        src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-gray-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {session?.userData?.full_name || "Administrator"}!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Total Doctors</h2>
                  <p className="text-2xl font-semibold text-gray-800">{doctors.length}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Total Patients</h2>
                  <p className="text-2xl font-semibold text-gray-800">174</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Appointments Today</h2>
                  <p className="text-2xl font-semibold text-gray-800">42</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clipboard className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-600">Reports</h2>
                  <p className="text-2xl font-semibold text-gray-800">12</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctors List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Doctors</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Add New Doctor
              </button>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow">
              {dashboardLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={doctor.avatar || "/placeholder.svg"}
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.specialty}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.patients}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.appointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-gray-600 hover:text-gray-900">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">Dr. Sarah Johnson added a new patient</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">Dr. Michael Chen completed 3 appointments</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900">System maintenance completed</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard

