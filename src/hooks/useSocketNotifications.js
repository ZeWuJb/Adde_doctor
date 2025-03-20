"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import socketService from "../services/socketService"

// Helper functions for localStorage
const STORAGE_KEY = "caresync_pending_appointments"

const savePendingAppointmentsToStorage = (doctorId, appointments) => {
  try {
    // Store appointments with doctor ID to avoid mixing different doctors' data
    const data = {
      doctorId,
      appointments,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error("Error saving to localStorage:", err)
  }
}

const loadPendingAppointmentsFromStorage = (doctorId) => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) return []

    const data = JSON.parse(storedData)

    // Only load if it's for the same doctor and not older than 24 hours
    if (data.doctorId === doctorId && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
      return data.appointments || []
    }
    return []
  } catch (err) {
    console.error("Error loading from localStorage:", err)
    return []
  }
}

export const useSocketNotifications = () => {
  const { session } = UserAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingAppointments, setPendingAppointments] = useState([])
  const [doctorId, setDoctorId] = useState(null)

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)

          // Load pending appointments from localStorage once we have the doctor ID
          const storedAppointments = loadPendingAppointmentsFromStorage(result.doctorId)
          if (storedAppointments.length > 0) {
            console.log("Loaded pending appointments from storage:", storedAppointments.length)
            setPendingAppointments(storedAppointments)
          }
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
      }
    }

    fetchDoctorId()
  }, [session])

  // Save pending appointments to localStorage whenever they change
  useEffect(() => {
    if (doctorId && pendingAppointments.length > 0) {
      savePendingAppointmentsToStorage(doctorId, pendingAppointments)
    }
  }, [doctorId, pendingAppointments])

  // This effect initializes the socket connection and sets up event handlers
  useEffect(() => {
    if (!doctorId) return

    const initializeSocket = async () => {
      try {
        console.log("Initializing socket with doctor ID:", doctorId)

        // Initialize socket connection
        const initialized = await socketService.initialize(doctorId)

        if (initialized) {
          // Set up connection status handler
          socketService.onConnectionChange((status) => {
            console.log("Socket connection status changed:", status)
            setConnected(status)
          })

          // Set up new appointment handler
          socketService.onNewAppointment((data) => {
            console.log("New appointment received:", data)

            // Add to notifications
            const newNotification = {
              id: Date.now().toString(),
              message: `New appointment request from ${data.mother_name || "a patient"}`,
              timestamp: new Date().toISOString(),
              read: false,
            }

            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Add to pending appointments (in memory and localStorage)
            setPendingAppointments((prev) => {
              // Check if we already have this appointment to avoid duplicates
              const exists = prev.some((app) => app.id === data.appointmentId)
              if (exists) {
                return prev
              }

              const newAppointment = {
                id: data.appointmentId,
                appointmentId: data.appointmentId,
                doctor_id: data.doctor_id,
                mother_id: data.mother_id,
                mother_name: data.mother_name || "Unknown Patient",
                requested_time: data.requested_time,
                profile_url: data.profile_url || null,
                status: "pending",
                mothers: {
                  full_name: data.mother_name || "Unknown Patient",
                  profile_url: data.profile_url || "/placeholder.svg",
                },
              }

              const updatedAppointments = [...prev, newAppointment]

              // Save to localStorage
              savePendingAppointmentsToStorage(doctorId, updatedAppointments)

              return updatedAppointments
            })
          })

          // Set up appointment accepted handler
          socketService.onAppointmentAccepted((data) => {
            console.log("Appointment accepted:", data)
            const newNotification = {
              id: Date.now().toString(),
              message: `Appointment with ${data.mother_name || "a patient"} was accepted`,
              timestamp: new Date().toISOString(),
              read: false,
            }

            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Remove from pending appointments
            setPendingAppointments((prev) => {
              const updated = prev.filter((app) => app.appointmentId !== data.appointmentId)
              savePendingAppointmentsToStorage(doctorId, updated)
              return updated
            })
          })

          // Set up appointment declined handler
          socketService.onAppointmentDeclined((data) => {
            console.log("Appointment declined:", data)
            const newNotification = {
              id: Date.now().toString(),
              message: `Appointment with ${data.mother_name || "a patient"} was declined`,
              timestamp: new Date().toISOString(),
              read: false,
            }

            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)

            // Remove from pending appointments
            setPendingAppointments((prev) => {
              const updated = prev.filter((app) => app.appointmentId !== data.appointmentId)
              savePendingAppointmentsToStorage(doctorId, updated)
              return updated
            })
          })
        }
      } catch (err) {
        console.error("Error in socket connection:", err)
      }
    }

    initializeSocket()

    return () => {
      // Disconnect socket
      socketService.disconnect()
    }
  }, [doctorId])

  // Function to remove an appointment from pending list (used when accepting/declining)
  const removeFromPending = (appointmentId) => {
    setPendingAppointments((prev) => {
      const updated = prev.filter((app) => app.appointmentId !== appointmentId)
      savePendingAppointmentsToStorage(doctorId, updated)
      return updated
    })
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  return {
    connected,
    notifications,
    unreadCount,
    pendingAppointments,
    markAsRead,
    markAllAsRead,
    removeFromPending,
  }
}

