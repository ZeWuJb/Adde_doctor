// Validation utility functions
export const emailValidation = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }
  return ""
}

export const passwordValidation = (password) => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long"
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return "Password must contain at least one lowercase letter"
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return "Password must contain at least one uppercase letter"
  }
  if (!/(?=.*\d)/.test(password)) {
    return "Password must contain at least one number"
  }
  return ""
}

export const nameValidation = (name) => {
  if (!name || name.trim().length === 0) {
    return "Name is required"
  }
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long"
  }
  if (name.trim().length > 50) {
    return "Name must be less than 50 characters"
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
    return "Name can only contain letters, spaces, periods, apostrophes, and hyphens"
  }
  return ""
}

export const validateName = (name) => {
  return nameValidation(name)
}

export const validateDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return "Description is required"
  }
  if (description.trim().length < 10) {
    return "Description must be at least 10 characters long"
  }
  if (description.trim().length > 500) {
    return "Description must be less than 500 characters"
  }
  return ""
}

export const phoneValidation = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    return "Please enter a valid phone number"
  }
  return ""
}

export const numberValidation = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const num = Number.parseFloat(value)
  if (isNaN(num)) {
    return "Please enter a valid number"
  }
  if (num < min) {
    return `Value must be at least ${min}`
  }
  if (num > max) {
    return `Value must be at most ${max}`
  }
  return ""
}

export const requiredValidation = (value, fieldName) => {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`
  }
  return ""
}

export const confirmPasswordValidation = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return "Passwords do not match"
  }
  return ""
}
