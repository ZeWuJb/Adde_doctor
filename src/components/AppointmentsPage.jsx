"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  fetchDoctorAppointments,
  getDoctorIdFromUserId,
  updateAppointmentStatus,
  updatePaymentStatus,
} from "../services/appointmentService"
import { Calendar, Search, Filter, ChevronDown, Video, Check, X, AlertCircle } from "lucide-react"
import { useSocketNotifications } from "../services/serverio"

const AppointmentsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const { pendingAppointments, connected } = useSocketNotifications()

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        } else {
          setError("Failed to retrieve doctor information")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    fetchDoctorId()
  }, [session])

  // Then, load appointments once we have the doctor ID
  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorAppointments(doctorId)

        if (result.success) {
          setAppointments(result.data)
          setFilteredAppointments(result.data)
        } else {
          setError("Failed to load appointments")
        }
      } catch (err) {
        console.error("Error loading appointments:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [doctorId])

  useEffect(() => {
    if (pendingAppointments.length > 0) {
      // Merge pending appointments from socket with existing appointments
      const updatedAppointments = [...appointments]

      pendingAppointments.forEach((pendingAppt) => {
        // Check if this appointment is already in our list
        const existingIndex = updatedAppointments.findIndex((appt) => appt.id === pendingAppt.appointmentId)

        if (existingIndex === -1) {
          // Add new appointment to the list
          updatedAppointments.push({
            id: pendingAppt.appointmentId,
            requested_time: pendingAppt.requested_time,
            status: "pending",
            payment_status: "unpaid",
            mothers: {
              id: pendingAppt.mother_id,
              full_name: pendingAppt.mother_name || "New Patient",
              profile_url: pendingAppt.profile_url || null,
            },
          })
        }
      })

      setAppointments(updatedAppointments)
    }
  }, [pendingAppointments])

  // Apply filters when they change
  useEffect(() => {
    if (!appointments.length) return

    let filtered = [...appointments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((appointment) =>
        appointment.mothers.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter)
    }

    // Apply date filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    if (dateFilter === "today") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today && appointmentDate < tomorrow
      })
    } else if (dateFilter === "upcoming") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today
      })
    } else if (dateFilter === "thisWeek") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today && appointmentDate < nextWeek
      })
    } else if (dateFilter === "past") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate < today
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const handleAccept = async (id) => {
    try {
      const result = await updateAppointmentStatus(id, "accepted")

      if (result.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: "accepted", video_conference_link: result.data.video_conference_link }
              : appointment,
          ),
        )
      } else {
        setError("Failed to accept appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error accepting appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleReject = async (id) => {
    try {
      const result = await updateAppointmentStatus(id, "declined")

      if (result.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id ? { ...appointment, status: "declined" } : appointment,
          ),
        )
      } else {
        setError("Failed to decline appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error declining appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleUpdatePayment = async (id, status) => {
    try {
      const result = await updatePaymentStatus(id, status)

      if (result.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id ? { ...appointment, payment_status: status } : appointment,
          ),
        )
      } else {
        setError(`Failed to update payment status. Please try again.`)
      }
    } catch (err) {
      console.error("Error updating payment status:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const joinMeeting = (link) => {
    if (link) {
      window.open(link, "_blank")
    } else {
      setError("Video conference link is not available.")
    }
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your patient appointments</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateFilter("all")
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="thisWeek">This Week</option>
                <option value="past">Past</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={(e) => {
                  const value = e.target.value
                  setFilteredAppointments((prev) => {
                    const sorted = [...prev]
                    if (value === "dateAsc") {
                      sorted.sort((a, b) => new Date(a.requested_time) - new Date(b.requested_time))
                    } else if (value === "dateDesc") {
                      sorted.sort((a, b) => new Date(b.requested_time) - new Date(a.requested_time))
                    } else if (value === "nameAsc") {
                      sorted.sort((a, b) => a.mothers.full_name.localeCompare(b.mothers.full_name))
                    } else if (value === "nameDesc") {
                      sorted.sort((a, b) => b.mothers.full_name.localeCompare(a.mothers.full_name))
                    }
                    return sorted
                  })
                }}
              >
                <option value="dateAsc">Date (Oldest First)</option>
                <option value="dateDesc">Date (Newest First)</option>
                <option value="nameAsc">Patient Name (A-Z)</option>
                <option value="nameDesc">Patient Name (Z-A)</option>
              </select>
            </div>
          </div>
        )}
        {connected && (
          <div className="mt-2 flex items-center text-xs text-green-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Real-time updates active
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            src={appointment.mothers.profile_url || "/placeholder.svg?height=40&width=40"}
                            alt={appointment.mothers.full_name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.mothers.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(appointment.requested_time)}</div>
                      <div className="text-sm text-gray-500">{formatTime(appointment.requested_time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                      </span>
                      {appointment.payment_status === "unpaid" && (
                        <button
                          onClick={() => handleUpdatePayment(appointment.id, "paid")}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {appointment.status === "pending" ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAccept(appointment.id)}
                            className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id)}
                            className="flex items-center px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Decline
                          </button>
                        </div>
                      ) : appointment.status === "accepted" && isUpcoming(appointment.requested_time) ? (
                        <button
                          onClick={() => joinMeeting(appointment.video_conference_link)}
                          className="flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join Call
                        </button>
                      ) : (
                        <span className="text-gray-500">
                          {appointment.status === "declined" ? "Declined" : "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No appointments found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters to see more results"
                : "You don't have any appointments scheduled yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentsPage

