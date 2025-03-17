"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check } from "lucide-react"
import { UserAuth } from "../context/AuthContext"
import {
  fetchDoctorNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService"
import { getDoctorIdFromUserId } from "../services/appointmentService"

const NotificationsPanel = () => {
  const { session } = UserAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [doctorId, setDoctorId] = useState(null)
  const panelRef = useRef(null)

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
      }
    }

    fetchDoctorId()
  }, [session])

  // Then, load notifications once we have the doctor ID
  useEffect(() => {
    const loadNotifications = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorNotifications(doctorId)

        if (result.success) {
          setNotifications(result.data)
          setUnreadCount(result.data.filter((notification) => !notification.read).length)
        }
      } catch (err) {
        console.error("Error loading notifications:", err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Set up interval to refresh notifications
    const interval = setInterval(loadNotifications, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [doctorId])

  const handleMarkAsRead = async (id) => {
    try {
      const result = await markNotificationAsRead(id)

      if (result.success) {
        setNotifications(
          notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!doctorId) return

    try {
      const result = await markAllNotificationsAsRead(doctorId)

      if (result.success) {
        setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return "just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-gray-100">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-md transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-pink-50" : ""}`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.message}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(notification.created_at)}</p>

                    {!notification.read && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          className="text-xs text-pink-600 hover:text-pink-800 flex items-center"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
                <p className="text-xs mt-1">New notifications will appear here</p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 text-center">
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-600 hover:text-gray-800">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel

