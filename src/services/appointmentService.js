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
        mothers:mother_id (
          id, 
          full_name, 
          profile_picture
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

// Fetch doctor's availability
export const fetchDoctorAvailability = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("available_date", { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching doctor availability:", error.message)
    return { success: false, error }
  }
}

// Add new availability slot
export const addAvailabilitySlot = async (doctorId, availableDate, startTime, endTime) => {
  try {
    const { data, error } = await supabase
      .from("doctor_availability")
      .insert({
        doctor_id: doctorId,
        available_date: availableDate,
        start_time: startTime,
        end_time: endTime,
      })
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error adding availability slot:", error.message)
    return { success: false, error }
  }
}

// Delete availability slot
export const deleteAvailabilitySlot = async (slotId) => {
  try {
    const { error } = await supabase.from("doctor_availability").delete().eq("id", slotId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting availability slot:", error.message)
    return { success: false, error }
  }
}

