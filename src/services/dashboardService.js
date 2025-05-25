import { supabase } from "../supabaseClient"

// Fetch doctor statistics
export const fetchDoctorStatistics = async (doctorId) => {
  try {
    // Get total consultations count
    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("consultations_given")
      .eq("id", doctorId)
      .single()

    if (doctorError) throw doctorError

    // Get appointments statistics
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, requested_time, status, payment_status")
      .eq("doctor_id", doctorId)

    if (appointmentsError) throw appointmentsError

    // Get unique patients count
    const { data: uniquePatients, error: patientsError } = await supabase
      .from("appointments")
      .select("mother_id")
      .eq("doctor_id", doctorId)

    if (patientsError) throw patientsError

    // Calculate statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysAppointments = appointments.filter((a) => {
      const appointmentDate = new Date(a.requested_time)
      return appointmentDate >= today && appointmentDate < tomorrow
    })

    const pendingAppointments = appointments.filter((a) => a.status === "pending")

    const completedSessions = appointments.filter(
      (a) => a.status === "accepted" && new Date(a.requested_time) < new Date(),
    )

    const upcomingAppointments = appointments
      .filter((a) => a.status === "accepted" && new Date(a.requested_time) > new Date())
      .sort((a, b) => new Date(a.requested_time) - new Date(b.requested_time))

    // Get unique patient count
    const uniquePatientCount = new Set(uniquePatients.map((p) => p.mother_id)).size

    // Get next appointment with mother data
    let nextAppointmentWithMother = null
    if (upcomingAppointments.length > 0) {
      const { data: nextAppointmentData, error: nextAppointmentError } = await supabase
        .from("appointments")
        .select(`
          id, 
          requested_time, 
          status, 
          payment_status,
          video_conference_link,
          mothers:mother_id (
            user_id , 
            full_name, 
            profile_url
          )
        `)
        .eq("id", upcomingAppointments[0].id)
        .single()

      if (!nextAppointmentError && nextAppointmentData) {
        nextAppointmentWithMother = nextAppointmentData
      }
    }

    return {
      success: true,
      data: {
        consultationsGiven: doctorData.consultations_given || 0,
        totalAppointments: appointments.length,
        todaysAppointments: todaysAppointments.length,
        pendingAppointments: pendingAppointments.length,
        completedSessions: completedSessions.length,
        uniquePatients: uniquePatientCount,
        upcomingAppointments: upcomingAppointments,
        nextAppointment: nextAppointmentWithMother,
      },
    }
  } catch (error) {
    console.error("Error fetching doctor statistics:", error.message)
    return { success: false, error }
  }
}

// Update consultation count
export const updateConsultationCount = async (doctorId, increment = 1) => {
  try {
    // First get current count
    const { data: doctor, error: fetchError } = await supabase
      .from("doctors")
      .select("consultations_given")
      .eq("id", doctorId)
      .single()

    if (fetchError) throw fetchError

    const currentCount = doctor.consultations_given || 0
    const newCount = currentCount + increment

    // Update the count
    const { data, error } = await supabase
      .from("doctors")
      .update({ consultations_given: newCount })
      .eq("id", doctorId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating consultation count:", error.message)
    return { success: false, error }
  }
}

// Fetch recent activity
export const fetchRecentActivity = async (doctorId, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        requested_time, 
        status, 
        payment_status,
        updated_at,
        mothers:mother_id (
          user_id , 
          full_name, 
          profile_url
        )
      `)
      .eq("doctor_id", doctorId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching recent activity:", error.message)
    return { success: false, error }
  }
}
