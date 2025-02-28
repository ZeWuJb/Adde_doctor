import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor"); // Default role is "doctor"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Use boolean for loading state
  const { session, signUpNewUser } = UserAuth(); 
  console.log(session);// Get signUpNewUser from context
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading

    try {
      // Call signUpNewUser with email, password, and selected role
      const result = await signUpNewUser(email, password, role);

      if (result.success) {
        navigate("/signin"); // Redirect to sign-in page after successful sign-up
      } else {
        setError(result.error.message || "Sign-up failed."); // Show error message
      }
    } catch (err) {
      setError("An unexpected error occurred.",err); // Handle unexpected errors
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div>
      <form onSubmit={handleSignUp} className="max-w-md m-auto pt-24">
        <h2 className="font-bold pb-2">Signup</h2>
        <div className="flex flex-col py-4">
          {/* Email Input */}
          <input
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 mt-6"
            type="email"
            required
          />
          {/* Password Input */}
          <input
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="p-3 mt-6"
            type="password"
            required
          />
          {/* Role Selection Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-3 mt-6"
            required
          >
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          {/* Submit Button */}
          <button type="submit" disabled={loading} className="mt-6 w-full">
            {loading ? "Signing up..." : "Sign up"} {/* Show loading text */}
          </button>
          {/* Error Message */}
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
        {/* Link to Sign In */}
        <p className="mt-6">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;