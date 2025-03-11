"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { fetchDoctorStatistics, fetchRecentActivity } from "../services/dashboardService"
import { BarChart, Calendar, Clock, Users, Activity, CheckCircle, AlertCircle } from "lucide-react"

const StatisticsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // Then, load statistics once we have the doctor ID
  useEffect(() => {
    const loadStatistics = async () => {
      if (!doctorId) return

      try {
        setLoading(true)

        // Fetch statistics
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        } else {
          setError("Failed to load statistics")
        }

        // Fetch recent activity
        const activityResult = await fetchRecentActivity(doctorId)
        if (activityResult.success) {
          setRecentActivity(activityResult.data)
        }
      } catch (err) {
        console.error("Error loading statistics:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [doctorId])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now - date) / 1000)

    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) {
      return interval === 1 ? "1 year ago" : `${interval} years ago`
    }

    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) {
      return interval === 1 ? "1 month ago" : `${interval} months ago`
    }

    interval = Math.floor(seconds / 86400)
    if (interval >= 1) {
      return interval === 1 ? "1 day ago" : `${interval} days ago`
    }

    interval = Math.floor(seconds / 3600)
    if (interval >= 1) {
      return interval === 1 ? "1 hour ago" : `${interval} hours ago`
    }

    interval = Math.floor(seconds / 60)
    if (interval >= 1) {
      return interval === 1 ? "1 minute ago" : `${interval} minutes ago`
    }

    return "just now"
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Statistics & Analytics</h1>
        <p className="text-gray-600">View your practice performance and metrics</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="col-span-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-2xl font-semibold text-gray-800">{statistics.uniquePatients}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Consultations</p>
                    <p className="text-2xl font-semibold text-gray-800">{statistics.consultationsGiven}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-semibold text-gray-800">{statistics.pendingAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today`s Appointments</p>
                    <p className="text-2xl font-semibold text-gray-800">{statistics.todaysAppointments}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary-500" />
              Appointment Status
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                  <span className="text-sm font-medium text-gray-700">{statistics.completedSessions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${(statistics.completedSessions / statistics.totalAppointments) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Upcoming</span>
                  <span className="text-sm font-medium text-gray-700">{statistics.upcomingAppointments.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${(statistics.upcomingAppointments.length / statistics.totalAppointments) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                  <span className="text-sm font-medium text-gray-700">{statistics.pendingAppointments}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{ width: `${(statistics.pendingAppointments / statistics.totalAppointments) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Appointments</span>
                  <span className="font-medium">{statistics.totalAppointments}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-500" />
              Next Appointment
            </h2>

            {statistics.nextAppointment ? (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    <img
                      src={statistics.nextAppointment.mothers.profile_url || "/placeholder.svg?height=48&width=48"}
                      alt="Patient"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{statistics.nextAppointment.mothers.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(statistics.nextAppointment.requested_time)} at{" "}
                      {formatTime(statistics.nextAppointment.requested_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        statistics.nextAppointment.payment_status === "paid" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></span>
                    <span>{statistics.nextAppointment.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
                  </div>

                  <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700">
                    Join Call
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary-500" />
              Recent Activity
            </h2>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                          <img
                            src={activity.mothers.profile_url || "/placeholder.svg?height=40&width=40"}
                            alt="Patient"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-900">{activity.mothers.full_name}</p>
                            <p className="text-sm text-gray-500">{getTimeAgo(activity.updated_at)}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.status === "accepted"
                              ? "Appointment accepted"
                              : activity.status === "declined"
                                ? "Appointment declined"
                                : "Requested an appointment"}
                            {" for "}
                            {formatDate(activity.requested_time)} at {formatTime(activity.requested_time)}
                          </p>
                          <div className="mt-2 flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : activity.status === "declined"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                            </span>

                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.payment_status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {activity.payment_status.charAt(0).toUpperCase() + activity.payment_status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default StatisticsPage

