"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  getDoctorIdFromUserId,
  fetchDoctorAvailability,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
} from "../services/appointmentService"
import { Calendar, Clock, Plus, Trash2 } from "lucide-react"

const AvailabilityManager = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [availabilitySlots, setAvailabilitySlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddingSlot, setIsAddingSlot] = useState(false)

  // Form state
  const [newSlot, setNewSlot] = useState({
    availableDate: "",
    startTime: "",
    endTime: "",
  })

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

  // Then, load availability once we have the doctor ID
  useEffect(() => {
    const loadAvailability = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorAvailability(doctorId)

        if (result.success) {
          setAvailabilitySlots(result.data)
        } else {
          setError("Failed to load availability slots")
        }
      } catch (err) {
        console.error("Error loading availability:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [doctorId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSlot((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()

    if (!doctorId) {
      setError("Doctor information not available")
      return
    }

    if (!newSlot.availableDate || !newSlot.startTime || !newSlot.endTime) {
      setError("Please fill all fields")
      return
    }

    setLoading(true)
    try {
      const result = await addAvailabilitySlot(doctorId, newSlot.availableDate, newSlot.startTime, newSlot.endTime)

      if (result.success) {
        setAvailabilitySlots((prev) => [...prev, result.data])
        setNewSlot({ availableDate: "", startTime: "", endTime: "" })
        setIsAddingSlot(false)
        setError(null)
      } else {
        setError("Failed to add availability slot")
      }
    } catch (err) {
      console.error("Error adding slot:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    setLoading(true)
    try {
      const result = await deleteAvailabilitySlot(slotId)

      if (result.success) {
        setAvailabilitySlots((prev) => prev.filter((slot) => slot.id !== slotId))
      } else {
        setError("Failed to delete availability slot")
      }
    } catch (err) {
      console.error("Error deleting slot:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString) => {
    // Convert "HH:MM:SS" to "HH:MM AM/PM"
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Availability Schedule</h2>
        {!isAddingSlot && (
          <button
            onClick={() => setIsAddingSlot(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Slot
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isAddingSlot && (
        <form onSubmit={handleAddSlot} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Add New Availability</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  name="availableDate"
                  value={newSlot.availableDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input
                  type="time"
                  name="startTime"
                  value={newSlot.startTime}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input
                  type="time"
                  name="endTime"
                  value={newSlot.endTime}
                  onChange={handleInputChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingSlot(false)
                setError(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading && !isAddingSlot ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : availabilitySlots.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availabilitySlots.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(slot.available_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(slot.start_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(slot.end_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p>No availability slots set up yet.</p>
          <p className="text-sm">Add slots to let patients know when you`re available.</p>
        </div>
      )}
    </div>
  )
}

export default AvailabilityManager

