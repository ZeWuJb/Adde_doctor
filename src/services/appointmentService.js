"use client"

import { supabase } from "../supabaseClient"

// Helper function to get doctor ID from user ID
export const getDoctorIdFromUserId = async (userId) => {
  try {
    const { data, error } = await supabase.from("doctors").select("id").eq("user_id", userId).single()

    if (error) throw error
    return { success: true, doctorId: data.id }
  } catch (error) {
    console.error("Error fetching doctor ID:", error.message)
    return { success: false, error }
  }
}

// Fetch appointments for a specific doctor
export const fetchDoctorAppointments = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        requested_time, 
        status, 
        payment_status, 
        video_conference_link,
        created_at,
        updated_at,
        mothers:mother_id (
          user_id, 
          full_name, 
          profile_url
        )
      `)
      .eq("doctor_id", doctorId)
      .order("requested_time", { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching appointments:", error.message)
    return { success: false, error }
  }
}

// Update appointment status (accept/reject)
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    // Check if this is a socket-generated ID (timestamp) rather than a UUID
    // If it's a timestamp ID, we don't need to update the database
    if (appointmentId && !appointmentId.includes("-")) {
      console.log(`Skipping database update for non-UUID appointment ID: ${appointmentId}`)
      return { success: true, data: { id: appointmentId, status } }
    }

    // If accepting, generate a video conference link
    let videoLink = null
    if (status === "accepted") {
      videoLink = `https://meet.jit.si/${appointmentId}`
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        status,
        video_conference_link: videoLink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error(`Error updating appointment status to ${status}:`, error.message)
    return { success: false, error }
  }
}

// Update appointment payment status
export const updatePaymentStatus = async (appointmentId, paymentStatus) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error(`Error updating payment status to ${paymentStatus}:`, error.message)
    return { success: false, error }
  }
}

// Fetch doctor availability
export const fetchDoctorAvailability = async (doctorId) => {
  try {
    const { data, error } = await supabase.from("doctor_availability").select("*").eq("doctor_id", doctorId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No availability found, return an empty object
        return { success: true, data: { dates: [] }, recordId: null }
      }
      throw error
    }

    return { success: true, data, recordId: data.id }
  } catch (error) {
    console.error("Error fetching doctor availability:", error.message)
    return { success: false, error }
  }
}

// Update doctor availability
export const updateDoctorAvailability = async (doctorId, availabilityData, recordId = null) => {
  try {
    if (recordId) {
      // Update existing record
      const { data, error } = await supabase
        .from("doctor_availability")
        .update(availabilityData)
        .eq("id", recordId)
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("doctor_availability")
        .insert({ doctor_id: doctorId, ...availabilityData })
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    }
  } catch (error) {
    console.error("Error updating doctor availability:", error.message)
    return { success: false, error }
  }
}

// Add availability slot
export const addAvailabilitySlot = async (doctorId, date, slot) => {
  try {
    // Fetch current availability
    const { success, data: currentAvailability, recordId } = await fetchDoctorAvailability(doctorId)
    if (!success) {
      throw new Error("Failed to fetch current availability")
    }

    // Create a copy of the current availability
    const updatedAvailability = { ...currentAvailability }

    // Ensure dates array exists
    if (!updatedAvailability.dates) {
      updatedAvailability.dates = []
    }

    // Find if the date already exists in the availability
    let dateIndex = updatedAvailability.dates.findIndex((d) => d.date === date)

    // If date doesn't exist, add it
    if (dateIndex === -1) {
      updatedAvailability.dates.push({
        date,
        slots: [],
      })
      dateIndex = updatedAvailability.dates.length - 1
    }

    // Check if slot already exists
    if (!updatedAvailability.dates[dateIndex].slots.includes(slot)) {
      // Add the slot and sort
      updatedAvailability.dates[dateIndex].slots.push(slot)
      updatedAvailability.dates[dateIndex].slots.sort()
    }

    // Update availability in database
    const updateResult = await updateDoctorAvailability(doctorId, updatedAvailability, recordId)
    if (!updateResult.success) {
      throw new Error(updateResult.error?.message || "Failed to update availability")
    }

    return { success: true }
  } catch (error) {
    console.error("Error adding availability slot:", error.message)
    return { success: false, error }
  }
}

// Delete availability slot
export const deleteAvailabilitySlot = async (doctorId, date, slot) => {
  try {
    // Fetch current availability
    const { success, data: currentAvailability, recordId } = await fetchDoctorAvailability(doctorId)
    if (!success) {
      throw new Error("Failed to fetch current availability")
    }

    // Create a copy of the current availability
    const updatedAvailability = { ...currentAvailability }

    // Find the date index
    const dateIndex = updatedAvailability.dates.findIndex((d) => d.date === date)

    if (dateIndex === -1) {
      return { success: true } // Date not found, consider it a success
    }

    // Filter out the slot to be deleted
    updatedAvailability.dates[dateIndex].slots = updatedAvailability.dates[dateIndex].slots.filter((s) => s !== slot)

    // If no slots left for the date, remove the date entry
    if (updatedAvailability.dates[dateIndex].slots.length === 0) {
      updatedAvailability.dates.splice(dateIndex, 1)
    }

    // Update availability in database
    const updateResult = await updateDoctorAvailability(doctorId, updatedAvailability, recordId)
    if (!updateResult.success) {
      throw new Error(updateResult.error?.message || "Failed to update availability")
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting availability slot:", error.message)
    return { success: false, error }
  }
}

// Check availability
export const checkAvailability = async (doctorId, date, slot) => {
  try {
    // Fetch doctor availability
    const { success, data } = await fetchDoctorAvailability(doctorId)
    if (!success) {
      throw new Error("Failed to fetch availability")
    }

    // Find the date in availability
    const dateEntry = data.dates.find((d) => d.date === date)
    if (!dateEntry) {
      return { success: true, available: false }
    }

    // Check if slot exists
    const available = dateEntry.slots.includes(slot)
    return { success: true, available }
  } catch (error) {
    console.error("Error checking availability:", error.message)
    return { success: false, error }
  }
}

// Create a new appointment
export const createAppointment = async (appointmentData) => {
  try {
    const { doctor_id, mother_id, requested_time } = appointmentData

    // Validate required fields
    if (!doctor_id || !mother_id || !requested_time) {
      return {
        success: false,
        error: { message: "Missing required fields: doctor_id, mother_id, and requested_time are required" },
      }
    }

    // Format the data for insertion
    const formattedData = {
      doctor_id,
      mother_id,
      requested_time,
      status: appointmentData.status || "pending",
      payment_status: appointmentData.payment_status || "unpaid",
      video_conference_link: appointmentData.video_conference_link || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert the appointment
    const { data, error } = await supabase.from("appointments").insert(formattedData).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error creating appointment:", error.message)
    return { success: false, error }
  }
}

// Get appointments for a mother
export const fetchMotherAppointments = async (motherId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        requested_time, 
        status, 
        payment_status, 
        video_conference_link,
        created_at,
        updated_at,
        doctors:doctor_id (
          id, 
          full_name, 
          speciality,
          profile_url
        )
      `)
      .eq("mother_id", motherId)
      .order("requested_time", { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching mother appointments:", error.message)
    return { success: false, error }
  }
}

// Cancel an appointment
export const cancelAppointment = async (appointmentId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error cancelling appointment:", error.message)
    return { success: false, error }
  }
}

// Save appointment to the database only when accepted
export const saveAppointmentWhenAccepted = async (appointmentData) => {
  try {
    const { doctor_id, mother_id, requested_time } = appointmentData

    // Validate required fields
    if (!doctor_id) {
      console.error("Missing doctor_id in appointment data")
      return { success: false, error: { message: "Missing doctor_id" } }
    }
    if (!mother_id) {
      console.error("Missing mother_id in appointment data")
      return { success: false, error: { message: "Missing mother_id" } }
    }
    if (!requested_time) {
      console.error("Missing requested_time in appointment data")
      return { success: false, error: { message: "Missing requested_time" } }
    }

    // Generate video conference link
    const videoLink = `https://meet.jit.si/${Date.now()}`

    // Insert new appointment into the database
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        doctor_id,
        mother_id,
        requested_time,
        status: "accepted",
        payment_status: "unpaid",
        video_conference_link: videoLink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    // Increment the consultation count for the doctor
    if (data && data.length > 0) {
      const appointment = data[0]
      try {
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("consultations_given")
          .eq("id", appointment.doctor_id)
          .single()

        if (!doctorError && doctorData) {
          const currentCount = doctorData.consultations_given || 0
          await supabase
            .from("doctors")
            .update({ consultations_given: currentCount + 1 })
            .eq("id", appointment.doctor_id)
        }
      } catch (err) {
        console.warn("Could not update consultation count:", err.message)
        // Don't fail the whole operation if just this part fails
      }
    }

    console.log("Successfully saved appointment to database:", data[0])
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error saving accepted appointment:", error.message)
    return { success: false, error }
  }
}

