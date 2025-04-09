"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Search, Filter, Calendar, AlertCircle, ChevronDown } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"

const AppointmentsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // In a real app, this would be an API call to your backend
        const mockAppointments = [
          {
            id: 1,
            patientName: "Olivia Martin",
            doctorName: "Dr. Sarah Johnson",
            doctorSpecialty: "Cardiology",
            date: "2023-06-15T10:30:00",
            status: "completed",
            patientAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
          },
          {
            id: 2,
            patientName: "James Wilson",
            doctorName: "Dr. Michael Chen",
            doctorSpecialty: "Neurology",
            date: "2023-06-16T14:00:00",
            status: "upcoming",
            patientAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/men/75.jpg",
          },
          {
            id: 3,
            patientName: "Sophia Anderson",
            doctorName: "Dr. Emily Rodriguez",
            doctorSpecialty: "Pediatrics",
            date: "2023-06-14T09:15:00",
            status: "cancelled",
            patientAvatar: "https://randomuser.me/api/portraits/women/33.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
          },
          {
            id: 4,
            patientName: "Ethan Brown",
            doctorName: "Dr. James Wilson",
            doctorSpecialty: "Orthopedics",
            date: "2023-06-17T11:00:00",
            status: "upcoming",
            patientAvatar: "https://randomuser.me/api/portraits/men/42.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
          },
          {
            id: 5,
            patientName: "Ava Johnson",
            doctorName: "Dr. Sarah Johnson",
            doctorSpecialty: "Cardiology",
            date: "2023-06-15T15:30:00",
            status: "completed",
            patientAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
          },
          {
            id: 6,
            patientName: "Noah Davis",
            doctorName: "Dr. Michael Chen",
            doctorSpecialty: "Neurology",
            date: "2023-06-18T10:00:00",
            status: "pending",
            patientAvatar: "https://randomuser.me/api/portraits/men/75.jpg",
            doctorAvatar: "https://randomuser.me/api/portraits/men/75.jpg",
          },
        ]

        setAppointments(mockAppointments)
        setFilteredAppointments(mockAppointments)
      } catch (err) {
        console.error("Error fetching appointments:", err.message)
        setError("Failed to fetch appointments data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  useEffect(() => {
    if (!appointments.length) {
      setFilteredAppointments([])
      return
    }

    const filtered = appointments.filter((appt) => {
      const matchesSearch = searchTerm
        ? appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      const matchesStatus = statusFilter === "all" ? true : appt.status === statusFilter
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const appointmentDate = new Date(appt.date)

      let matchesDate = true
      switch (dateFilter) {
        case "today": {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          matchesDate = appointmentDate >= today && appointmentDate < tomorrow
          break
        }
        case "upcoming": {
          matchesDate = appointmentDate >= today
          break
        }
        case "thisWeek": {
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)
          matchesDate = appointmentDate >= today && appointmentDate < nextWeek
          break
        }
        case "past": {
          matchesDate = appointmentDate < today
          break
        }
        default: {
          matchesDate = true
          break
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading appointments...</p>
      </div>
    )
  }

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

        {/* Appointments Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Appointments Management</h1>
            <p className="text-gray-600">Monitor and manage all appointments in the system</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Filter className="mr-2" />
              Filters
              <ChevronDown className={`ml-2 transform ${showFilters ? "rotate-180" : ""} transition-transform`} />
            </button>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="thisWeek">This Week</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={appointment.patientAvatar || "/placeholder.svg?height=40&width=40"}
                              alt={appointment.patientName}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(appointment.date)} at {formatTime(appointment.date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <div className="flex-shrink-0 h-8 w-8 mr-2">
                              <img
                                className="h-8 w-8 rounded-full"
                                src={appointment.doctorAvatar || "/placeholder.svg?height=32&width=32"}
                                alt={appointment.doctorName}
                              />
                            </div>
                            <div>
                              <p>{appointment.doctorName}</p>
                              <p className="text-xs">{appointment.doctorSpecialty}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {formatDate(appointment.date)} at {formatTime(appointment.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-gray-500">No appointments found matching your criteria.</li>
              )}
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppointmentsPage
