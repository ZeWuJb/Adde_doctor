import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor"); // Default role is "doctor"
  const [error, setError] = useState(null); // Use null for error state
  const [loading, setLoading] = useState(false); // Boolean for loading state
  const { session, signInUser } = UserAuth(); // Get signInUser from context
  console.log(session);
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
  
    try {
      // Call signInUser with email, password, and selected role
      const result = await signInUser(email, password, role);
  
      if (result.success) {
        // Redirect based on the role
        const { role } = result.data;
        if (role === "admin") {
          navigate("/admin-dashboard", { replace: true }); // Redirect admin to admin dashboard
        } else if (role === "doctor") {
          navigate("/dashboard", { replace: true }); // Redirect doctor to doctor dashboard
        } else {
          setError("Unknown user role."); // Handle unexpected roles
        }
      } else {
        setError(result.error.message || "Sign-in failed."); // Show error message
      }
    } catch (err) {
      // Log the error for debugging
      console.error("Unexpected error during sign-in:", err.message, "Stack trace:", err.stack);
  
      // Pass only a single argument to setError
      setError(`An unexpected error occurred: ${err.message}`); 
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSignin} className="max-w-md w-full p-8 bg-white shadow-md rounded-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        <div className="mb-4">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          {/* Role Selection Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
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
          className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        {/* Error Message */}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        {/* Link to Signup */}
        <p className="mt-4 text-center">
          Don`t have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;