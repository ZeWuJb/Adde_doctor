"use client"

import PropTypes from "prop-types"
import { Calendar, Clock, Video, Check, Users, Activity, FileText } from "lucide-react"

const DashboardContent = ({ statistics, recentActivity, loading }) => {
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

    if (seconds < 60) return "just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome to CareSync</h1>
        <p className="opacity-90">Your platform for managing maternal healthcare appointments and patient care.</p>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-pink-500 transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-pink-100 text-pink-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-800">{statistics?.uniquePatients || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-purple-500 transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Check className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Consultations</p>
                <p className="text-2xl font-semibold text-gray-800">{statistics?.consultationsGiven || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500 transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-800">{statistics?.pendingAppointments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-green-500 transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today`s Appointments</p>
                <p className="text-2xl font-semibold text-gray-800">{statistics?.todaysAppointments || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Appointment & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-pink-500" />
            Next Appointment
          </h2>

          {statistics?.nextAppointment ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  <img
                    src={statistics.nextAppointment.mothers?.profile_url || "/placeholder.svg?height=48&width=48"}
                    alt="Patient"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">
                    {statistics.nextAppointment.mothers?.full_name || "Patient"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(statistics.nextAppointment.requested_time)} at{" "}
                    {formatTime(statistics.nextAppointment.requested_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      statistics.nextAppointment.payment_status === "paid" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  ></span>
                  <span className="text-sm text-gray-600">
                    {statistics.nextAppointment.payment_status === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </div>

                <button
                  className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors flex items-center"
                  onClick={() => window.open(statistics.nextAppointment.video_conference_link, "_blank")}
                >
                  <Video className="h-4 w-4 mr-1.5" />
                  Join Call
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No upcoming appointments</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-pink-500" />
            Recent Activity
          </h2>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        <img
                          src={activity.mothers?.profile_url || "/placeholder.svg?height=40&width=40"}
                          alt="Patient"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900">{activity.mothers?.full_name || "Patient"}</p>
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => (window.location.href = "/appointments")}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
          >
            <div className="p-3 rounded-full bg-pink-100 text-pink-600 mr-3">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-medium">Manage Appointments</span>
          </button>

          <button
            onClick={() => (window.location.href = "/availability")}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
          >
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
              <Clock className="h-5 w-5" />
            </div>
            <span className="font-medium">Set Availability</span>
          </button>

          <button
            onClick={() => (window.location.href = "/patients")}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
          >
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-3">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-medium">View Patients</span>
          </button>

          <button
            onClick={() => (window.location.href = "/reports")}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
          >
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-3">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-medium">Generate Reports</span>
          </button>
        </div>
      </div>
    </div>
  )
}

DashboardContent.propTypes = {
  statistics: PropTypes.shape({
    uniquePatients: PropTypes.number,
    consultationsGiven: PropTypes.number,
    pendingAppointments: PropTypes.number,
    todaysAppointments: PropTypes.number,
    nextAppointment: PropTypes.object,
  }),
  recentActivity: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      requested_time: PropTypes.string.isRequired,
      payment_status: PropTypes.string.isRequired,
      mothers: PropTypes.shape({
        full_name: PropTypes.string,
        profile_url: PropTypes.string,
      }),
    }),
  ),
  loading: PropTypes.bool.isRequired,
}

export default DashboardContent

