"use client"

import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { UserAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"
import { Mail, Lock, Shield, Users, Activity } from "lucide-react"
import FormInput from "./ui/FormInput"
import { emailValidation, passwordValidation } from "../utils/validation"
import PropTypes from "prop-types"

const PregnantMotherIcon = ({ className = "w-8 h-8", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="3" fill={color} />
    <path
      d="M12 10c-2.5 0-4.5 1.5-4.5 3.5v2c0 1.5 1 3 2.5 3.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M12 10c2.5 0 4.5 1.5 4.5 3.5v2c0 1.5-1 3-2.5 3.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx="12" cy="15" rx="3" ry="2.5" fill={color} opacity="0.8" />
    <path
      d="M8.5 12c-1 0-1.5 0.5-1.5 1.5s0.5 1.5 1.5 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M15.5 12c1 0 1.5 0.5 1.5 1.5s-0.5 1.5-1.5 1.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M10 19v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 19v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

PregnantMotherIcon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
}

const Signin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signInUser } = UserAuth()
  const navigate = useNavigate()

  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [forgotFormData, setForgotFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  })
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleForgotInputChange = (e) => {
    const { name, value } = e.target
    setForgotFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signInUser(formData.email, formData.password)

      if (result.success) {
        const { role } = result.data
        if (role === "admin") {
          navigate("/admin-dashboard", { replace: true })
        } else if (role === "doctor") {
          navigate("/dashboard", { replace: true })
        } else {
          setError("Unknown user role.")
        }
      } else {
        setError(result.error.message || "Sign-in failed. Please check your credentials.")
        setLoading(false)
      }
    } catch (err) {
      setError(`An unexpected error occurred: ${err.message}`)
      setLoading(false)
    }
  }

  const sendPasswordResetOTP = async () => {
    if (!forgotFormData.email.trim()) {
      setForgotError("Please enter your email address")
      return
    }

    setForgotLoading(true)
    setForgotError("")
    setForgotSuccess("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: forgotFormData.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) throw error

      setIsEmailSent(true)
      setForgotSuccess(`OTP sent to ${forgotFormData.email}. Please check your email.`)
    } catch (err) {
      setForgotError(err.message || "Failed to send reset email. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  const verifyOTPAndUpdatePassword = async () => {
    if (!forgotFormData.otp.trim() || !forgotFormData.newPassword.trim()) {
      setForgotError("Please enter both OTP and new password")
      return
    }

    setForgotLoading(true)
    setForgotError("")
    setForgotSuccess("")

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: forgotFormData.email.trim().toLowerCase(),
        token: forgotFormData.otp.trim(),
        type: "email",
      })

      if (verifyError) throw verifyError

      if (authData.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: forgotFormData.newPassword,
        })

        if (updateError) throw updateError

        setForgotSuccess("Password updated successfully! You can now sign in with your new password.")

        setTimeout(() => {
          handleCloseForgotPasswordModal()
          setFormData((prev) => ({ ...prev, email: forgotFormData.email }))
        }, 2000)
      }
    } catch (err) {
      setForgotError(err.message || "Failed to verify OTP or update password. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotPasswordClick = () => {
    setShowForgotPasswordModal(true)
    setForgotFormData((prev) => ({ ...prev, email: formData.email }))
  }

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    setForgotFormData({ email: "", otp: "", newPassword: "" })
    setIsEmailSent(false)
    setForgotLoading(false)
    setForgotError("")
    setForgotSuccess("")
  }

  return (
    <>
      <style>
        {`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Health Information */}
          <div className="hidden lg:block space-y-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-6">
                <PregnantMotherIcon className="w-10 h-10" color="white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  CareSync
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">Comprehensive Maternal Healthcare Management Platform</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-pink-100">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                  <p className="text-gray-600 text-sm">HIPAA compliant healthcare data protection</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Expert Care Team</h3>
                  <p className="text-gray-600 text-sm">Connect with certified maternal health specialists</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Monitoring</h3>
                  <p className="text-gray-600 text-sm">Track health metrics and pregnancy progress</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-pink-100">
                <div className="text-2xl font-bold text-pink-600">500+</div>
                <div className="text-sm text-gray-600">Happy Mothers</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">50+</div>
                <div className="text-sm text-gray-600">Expert Doctors</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                <div className="text-sm text-gray-600">Care Support</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
                  <PregnantMotherIcon className="w-8 h-8" color="white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your healthcare account</p>
              </div>

              <form onSubmit={handleSignin} className="space-y-6">
                <FormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  icon={Mail}
                  validation={emailValidation}
                />

                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  icon={Lock}
                  validation={passwordValidation}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm font-medium text-pink-600 hover:text-pink-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don`t have an account? <span className="font-medium text-pink-600">Contact Admin</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Email: devgroup020@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={handleCloseForgotPasswordModal}
              ></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-pink-100 mb-4">
                      <Lock className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      {isEmailSent ? "Enter OTP & New Password" : "Reset Your Password"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      {isEmailSent
                        ? "Enter the OTP sent to your email and your new password"
                        : "We'll send you an OTP to reset your password"}
                    </p>
                  </div>

                  {forgotSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">{forgotSuccess}</p>
                    </div>
                  )}

                  {forgotError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{forgotError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormInput
                      label="Email Address"
                      type="email"
                      name="email"
                      value={forgotFormData.email}
                      onChange={handleForgotInputChange}
                      placeholder="Enter your email address"
                      disabled={isEmailSent}
                      required
                      icon={Mail}
                      validation={emailValidation}
                    />

                    {isEmailSent && (
                      <>
                        <FormInput
                          label="OTP Code"
                          type="text"
                          name="otp"
                          value={forgotFormData.otp}
                          onChange={handleForgotInputChange}
                          placeholder="Enter 6-digit OTP"
                          required
                          validation={(value) => {
                            if (value.length !== 6) return "OTP must be 6 digits"
                            if (!/^\d+$/.test(value)) return "OTP must contain only numbers"
                            return true
                          }}
                        />

                        <FormInput
                          label="New Password"
                          type="password"
                          name="newPassword"
                          value={forgotFormData.newPassword}
                          onChange={handleForgotInputChange}
                          placeholder="Enter new password (min 6 characters)"
                          required
                          icon={Lock}
                          validation={passwordValidation}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={isEmailSent ? verifyOTPAndUpdatePassword : sendPasswordResetOTP}
                    disabled={forgotLoading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isEmailSent ? "Updating..." : "Sending..."}
                      </>
                    ) : isEmailSent ? (
                      "Update Password"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForgotPasswordModal}
                    disabled={forgotLoading}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Signin
