import { supabase } from "../supabaseClient"
import { uploadImage } from "./imageService"

// Fetch all patients for a doctor
export const fetchDoctorPatients = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("mothers")
      .select(`
        id, 
        full_name, 
        email,
        phone_number,
        profile_url,
        date_of_birth,
        address,
        created_at,
        appointments:appointments(
          id,
          requested_time,
          status,
          payment_status
        )
      `)
      .eq("doctor_id", doctorId)
      .order("full_name", { ascending: true })

    if (error) throw error

    // Process the data to add appointment counts
    const processedData = data.map((patient) => ({
      ...patient,
      total_appointments: patient.appointments ? patient.appointments.length : 0,
      completed_appointments: patient.appointments
        ? patient.appointments.filter((a) => a.status === "accepted" && new Date(a.requested_time) < new Date()).length
        : 0,
    }))

    return { success: true, data: processedData }
  } catch (error) {
    console.error("Error fetching patients:", error.message)
    return { success: false, error }
  }
}

// Fetch a single patient by ID
export const fetchPatientById = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from("mothers")
      .select(`
        id, 
        full_name, 
        email,
        phone_number,
        profile_url,
        date_of_birth,
        address,
        medical_history,
        allergies,
        created_at,
        appointments:appointments(
          id,
          requested_time,
          status,
          payment_status,
          notes,
          video_conference_link
        )
      `)
      .eq("id", patientId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching patient:", error.message)
    return { success: false, error }
  }
}

// Add a new patient
export const addPatient = async (doctorId, patientData) => {
  try {
    const { data, error } = await supabase
      .from("mothers")
      .insert({
        ...patientData,
        doctor_id: doctorId,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error adding patient:", error.message)
    return { success: false, error }
  }
}

// Update a patient
export const updatePatient = async (patientId, patientData) => {
  try {
    const { data, error } = await supabase.from("mothers").update(patientData).eq("id", patientId).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating patient:", error.message)
    return { success: false, error }
  }
}

// Upload patient profile image
export const uploadPatientImage = async (patientId, file) => {
  try {
    const { success, url, error } = await uploadImage(file, "patient-profiles", "patient-profiles", patientId)

    if (!success) throw error

    // Update the patient record with the new profile URL
    const { error: updateError } = await supabase.from("mothers").update({ profile_url: url }).eq("id", patientId)

    if (updateError) throw updateError

    return {
      success: true,
      url: url,
    }
  } catch (error) {
    console.error("Error uploading patient image:", error.message)
    return {
      success: false,
      error,
    }
  }
}
