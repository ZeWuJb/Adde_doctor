import { createContext, useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { supabase } from "../supabaseClient"; // Ensure correct import

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  AuthContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const [session, setSession] = useState(undefined); // Use undefined to detect loading state

  // Fetch initial session and listen for changes
  useEffect(() => {
    const fetchInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session fetched:", session);
        setSession(session); // Set session state
      } catch (err) {
        console.error("Error fetching initial session:", err.message);
      }
    };

    fetchInitialSession(); // Load session on mount

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      setSession(newSession);
    });

    return () => listener.subscription?.unsubscribe(); // Cleanup on unmount
  }, []);

  // Sign-up function
  const signUpNewUser = async (email, password, userType = "doctor") => {
    try {
      console.log("Signing up:", email, userType);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (authError) throw new Error(authError.message);

      console.log("Auth successful:", authData);

      let insertResult;
      if (userType === "doctor") {
        insertResult = await supabase.from("doctors").insert({
          email: email.toLowerCase(),
          full_name: "",
          type: "doctor",
          user_id: authData.user.id,
        });
      } else if (userType === "admin") {
        insertResult = await supabase.from("admins").insert({
          email: email.toLowerCase(),
          full_name: "",
          user_id: authData.user.id,
        });
      } else {
        throw new Error("Invalid user type.");
      }

      if (insertResult.error) throw new Error(insertResult.error.message);

      console.log("User registered in DB successfully.");
      return { success: true, data: { ...authData, role: userType } };
    } catch (err) {
      console.error("Sign-up error:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Sign-in function
  const signInUser = async (email, password, role) => {
    try {
      console.log("Signing in:", email, role);
      if (!["doctor", "admin"].includes(role)) throw new Error("Invalid user role.");

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) throw new Error(authError.message);

      console.log("Auth successful:", authData);

      const userId = authData.user.id;
      let userData, queryError;

      if (role === "doctor") {
        ({ data: userData, error: queryError } = await supabase
          .from("doctors")
          .select("id, full_name, email")
          .eq("user_id", userId)
          .single());
      } else if (role === "admin") {
        ({ data: userData, error: queryError } = await supabase
          .from("admins")
          .select("id, full_name, email")
          .eq("user_id", userId)
          .single());
      }

      if (queryError || !userData) throw new Error("User not found in the system.");

      console.log(`Signed in as ${userData.full_name} (${userData.email})`);

      setSession({ ...authData, role, userData });

      return { success: true, data: { ...authData, role, userData } };
    } catch (err) {
      console.error("Sign-in error:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Sign-out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);

      setSession(null);
      console.log("User signed out successfully.");
      return { success: true };
    } catch (err) {
      console.error("Sign-out error:", err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signOut, signInUser }}>
      {session === undefined ? (
        <p>Loading...</p> // Prevents blank screen
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const UserAuth = () => useContext(AuthContext);
