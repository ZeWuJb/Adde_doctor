"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { supabase } from "../../supabaseClient"

const RecentActivity = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true)

        // Fetch recent appointments with status changes
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            id,
            requested_time,
            status,
            updated_at,
            doctors:doctor_id (
              id,
              full_name
            ),
            mothers:mother_id (
              user_id,
              full_name
            )
          `)
          .order("updated_at", { ascending: false })
          .limit(5)

        if (appointmentsError) throw appointmentsError

        // Format the data for display
        const formattedActivities = appointmentsData.map((appointment) => {
          let activityType, icon

          switch (appointment.status) {
            case "accepted":
              activityType = "Appointment Accepted"
              icon = "check"
              break
            case "declined":
              activityType = "Appointment Declined"
              icon = "x"
              break
            default:
              activityType = "Appointment Requested"
              icon = "calendar"
          }

          return {
            id: appointment.id,
            type: activityType,
            icon,
            user: appointment.mothers?.full_name || "Unknown Patient",
            target: appointment.doctors?.full_name || "Unknown Doctor",
            time: appointment.updated_at,
            details: `Scheduled for ${new Date(appointment.requested_time).toLocaleString()}`,
          }
        })

        setActivities(formattedActivities)
      } catch (err) {
        console.error("Error fetching recent activity:", err.message)
        setError("Failed to fetch recent activity.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()

    // Set up real-time subscription for appointments
    const appointmentsSubscription = supabase
      .channel("appointments-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        console.log("Appointment change received:", payload)
        // Refresh the activity data when changes occur
        fetchRecentActivity()
      })
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(appointmentsSubscription)
    }
  }, [])

  const getActivityIcon = (icon) => {
    switch (icon) {
      case "check":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "x":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "calendar":
        return <Calendar className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return "just now"
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No recent activity found.</div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className="p-2 rounded-full bg-gray-100 mr-3">{getActivityIcon(activity.icon)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.type} - <span className="font-normal">{activity.user}</span> with{" "}
                  <span className="font-normal">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.details}</p>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(activity.time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
