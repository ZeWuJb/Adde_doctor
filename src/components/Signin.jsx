"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { UserAuth } from "../context/AuthContext"
import { Mail, Lock, User, Heart } from "lucide-react"

const Signin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("doctor")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signInUser } = UserAuth()
  const navigate = useNavigate()

  const handleSignin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Starting sign-in process for:", email, role)
      const result = await signInUser(email, password, role)

      if (result.success) {
        console.log("Sign-in successful:", result.data)
        const { role } = result.data
        if (role === "admin") {
          navigate("/admin-dashboard", { replace: true })
        } else if (role === "doctor") {
          navigate("/dashboard", { replace: true })
        } else {
          setError("Unknown user role.")
        }
      } else {
        console.error("Sign-in failed:", result.error)
        setError(result.error.message || "Sign-in failed. Please check your credentials.")
        setLoading(false)
      }
    } catch (err) {
      console.error("Unexpected error during sign-in:", err)
      setError(`An unexpected error occurred: ${err.message}`)
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
          <p className="mt-2 text-sm text-gray-600">Maternal Healthcare Management</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignin}>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 placeholder-gray-500"
              placeholder="Password"
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-pink-600 hover:text-pink-500">
                Forgot your password?
              </a>
            </div>
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </form>

        {/* Sign-up Redirect */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-pink-600 hover:text-pink-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signin
