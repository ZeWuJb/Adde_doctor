/**
 * Comprehensive image handling service for the application
 * Handles image uploads, validation, and conversion for all user types
 */

/**
 * Checks if a string is a valid base64 image
 * @param {string} str - The string to check
 * @returns {boolean} - Whether the string is a valid base64 image
 */
export const isBase64Image = (str) => {
  if (!str) return false

  try {
    // If it's already a data URL, return true
    if (str.startsWith("data:image")) {
      return true
    }

    // Check if it's a valid base64 string (without data:image prefix)
    // This is a simple check - in production you might want more validation
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/
    return base64Regex.test(str)
  } catch (e) {
    // If there's any error, it's not a valid base64 string
    console.error("Error checking base64 image:", e)
    return false
  }
}

/**
 * Gets a proper image source URL from various formats
 * @param {string} profileUrl - The profile URL or base64 data
 * @param {string} placeholder - The placeholder image URL
 * @returns {string} - The proper image source URL
 */
export const getImageSrc = (profileUrl, placeholder = "/placeholder.svg?height=40&width=40") => {
  if (!profileUrl) return placeholder

  try {
    // If it's already a data URL (starts with data:image), return it directly
    if (profileUrl.startsWith("data:image")) {
      return profileUrl
    }

    // If it's a URL (starts with http or https), return it directly
    if (profileUrl.startsWith("http")) {
      return profileUrl
    }

    // If it's a base64 string without the data URL prefix, add it
    if (isBase64Image(profileUrl)) {
      return `data:image/jpeg;base64,${profileUrl}`
    }

    // If none of the above, return the placeholder
    return placeholder
  } catch (error) {
    console.error("Error processing image source:", error)
    return placeholder
  }
}

/**
 * Uploads an image file and returns it as a base64 string
 * @param {File} file - The file to upload
 * @param {number} maxSizeKB - Maximum file size in KB
 * @returns {Promise<{success: boolean, base64?: string, error?: Error}>} - Result object
 */
export const uploadImageAsBase64 = async (file, maxSizeKB = 500) => {
  try {
    // Validate file
    if (!file || !file.type.startsWith("image/")) {
      return {
        success: false,
        error: new Error("Invalid file type. Please upload an image."),
      }
    }

    // Check file size
    if (file.size > maxSizeKB * 1024) {
      return {
        success: false,
        error: new Error(`Image size exceeds ${maxSizeKB}KB limit`),
      }
    }

    // Convert to base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error("Failed to read image file"))
      reader.readAsDataURL(file)
    })

    const base64Image = await base64Promise

    return {
      success: true,
      base64: base64Image,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error,
    }
  }
}

/**
 * Validates an image file
 * @param {File} file - The file to validate
 * @param {number} maxSizeKB - Maximum file size in KB
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export const validateImage = (file, maxSizeKB = 500) => {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: "No file selected",
    }
  }

  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "Please select an image file (JPEG, PNG, etc.)",
    }
  }

  // Check file size
  if (file.size > maxSizeKB * 1024) {
    return {
      valid: false,
      error: `Image size exceeds ${maxSizeKB}KB limit`,
    }
  }

  return { valid: true }
}

/**
 * Resizes an image file to specified dimensions
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<File>} - The resized image file
 */
export const resizeImage = async (file, maxWidth = 300, maxHeight = 300) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: file.type }))
        }, file.type)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
    } catch (error) {
      reject(error)
    }
  })
}
