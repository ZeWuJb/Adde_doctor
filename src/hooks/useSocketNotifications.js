"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  getDoctorIdFromUserId,
  fetchTemporaryAppointments,
  subscribeToTemporaryAppointments,
} from "../services/appointmentService"

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
  const [connected] = useState(true) // Always connected with Supabase
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

  // This effect fetches temporary appointments and sets up real-time subscription
  useEffect(() => {
    if (!doctorId) return

    const fetchTempAppointments = async () => {
      try {
        const result = await fetchTemporaryAppointments(doctorId)
        if (result.success) {
          setPendingAppointments(result.data)
        }
      } catch (err) {
        console.error("Error fetching temporary appointments:", err)
      }
    }

    fetchTempAppointments()

    // Set up real-time subscription for temporary appointments
    subscribeToTemporaryAppointments(
      doctorId,
      // On insert
      (newAppointment) => {
        console.log("New temporary appointment received:", newAppointment)

        // Add to notifications
        const newNotification = {
          id: Date.now().toString(),
          message: `New appointment request from ${newAppointment.mothers?.full_name || "a patient"}`,
          timestamp: new Date().toISOString(),
          read: false,
        }

        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // Add to pending appointments
        setPendingAppointments((prev) => {
          // Check if we already have this appointment to avoid duplicates
          const exists = prev.some((app) => app.id === newAppointment.id)
          if (exists) {
            return prev
          }

          const updatedAppointments = [...prev, newAppointment]
          savePendingAppointmentsToStorage(doctorId, updatedAppointments)
          return updatedAppointments
        })
      },
      // On delete
      (appointmentId) => {
        console.log("Temporary appointment deleted:", appointmentId)

        // Remove from pending appointments
        setPendingAppointments((prev) => {
          const updated = prev.filter((app) => app.id !== appointmentId)
          savePendingAppointmentsToStorage(doctorId, updated)
          return updated
        })
      },
    )

    // No need to store or clean up subscription as it's handled in the service
    return () => {
      // Clean up handled by the service
    }
  }, [doctorId])

  // Function to remove an appointment from pending list (used when accepting/declining)
  const removeFromPending = (appointmentId) => {
    setPendingAppointments((prev) => {
      const updated = prev.filter((app) => app.id !== appointmentId && app.appointmentId !== appointmentId)
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

