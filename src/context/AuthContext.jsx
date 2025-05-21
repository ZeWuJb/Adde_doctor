"use client"

import { createContext, useEffect, useState, useContext } from "react"
import PropTypes from "prop-types"
import { supabase } from "../supabaseClient"

const AuthContext = createContext()

// Simple session cache key
const SESSION_CACHE_KEY = "caresync_session"

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Auth effect initialized")

    // Try to get cached session first
    try {
      const cachedSessionStr = localStorage.getItem(SESSION_CACHE_KEY)
      if (cachedSessionStr) {
        const cachedSession = JSON.parse(cachedSessionStr)
        // Check if cached session is still valid
        if (cachedSession.expires_at && new Date(cachedSession.expires_at * 1000) > new Date()) {
          console.log("Using cached session")
          setSession(cachedSession)
        } else {
          localStorage.removeItem(SESSION_CACHE_KEY)
        }
      }
    } catch (err) {
      console.error("Error reading cached session:", err)
      localStorage.removeItem(SESSION_CACHE_KEY)
    }

    const fetchInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error

        if (session) {
          console.log("Initial session found.")
          setSession(session)
          // Cache the session
          localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session))
        } else {
          console.log("No initial session found.")
          setSession(null)
          localStorage.removeItem(SESSION_CACHE_KEY)
        }
      } catch (err) {
        console.error("Error fetching initial session:", err.message)
        setSession(null)
      } finally {
        setLoading(false)
        console.log("Initial loading state set to false")
      }
    }

    fetchInitialSession()

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, { sessionExists: !!newSession })

      if (newSession) {
        console.log("New session detected.")
        setSession(newSession)
        // Cache the session
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(newSession))
      } else {
        console.log("No session found - clearing auth state.")
        setSession(null)
        localStorage.removeItem(SESSION_CACHE_KEY)
      }

      setLoading(false)
      console.log("Loading state set to false after auth change")
    })

    return () => {
      console.log("Cleaning up auth listener...")
      listener.subscription?.unsubscribe()
      console.log("Auth listener unsubscribed")
    }
  }, [])

  const signUpNewUser = async (email, password, role) => {
    try {
      console.log("Attempting to sign up:", email, role)

      // Step 1: Sign up the user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("User data not returned from Supabase")

      const userId = authData.user.id

      // Step 2: Insert user details into the appropriate table
      let insertResult
      if (role === "doctor") {
        console.log("Creating doctor record...")
        insertResult = await supabase.from("doctors").insert({
          full_name: "", // You can add logic to collect the full name during sign-up
          email: email.toLowerCase(),
          type: "doctor",
          user_id: userId,
        })
      } else if (role === "admin") {
        console.log("Creating admin record...")
        insertResult = await supabase.from("admins").insert({
          full_name: "", // You can add logic to collect the full name during sign-up
          email: email.toLowerCase(),
          user_id: userId,
        })
      } else {
        throw new Error("Invalid user role.")
      }

      if (insertResult.error) throw insertResult.error

      // Step 3: Set the session with the role
      const sessionWithRole = { ...authData, role }
      setSession(sessionWithRole)

      // Cache the session
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionWithRole))

      return { success: true, data: sessionWithRole }
    } catch (err) {
      console.error("Sign-up process failed:", err.message)
      return { success: false, error: { message: err.message } }
    }
  }

  const signInUser = async (email, password, role) => {
    try {
      console.log("Attempting to sign in:", email, role)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (authError) throw authError

      // Verify the user's role in the database
      let roleVerified = false

      if (role === "admin") {
        // Check if user exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("user_id", authData.user.id)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          throw adminError
        }

        roleVerified = !!adminData
      } else if (role === "doctor") {
        // Check if user exists in doctors table
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", authData.user.id)
          .single()

        if (doctorError && doctorError.code !== "PGRST116") {
          throw doctorError
        }

        roleVerified = !!doctorData
      }

      if (!roleVerified) {
        throw new Error(`You do not have ${role} access. Please select the correct role or contact an administrator.`)
      }

      // Set role in session
      const sessionWithRole = { ...authData, role }
      setSession(sessionWithRole)

      // Cache the session
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionWithRole))

      return { success: true, data: sessionWithRole }
    } catch (err) {
      console.error("Sign-in process failed:", err.message)
      return { success: false, error: { message: err.message } }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log("Clearing session...")
      setSession(null)
      localStorage.removeItem(SESSION_CACHE_KEY)
      console.log("User signed out successfully.")
      return { success: true }
    } catch (err) {
      console.error("Sign-out failed:", err.message)
      return { success: false, error: { message: err.message } }
    }
  }

  console.log("Rendering AuthContextProvider with state:", {
    sessionExists: !!session,
    loadingState: loading,
    role: session?.role,
  })

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const UserAuth = () => useContext(AuthContext)
