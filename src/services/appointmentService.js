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
    }

    console.log("Successfully saved appointment to database:", data[0])
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error saving accepted appointment:", error.message)
    return { success: false, error }
  }
}


// Update appointment status (accept/reject) - This should only be used for existing appointments
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
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

    // If accepting, increment the consultation count for the doctor
    if (status === "accepted" && data && data.length > 0) {
      const appointment = data[0]
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
    }

    return { success: true, data: data && data.length > 0 ? data[0] : null }
  } catch (error) {
    console.error(`Error updating appointment status to ${status}:`, error.message)
    return { success: false, error }
  }
}

