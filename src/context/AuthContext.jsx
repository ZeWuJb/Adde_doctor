"use client";

import { createContext, useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth effect initialized");

    const fetchInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          console.log("Initial session found.");
          setSession(session);
        } else {
          console.log("No initial session found.");
          setSession(null);
        }
      } catch (err) {
        console.error("Error fetching initial session:", err.message);
        setSession(null);
      } finally {
        setLoading(false);
        console.log("Initial loading state set to false");
      }
    };

    fetchInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, { sessionExists: !!newSession });

      if (newSession) {
        console.log("New session detected.");
        setSession(newSession);
      } else {
        console.log("No session found - clearing auth state.");
        setSession(null);
      }

      setLoading(false);
      console.log("Loading state set to false after auth change");
    });

    return () => {
      console.log("Cleaning up auth listener...");
      listener.subscription?.unsubscribe();
      console.log("Auth listener unsubscribed");
    };
  }, []);

  const signUpNewUser = async (email, password, role) => {
    try {
      console.log("Attempting to sign up:", email, role);
  
      // Step 1: Sign up the user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });
  
      if (authError) throw authError;
      if (!authData.user) throw new Error("User data not returned from Supabase");
  
      const userId = authData.user.id;
  
      // Step 2: Insert user details into the appropriate table
      let insertResult;
      if (role === "doctor") {
        console.log("Creating doctor record...");
        insertResult = await supabase.from("doctors").insert({
          full_name: "", // You can add logic to collect the full name during sign-up
          email: email.toLowerCase(),
          type: "doctor",
          user_id: userId,
        });
      } else if (role === "admin") {
        console.log("Creating admin record...");
        insertResult = await supabase.from("admins").insert({
          full_name: "", // You can add logic to collect the full name during sign-up
          email: email.toLowerCase(),
          user_id: userId,
        });
      } else {
        throw new Error("Invalid user role.");
      }
  
      if (insertResult.error) throw insertResult.error;
  
      // Step 3: Set the session with the role
      const sessionWithRole = { ...authData, role };
      setSession(sessionWithRole);
  
      return { success: true, data: sessionWithRole };
    } catch (err) {
      console.error("Sign-up process failed:", err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  const signInUser = async (email, password, role) => {
    try {
      console.log("Attempting to sign in:", email, role);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) throw authError;

      // Set role in session
      const sessionWithRole = { ...authData, role };
      setSession(sessionWithRole);

      return { success: true, data: sessionWithRole };
    } catch (err) {
      console.error("Sign-in process failed:", err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("Clearing session...");
      setSession(null);
      console.log("User signed out successfully.");
      return { success: true };
    } catch (err) {
      console.error("Sign-out failed:", err.message);
      return { success: false, error: { message: err.message } };
    }
  };

  console.log("Rendering AuthContextProvider with state:", { sessionExists: !!session, loadingState: loading });

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const UserAuth = () => useContext(AuthContext);