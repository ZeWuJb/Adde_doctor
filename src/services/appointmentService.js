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

// Fetch temporary appointments for a specific doctor
export const fetchTemporaryAppointments = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("temporary_appointments")
      .select(`
        id, 
        doctor_id,
        mother_id,
        requested_time, 
        created_at,
        mothers:mother_id (
          user_id, 
          full_name, 
          profile_url
        )
      `)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the data to match the structure expected by the UI
    const formattedData = data.map((appointment) => ({
      ...appointment,
      status: "pending", // All temporary appointments are pending
      appointmentId: appointment.id, // For compatibility with existing code
    }))

    return { success: true, data: formattedData }
  } catch (error) {
    console.error("Error fetching temporary appointments:", error.message)
    return { success: false, error }
  }
}

// Accept a temporary appointment
export const acceptTemporaryAppointment = async (appointmentId) => {
  try {
    // First, get the temporary appointment details
    const { data: tempAppointment, error: fetchError } = await supabase
      .from("temporary_appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()

    if (fetchError) throw fetchError
    if (!tempAppointment) throw new Error("Temporary appointment not found")

    // Generate a video conference link
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    const videoLink = `https://meet.jit.si/${meetingId}`

    // Create a permanent appointment
    const { data: newAppointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        doctor_id: tempAppointment.doctor_id,
        mother_id: tempAppointment.mother_id,
        requested_time: tempAppointment.requested_time,
        status: "accepted",
        payment_status: "unpaid",
        video_conference_link: videoLink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (insertError) throw insertError

    // Delete the temporary appointment
    const { error: deleteError } = await supabase.from("temporary_appointments").delete().eq("id", appointmentId)

    if (deleteError) throw deleteError

    // Increment the consultation count for the doctor
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("consultations_given")
        .eq("id", tempAppointment.doctor_id)
        .single()

      if (!doctorError && doctorData) {
        const currentCount = doctorData.consultations_given || 0
        await supabase
          .from("doctors")
          .update({ consultations_given: currentCount + 1 })
          .eq("id", tempAppointment.doctor_id)
      }
    } catch (err) {
      console.warn("Could not update consultation count:", err.message)
      // Don't fail the whole operation if just this part fails
    }

    return { success: true, data: newAppointment[0] }
  } catch (error) {
    console.error("Error accepting temporary appointment:", error.message)
    return { success: false, error }
  }
}

// Reject a temporary appointment
export const rejectTemporaryAppointment = async (appointmentId) => {
  try {
    // Delete the temporary appointment
    const { error } = await supabase.from("temporary_appointments").delete().eq("id", appointmentId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error rejecting temporary appointment:", error.message)
    return { success: false, error }
  }
}

// Set up real-time subscription for temporary appointments
export const subscribeToTemporaryAppointments = (doctorId, onInsert, onDelete) => {
  return supabase
    .channel("temporary-appointments-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "temporary_appointments",
        filter: `doctor_id=eq.${doctorId}`,
      },
      (payload) => {
        console.log("New temporary appointment:", payload)
        if (onInsert) {
          // Format the data to match the structure expected by the UI
          const appointment = {
            ...payload.new,
            status: "pending",
            appointmentId: payload.new.id,
          }
          onInsert(appointment)
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "temporary_appointments",
        filter: `doctor_id=eq.${doctorId}`,
      },
      (payload) => {
        console.log("Temporary appointment deleted:", payload)
        if (onDelete) onDelete(payload.old.id)
      },
    )
    .subscribe()
}

// Update appointment status (accept/reject)
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    // If accepting, generate a video conference link
    let videoLink = null
    if (status === "accepted") {
      // Generate a unique meeting ID
      const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      videoLink = `https://meet.jit.si/${meetingId}`
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

// Fetch doctor availability
export const fetchDoctorAvailability = async (doctorId) => {
  try {
    const { data, error } = await supabase.from("doctor_availability").select("*").eq("doctor_id", doctorId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No availability found, return an empty object
        return { success: true, data: { availability: { dates: [] } }, recordId: null }
      }
      throw error
    }

    // If availability exists but doesn't have the dates structure, initialize it
    if (!data.availability || !data.availability.dates) {
      data.availability = { dates: [] }
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
    // Prepare the data for the database - wrap the dates array in an availability object
    const dbData = {
      availability: availabilityData,
    }

    if (recordId) {
      // Update existing record
      const { data, error } = await supabase.from("doctor_availability").update(dbData).eq("id", recordId).select()

      if (error) throw error
      return { success: true, data: data[0] }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("doctor_availability")
        .insert({ doctor_id: doctorId, ...dbData })
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
    const updatedAvailability = { ...currentAvailability.availability }

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
    const updatedAvailability = { ...currentAvailability.availability }

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
    const dateEntry = data.availability.dates.find((d) => d.date === date)
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

// Create a temporary appointment request
export const createTemporaryAppointment = async (appointmentData) => {
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
      created_at: new Date().toISOString(),
    }

    // Insert the temporary appointment
    const { data, error } = await supabase.from("temporary_appointments").insert(formattedData).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error creating temporary appointment:", error.message)
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

// Get temporary appointments for a mother
export const fetchMotherTemporaryAppointments = async (motherId) => {
  try {
    const { data, error } = await supabase
      .from("temporary_appointments")
      .select(`
        id, 
        doctor_id,
        requested_time, 
        created_at,
        doctors:doctor_id (
          id, 
          full_name, 
          speciality,
          profile_url
        )
      `)
      .eq("mother_id", motherId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Format the data to match the structure expected by the UI
    const formattedData = data.map((appointment) => ({
      ...appointment,
      status: "pending", // All temporary appointments are pending
      appointmentId: appointment.id, // For compatibility with existing code
    }))

    return { success: true, data: formattedData }
  } catch (error) {
    console.error("Error fetching temporary appointments:", error.message)
    return { success: false, error }
  }
}

// Set up real-time subscription for mother's temporary appointments
export const subscribeToMotherTemporaryAppointments = (motherId, onInsert, onDelete) => {
  return supabase
    .channel("mother-temp-appointments-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "temporary_appointments",
        filter: `mother_id=eq.${motherId}`,
      },
      (payload) => {
        console.log("New temporary appointment for mother:", payload)
        if (onInsert) {
          // Format the data to match the structure expected by the UI
          const appointment = {
            ...payload.new,
            status: "pending",
            appointmentId: payload.new.id,
          }
          onInsert(appointment)
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "temporary_appointments",
        filter: `mother_id=eq.${motherId}`,
      },
      (payload) => {
        console.log("Temporary appointment deleted for mother:", payload)
        if (onDelete) onDelete(payload.old.id)
      },
    )
    .subscribe()
}

// Set up real-time subscription for mother's appointments
export const subscribeToMotherAppointments = (motherId, onInsert, onUpdate) => {
  return supabase
    .channel("mother-appointments-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "appointments",
        filter: `mother_id=eq.${motherId}`,
      },
      (payload) => {
        console.log("New appointment for mother:", payload)
        if (onInsert) onInsert(payload.new)
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "appointments",
        filter: `mother_id=eq.${motherId}`,
      },
      (payload) => {
        console.log("Appointment updated for mother:", payload)
        if (onUpdate) onUpdate(payload.new)
      },
    )
    .subscribe()
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

    // Generate video conference link with a unique identifier (not using the appointment ID)
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    const videoLink = `https://meet.jit.si/${meetingId}`

    // Important: Do NOT include the id field - let Supabase generate a UUID
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

