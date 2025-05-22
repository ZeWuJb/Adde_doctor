import { supabase } from "../supabaseClient"
import { uploadImage, imageToBase64 } from "./imageService"

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

// Replace the uploadProfileImage function
export const uploadProfileImage = async (userId, file) => {
  try {
    const { success, url, error } = await uploadImage(file, "doctor-profiles", "profiles", userId)

    if (!success) throw error

    // Update the doctor record with the new profile URL
    const { error: updateError } = await supabase.from("doctors").update({ profile_url: url }).eq("user_id", userId)

    if (updateError) throw updateError

    return {
      success: true,
      url: url,
    }
  } catch (error) {
    console.error("Error uploading profile image:", error.message)
    return {
      success: false,
      error,
    }
  }
}

// Add this function to store images as base64 in the database
export const uploadBase64ProfileImage = async (userId, file) => {
  try {
    const { success, base64, error } = await imageToBase64(file)

    if (!success) throw error

    // Update the doctor record with the base64 image data
    const { error: updateError } = await supabase
      .from("doctors")
      .update({ profile_image_base64: base64 })
      .eq("user_id", userId)

    if (updateError) throw updateError

    return {
      success: true,
      base64: base64,
    }
  } catch (error) {
    console.error("Error uploading base64 profile image:", error.message)
    return {
      success: false,
      error,
    }
  }
}
