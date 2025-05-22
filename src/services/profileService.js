import { supabase } from "../supabaseClient"
import { uploadImageAsBase64 } from "./imageService"

/**
 * Unified profile service for all user types (admin, doctor, mother)
 */

/**
 * Fetch a doctor profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
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

/**
 * Fetch a doctor by ID
 * @param {string} doctorId - The doctor ID
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
export const fetchDoctorById = async (doctorId) => {
  try {
    const { data, error } = await supabase.from("doctors").select("*").eq("id", doctorId).single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching doctor:", error.message)
    return { success: false, error }
  }
}

/**
 * Update a doctor profile
 * @param {string} doctorId - The doctor ID
 * @param {object} profileData - The profile data to update
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
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

/**
 * Upload a doctor profile image
 * @param {string} doctorId - The doctor ID
 * @param {File} file - The image file
 * @returns {Promise<{success: boolean, url?: string, error?: Error}>}
 */
export const uploadDoctorImage = async (doctorId, file) => {
  try {
    const { success, base64, error } = await uploadImageAsBase64(file)
    if (!success) throw error

    // Update the doctor record with the base64 image
    const { error: updateError } = await supabase.from("doctors").update({ profile_url: base64 }).eq("id", doctorId)

    if (updateError) throw updateError

    return { success: true, url: base64 }
  } catch (error) {
    console.error("Error uploading doctor image:", error.message)
    return { success: false, error }
  }
}

/**
 * Fetch an admin profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
export const fetchAdminProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from("admins").select("*").eq("user_id", userId).single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching admin profile:", error.message)
    return { success: false, error }
  }
}

/**
 * Update an admin profile
 * @param {string} adminId - The admin ID
 * @param {object} profileData - The profile data to update
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
export const updateAdminProfile = async (adminId, profileData) => {
  try {
    const { data, error } = await supabase.from("admins").update(profileData).eq("id", adminId).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating admin profile:", error.message)
    return { success: false, error }
  }
}

/**
 * Upload an admin profile image
 * @param {string} adminId - The admin ID
 * @param {File} file - The image file
 * @returns {Promise<{success: boolean, url?: string, error?: Error}>}
 */
export const uploadAdminImage = async (adminId, file) => {
  try {
    const { success, base64, error } = await uploadImageAsBase64(file)
    if (!success) throw error

    // Update the admin record with the base64 image
    const { error: updateError } = await supabase.from("admins").update({ profile_url: base64 }).eq("id", adminId)

    if (updateError) throw updateError

    return { success: true, url: base64 }
  } catch (error) {
    console.error("Error uploading admin image:", error.message)
    return { success: false, error }
  }
}

/**
 * Fetch a mother profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
export const fetchMotherProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from("mothers").select("*").eq("user_id", userId).single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching mother profile:", error.message)
    return { success: false, error }
  }
}

/**
 * Update a mother profile
 * @param {string} userId - The user ID (primary key for mothers)
 * @param {object} profileData - The profile data to update
 * @returns {Promise<{success: boolean, data?: object, error?: Error}>}
 */
export const updateMotherProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase.from("mothers").update(profileData).eq("user_id", userId).select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating mother profile:", error.message)
    return { success: false, error }
  }
}

/**
 * Upload a mother profile image
 * @param {string} userId - The user ID (primary key for mothers)
 * @param {File} file - The image file
 * @returns {Promise<{success: boolean, url?: string, error?: Error}>}
 */
export const uploadMotherImage = async (userId, file) => {
  try {
    const { success, base64, error } = await uploadImageAsBase64(file)
    if (!success) throw error

    // Update the mother record with the base64 image
    const { error: updateError } = await supabase.from("mothers").update({ profile_url: base64 }).eq("user_id", userId)

    if (updateError) throw updateError

    return { success: true, url: base64 }
  } catch (error) {
    console.error("Error uploading mother image:", error.message)
    return { success: false, error }
  }
}

/**
 * Format a date string for display
 * @param {string} dateString - The date string to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} - The formatted date string
 */
export const formatDate = (dateString, fallback = "Not available") => {
  if (!dateString) return fallback

  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return fallback

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return fallback
  }
}

/**
 * Format a currency value for display
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The currency code
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount, currency = "USD") => {
  try {
    const numAmount = Number(amount || 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numAmount)
  } catch (error) {
    console.error("Error formatting currency:", error)
    return `$0.00`
  }
}
