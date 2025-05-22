/**
 * Utility functions for image handling
 */

// Convert a file to base64 string
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Check if a string is a valid base64 image
export const isBase64Image = (str) => {
  if (!str) return false

  // Check if it's a data URL
  if (str.startsWith("data:image")) {
    return true
  }

  // Check if it's a raw base64 string
  try {
    // Regular expression to check base64 format
    const regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
    return regex.test(str)
  } catch (e) {
    console.error("Error checking base64 image:", e)
    return false
  }
}

// Resize an image file to specified dimensions
export const resizeImage = async (file, maxWidth = 300, maxHeight = 300) => {
  return new Promise((resolve, reject) => {
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
  })
}

// Validate image file (type and size)
export const validateImage = (file, maxSizeKB = 500) => {
  // Check if file is an image
  if (!file.type.match("image.*")) {
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
