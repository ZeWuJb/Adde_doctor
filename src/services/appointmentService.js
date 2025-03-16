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
          id, 
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

// Fetch a single appointment by ID
export const fetchAppointmentById = async (appointmentId) => {
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
          profile_url,
          speciality
        ),
        mothers:mother_id (
          id, 
          full_name, 
          profile_url
        )
      `)
      .eq("id", appointmentId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching appointment:", error.message)
    return { success: false, error }
  }
}

// Update appointment status (accept/reject)
export const updateAppointmentStatus = async (appointmentId, status, socketIo = null) => {
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

    // If accepting, increment the consultation count for the doctor
    if (status === "accepted") {
      const appointment = data[0]
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("consultations_given")
        .eq("id", appointment.doctor_id)
        .single()

      if (!doctorError) {
        const currentCount = doctorData.consultations_given || 0
        await supabase
          .from("doctors")
          .update({ consultations_given: currentCount + 1 })
          .eq("id", appointment.doctor_id)
      }

      // If a socket instance is provided, emit the appointment accepted event
      if (socketIo && appointment.mother_id) {
        const motherData = await supabase
          .from("mothers")
          .select("id, full_name")
          .eq("id", appointment.mother_id)
          .single()

        if (!motherData.error) {
          socketIo.to(appointment.mother_id).emit("appointment_accepted", {
            appointmentId,
            doctor_id: appointment.doctor_id,
            mother_id: appointment.mother_id,
            mother_name: motherData.data?.full_name || "Patient",
            requested_time: appointment.requested_time,
            video_conference_link: videoLink,
            status: "accepted",
          })
        }
      }
    } else if (status === "declined" && socketIo && data[0].mother_id) {
      // If rejecting and socket instance provided, emit the appointment declined event
      socketIo.to(data[0].mother_id).emit("appointment_declined", {
        appointmentId,
        doctor_id: data[0].doctor_id,
        mother_id: data[0].mother_id,
        status: "declined",
      })
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error(`Error updating appointment status to ${status}:`, error.message)
    return { success: false, error }
  }
}

// Update the saveSocketAppointment function to better handle doctor_id validation
export const saveSocketAppointment = async (appointmentData) => {
  try {
    const { doctor_id, mother_id, requested_time, status, video_conference_link } = appointmentData

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

    // First check if an appointment with the same details already exists
    const { data: existingAppt, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .eq("mother_id", mother_id)
      .eq("requested_time", requested_time)
      .maybeSingle()

    if (checkError) throw checkError

    // If appointment already exists, just return it
    if (existingAppt) {
      console.log("Appointment already exists:", existingAppt)
      return { success: true, data: existingAppt, alreadyExists: true }
    }

    console.log("Creating new appointment with doctor_id:", doctor_id)

    // Otherwise create a new appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        doctor_id,
        mother_id,
        requested_time,
        status: status || "pending",
        video_conference_link,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error
    console.log("Successfully created appointment:", data[0])
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error saving socket appointment:", error.message)
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

// The rest of your functions remain unchanged...
// fetchDoctorAvailability
// updateDoctorAvailability
// addAvailabilitySlot
// deleteAvailabilitySlot
// checkAvailability

