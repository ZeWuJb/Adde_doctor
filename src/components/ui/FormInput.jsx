"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react"
import PropTypes from "prop-types"

const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  validation,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [touched, setTouched] = useState(false)

  // Real-time validation
  useEffect(() => {
    if (!touched && !value) return

    if (required && !value) {
      setError(`${label} is required`)
      setIsValid(false)
      return
    }

    if (validation && value) {
      const validationResult = validation(value)
      if (validationResult === true) {
        setError("")
        setIsValid(true)
      } else {
        setError(validationResult)
        setIsValid(false)
      }
    } else if (value) {
      setError("")
      setIsValid(true)
    } else {
      setError("")
      setIsValid(false)
    }
  }, [value, validation, required, label, touched])

  const handleBlur = () => {
    setTouched(true)
  }

  const handleChange = (e) => {
    setTouched(true)
    onChange(e)
  }

  const inputType = type === "password" && showPassword ? "text" : type

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm text-gray-800
            ${Icon ? "pl-10" : ""}
            ${type === "password" ? "pr-12" : "pr-4"}
            ${
              error && touched
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : isValid && touched
                  ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                  : "border-gray-200 focus:border-pink-500 focus:ring-pink-500"
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder-gray-400
          `}
          {...props}
        />

        {/* Password toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Validation icons */}
        {touched && type !== "password" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : isValid ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && touched && (
        <div className="flex items-center space-x-1 text-red-600 text-sm animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {isValid && touched && !error && (
        <div className="flex items-center space-x-1 text-green-600 text-sm animate-in slide-in-from-top-1 duration-200">
          <Check className="w-4 h-4" />
          <span>Looks good!</span>
        </div>
      )}
    </div>
  )
}

FormInput.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType,
  validation: PropTypes.func,
  className: PropTypes.string,
}

export default FormInput
