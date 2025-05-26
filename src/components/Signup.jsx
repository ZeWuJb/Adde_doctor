"use client"

import { Link } from "react-router-dom"
import { Heart } from "lucide-react"

const Signup = () => {
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
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Account creation is currently disabled. Please contact the administrator at{" "}
              <a href="mailto:devgroup020@gmail.com" className="font-medium text-pink-600 hover:text-pink-500">
                devgroup020@gmail.com
              </a>{" "}
              to request an account.
            </p>
          </div>
        </div>

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
