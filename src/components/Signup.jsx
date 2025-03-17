"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { UserAuth } from "../context/AuthContext"
import { Mail, Lock, User, Heart } from "lucide-react"

const Signup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("doctor")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUpNewUser } = UserAuth()
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()

    if (!fullName.trim()) {
      setError("Please enter your full name")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await signUpNewUser(email, password, role)

      if (result.success) {
        console.log("Sign-up successful:", result.data)
        navigate("/signin")
      } else {
        console.error("Sign-up failed:", result.error)
        setError(result.error.message || "Sign-up failed. Please try again.")
      }
    } catch (err) {
      console.error("Unexpected error during sign-up:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 shadow-xl rounded-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-pink-100">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">CareSync</h2>
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {/* Full Name Input */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              id="full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 placeholder-gray-500"
              placeholder="Full name"
            />
          </div>

          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 placeholder-gray-500"
              placeholder="Email address"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 placeholder-gray-500"
              placeholder="Password (min. 6 characters)"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
              required
            >
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </form>

        {/* Sign-in Redirect */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="font-medium text-pink-600 hover:text-pink-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup

