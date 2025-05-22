import { supabase } from "../supabaseClient"

/**
 * Uploads an image to Supabase storage and returns the public URL
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - The folder path within the bucket
 * @param {string} id - The unique identifier for the file (user ID, doctor ID, etc.)
 * @returns {Promise<{success: boolean, url?: string, error?: any}>}
 */
export const uploadImage = async (file, bucket, folder, id) => {
  try {
    if (!file) {
      throw new Error("No file provided")
    }

    // Validate file type
    const fileExt = file.name.split(".").pop().toLowerCase()
    const allowedTypes = ["jpg", "jpeg", "png", "gif", "webp"]

    if (!allowedTypes.includes(fileExt)) {
      throw new Error("Invalid file type. Only images are allowed.")
    }

    // Create a unique file name
    const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error("Error uploading image:", error.message)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Converts an image file to base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Uploads an image as base64 string to the database
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, base64?: string, error?: any}>}
 */
export const imageToBase64 = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided")
    }

    // Convert file to base64
    const base64String = await fileToBase64(file)

    return {
      success: true,
      base64: base64String,
    }
  } catch (error) {
    console.error("Error converting image to base64:", error.message)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Deletes an image from Supabase storage
 * @param {string} url - The public URL of the image to delete
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const deleteImage = async (url, bucket) => {
  try {
    if (!url) return { success: true }

    // Extract the file path from the URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join("/")

    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error.message)
    return {
      success: false,
      error,
    }
  }
}
