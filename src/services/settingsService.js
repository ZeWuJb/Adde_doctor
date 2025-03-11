import { supabase } from "../supabaseClient"

// Fetch doctor settings
export const fetchDoctorSettings = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("doctor_settings")
      .select("*")
      .eq("doctor_id", doctorId)
      .single()

    if (error) {
      // If no settings found, create default settings
      if (error.code === 'PGRST116') {
        return await createDefaultSettings(doctorId)
      }
      throw error
    }
    
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching doctor settings:", error.message)
    return { success: false, error }
  }
}

// Create default settings for a doctor
const createDefaultSettings = async (doctorId) => {
  try {
    const defaultSettings = {
      doctor_id: doctorId,
      notification_email: true,
      notification_sms: false,
      notification_app: true,
      appointment_reminder_hours: 24,
      theme: 'light',
      language: 'en',
      time_zone: 'UTC',
      calendar_view: 'week',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("doctor_settings")
      .insert(defaultSettings)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error creating default settings:", error.message)
    return { success: false, error }
  }
}

// Update doctor settings
export const updateDoctorSettings = async (doctorId, settings) => {
  try {
    const updatedSettings = {
      ...settings,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("doctor_settings")
      .update(updatedSettings)
      .eq("doctor_id", doctorId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating doctor settings:", error.message)
    return { success: false, error }
  }
}

// Update doctor password
export const updateDoctorPassword = async (currentPassword, newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error updating password:", error.message)
    return { success: false, error }
  }
}
