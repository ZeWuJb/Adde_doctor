import { supabase } from "../supabaseClient"

// Fetch doctor profile by user ID
export const fetchDoctorProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from("doctors").select("*").eq("user_id", userId).single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching doctor profile:", error.message)
    return { success: false, error }
  }
}

// Update doctor profile
export const updateDoctorProfile = async (doctorId, profileData) => {
  try {
    const { data, error } = await supabase.from("doctors").update(profileData).eq("id", doctorId).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating doctor profile:", error.message)
    return { success: false, error }
  }
}

// Upload profile image
export const uploadProfileImage = async (userId, file) => {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `profiles/${fileName}`

    const { error: uploadError } = await supabase.storage.from("doctor-profiles").upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from("doctor-profiles").getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error("Error uploading profile image:", error.message)
    return {
      success: false,
      error,
    }
  }
}

