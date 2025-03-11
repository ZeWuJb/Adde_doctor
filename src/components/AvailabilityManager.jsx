"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  getDoctorIdFromUserId,
  fetchDoctorAvailability,
  deleteAvailabilitySlot,
  updateDoctorAvailability,
} from "../services/appointmentService"
import { Calendar, Clock, Plus, Trash2, AlertCircle, Check, Info, RefreshCw } from "lucide-react"

const AvailabilityManager = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [availabilityData, setAvailabilityData] = useState({ dates: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state for advanced scheduling
  const [schedule, setSchedule] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
    daysOfWeek: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    timeSlots: [{ startTime: "09:00", endTime: "17:00" }],
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
          setAvailabilityData(result.data || { dates: [] })
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

  // Handle day of week selection
  const handleDayChange = (day) => {
    setSchedule((prev) => ({
      ...prev,
      daysOfWeek: {
        ...prev.daysOfWeek,
        [day]: !prev.daysOfWeek[day],
      },
    }))
  }

  // Handle date changes
  const handleDateChange = (e) => {
    const { name, value } = e.target
    setSchedule((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle time slot changes
  const handleTimeSlotChange = (index, field, value) => {
    setSchedule((prev) => {
      const updatedTimeSlots = [...prev.timeSlots]
      updatedTimeSlots[index] = {
        ...updatedTimeSlots[index],
        [field]: value,
      }
      return {
        ...prev,
        timeSlots: updatedTimeSlots,
      }
    })
  }

  // Add a new time slot
  const addTimeSlot = () => {
    setSchedule((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: "09:00", endTime: "17:00" }],
    }))
  }

  // Remove a time slot
  const removeTimeSlot = (index) => {
    if (schedule.timeSlots.length <= 1) return // Keep at least one time slot

    setSchedule((prev) => {
      const updatedTimeSlots = [...prev.timeSlots]
      updatedTimeSlots.splice(index, 1)
      return {
        ...prev,
        timeSlots: updatedTimeSlots,
      }
    })
  }

  // Generate dates based on selected days of week within date range
  const generateDates = () => {
    const dates = []
    const startDate = new Date(schedule.startDate)
    const endDate = new Date(schedule.endDate)

    // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    // Get selected days as numbers
    const selectedDays = Object.entries(schedule.daysOfWeek)
      .filter((entry) => entry[1]) // Use entry[1] which is the boolean value
      .map((entry) => dayMap[entry[0]])

    // Loop through each day in the date range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      // Check if the current day of week is selected
      if (selectedDays.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate))
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Handle form submission for advanced scheduling
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
  
    if (!doctorId) {
      setError("Doctor information not available");
      return;
    }
  
    // Validate form
    const selectedDays = Object.values(schedule.daysOfWeek).filter(Boolean).length;
    if (selectedDays === 0) {
      setError("Please select at least one day of the week");
      return;
    }
  
    // Generate all dates based on selected days and date range
    const dates = generateDates();
    if (dates.length === 0) {
      setError("No dates were generated with the selected criteria");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      // Get current availability
      const { success, data: currentAvailability, recordId } = await fetchDoctorAvailability(doctorId);
      if (!success) {
        throw new Error("Failed to fetch current availability");
      }
  
      // Create a copy of the current availability
      const updatedAvailability = { ...currentAvailability };
  
      // Ensure dates array exists
      if (!updatedAvailability.dates) {
        updatedAvailability.dates = [];
      }
  
      // For each date and time slot, add to availability
      let addedSlots = 0;
      let skippedSlots = 0;
  
      for (const date of dates) {
        const dateString = date.toISOString().split("T")[0];
  
        // Find if the date already exists in the availability
        let dateIndex = updatedAvailability.dates.findIndex((d) => d.date === dateString);
  
        // If date doesn't exist, add it
        if (dateIndex === -1) {
          updatedAvailability.dates.push({
            date: dateString,
            slots: [],
          });
          dateIndex = updatedAvailability.dates.length - 1;
        }
  
        // For each time slot
        for (const timeSlot of schedule.timeSlots) {
          // Generate hourly slots between start and end time
          const slots = [];
          let currentTime = timeSlot.startTime;
  
          while (currentTime < timeSlot.endTime) {
            // Check if slot already exists
            if (!updatedAvailability.dates[dateIndex].slots.includes(currentTime)) {
              slots.push(currentTime);
              addedSlots++;
            } else {
              skippedSlots++;
            }
  
            // Move to next hour
            const [hours, minutes] = currentTime.split(":").map(Number);
            const timeDate = new Date();
            timeDate.setHours(hours, minutes, 0, 0);
            timeDate.setHours(timeDate.getHours() + 1);
            currentTime = `${String(timeDate.getHours()).padStart(2, "0")}:${String(timeDate.getMinutes()).padStart(2, "0")}`;
          }
  
          // Add slots to the date
          updatedAvailability.dates[dateIndex].slots = [...updatedAvailability.dates[dateIndex].slots, ...slots].sort();
        }
      }
  
      // Sort dates
      updatedAvailability.dates.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      console.log("Saving availability with recordId:", recordId);
  
      // Update availability in database
      const updateResult = await updateDoctorAvailability(doctorId, updatedAvailability, recordId);
      if (!updateResult.success) {
        throw new Error(updateResult.error?.message || "Failed to update availability");
      }
  
      // Update local state with the returned data
      setAvailabilityData(updatedAvailability);
  
      // Show success message
      setSuccessMessage(
        `Successfully added ${addedSlots} time slots${skippedSlots > 0 ? ` (${skippedSlots} duplicates skipped)` : ""}`,
      );
      setTimeout(() => setSuccessMessage(""), 5000);
  
      // Reset form if not recurring
      if (!isRecurring) {
        setIsAddingSlot(false);
      }
    } catch (err) {
      console.error("Error setting availability:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (date, slot) => {
    setLoading(true)
    try {
      const result = await deleteAvailabilitySlot(doctorId, date, slot)

      if (result.success) {
        // Refresh the availability data
        const refreshResult = await fetchDoctorAvailability(doctorId)
        if (refreshResult.success) {
          setAvailabilityData(refreshResult.data)
        }
      } else {
        setError(result.error?.message || "Failed to delete availability slot")
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
    // Convert "HH:MM" to "HH:MM AM/PM"
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Get day name from date
  const getDayName = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  // Flatten the availability data for display in the table
  const getAvailabilitySlots = () => {
    const slots = []

    // Ensure dates array exists and is an array before trying to iterate
    const dates = availabilityData?.dates || []

    dates.forEach((dateObj) => {
      if (dateObj && Array.isArray(dateObj.slots)) {
        dateObj.slots.forEach((slot) => {
          slots.push({
            date: dateObj.date,
            time: slot,
          })
        })
      }
    })

    // Sort by date and time
    return slots.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date)
      }
      return a.time.localeCompare(b.time)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Availability Schedule</h2>
        {!isAddingSlot && (
          <button
            onClick={() => setIsAddingSlot(true)}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Set Availability
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg text-sm">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {isAddingSlot && (
        <form onSubmit={handleSubmitSchedule} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Set Your Availability</h3>

          {/* Recurring Schedule Toggle */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={() => setIsRecurring(!isRecurring)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                Set as recurring schedule
              </label>
              <RefreshCw className="ml-2 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {isRecurring
                ? "This schedule will repeat weekly until you change it"
                : "This schedule will only apply to the selected date range"}
            </p>
          </div>

          {/* Date Range */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  name="startDate"
                  value={schedule.startDate}
                  onChange={handleDateChange}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  name="endDate"
                  value={schedule.endDate}
                  onChange={handleDateChange}
                  min={schedule.startDate}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Days of Week */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(schedule.daysOfWeek).map(([day, isSelected]) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayChange(day)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Time Slots</label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Time Slot
              </button>
            </div>

            {schedule.timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeSlotChange(index, "startTime", e.target.value)}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeSlotChange(index, "endTime", e.target.value)}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                {schedule.timeSlots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Time slots will be created in hourly increments
            </p>
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
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      )}

      {loading && !isAddingSlot ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : getAvailabilitySlots().length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getAvailabilitySlots().map((slot, index) => (
                <tr key={`${slot.date}-${slot.time}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(slot.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getDayName(slot.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(slot.time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteSlot(slot.date, slot.time)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="Delete slot"
                    >
                      <Trash2 className="w-5 w-5" />
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

