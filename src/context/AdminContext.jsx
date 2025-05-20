"use client"

import { createContext, useState, useEffect, useCallback } from "react"
import PropTypes from "prop-types"
import { supabase } from "../supabaseClient"
import { UserAuth } from "./AuthContext"

// Create the context
export const AdminContext = createContext()

export const AdminContextProvider = ({ children }) => {
  const { session } = UserAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Admin data states
  const [adminData, setAdminData] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [articles, setArticles] = useState([])
  const [roles, setRoles] = useState([])
  const [stats, setStats] = useState({
    doctorsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    articlesCount: 0,
  })
  const [systemStatus, setSystemStatus] = useState({
    database: { status: "healthy", latency: 45, uptime: 99.98 },
    api: { status: "healthy", latency: 120, uptime: 99.95 },
    storage: { status: "healthy", usage: 68, total: 500 },
    auth: { status: "healthy", activeUsers: 42, totalUsers: 189 },
  })

  // Fetch admin profile data
  const fetchAdminData = async () => {
    if (!session || !session.user) return

    try {
      const { data, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (adminError) {
        console.error("Error fetching admin data:", adminError.message)
      } else {
        setAdminData(data)
      }
    } catch (err) {
      console.error("Error in fetchAdminData:", err.message)
    }
  }

  // Fetch doctors data
  const fetchDoctors = async () => {
    try {
      // Fetch doctors from Supabase
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false })

      if (doctorsError) throw doctorsError

      // Get appointment counts for each doctor
      const doctorsWithCounts = await Promise.all(
        doctorsData.map(async (doctor) => {
          // Get appointment count
          const { count: appointmentsCount, error: appointmentsError } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)

          if (appointmentsError) {
            console.error("Error fetching appointment count:", appointmentsError.message)
          }

          // Get unique patient count
          const { data: uniquePatients, error: patientsError } = await supabase
            .from("appointments")
            .select("mother_id")
            .eq("doctor_id", doctor.id)

          if (patientsError) {
            console.error("Error fetching patient count:", patientsError.message)
          }

          const uniquePatientCount = uniquePatients ? new Set(uniquePatients.map((p) => p.mother_id)).size : 0

          return {
            id: doctor.id,
            name: doctor.full_name,
            specialty: doctor.speciality || "General",
            email: doctor.email,
            phone: doctor.phone_number || "N/A",
            patients: uniquePatientCount,
            appointments: appointmentsCount || 0,
            joinDate: doctor.created_at,
            status: doctor.status || "Active",
            avatar: doctor.profile_url || "https://randomuser.me/api/portraits/men/32.jpg",
          }
        }),
      )

      setDoctors(doctorsWithCounts)
    } catch (err) {
      console.error("Error fetching doctors:", err.message)
      setError("Failed to fetch doctors data. Please try again later.")
    }
  }

  // Fetch patients data
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase.from("mothers").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPatients(data)
    } catch (err) {
      console.error("Error fetching patients:", err.message)
      setError("Failed to fetch patients. Please try again later.")
    }
  }

  // Fetch appointments data
  const fetchAppointments = async () => {
    try {
      // Fetch appointments from Supabase
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id, 
          requested_time, 
          status, 
          payment_status,
          video_conference_link,
          doctors:doctor_id (
            id,
            full_name,
            speciality,
            profile_url
          ),
          mothers:mother_id (
            user_id,
            full_name,
            profile_url
          )
        `)
        .order("requested_time", { ascending: false })

      if (appointmentsError) throw appointmentsError

      // Transform the data to match the expected format
      const formattedAppointments = appointmentsData.map((appointment) => ({
        id: appointment.id,
        patientName: appointment.mothers?.full_name || "Unknown Patient",
        doctorName: appointment.doctors?.full_name || "Unknown Doctor",
        doctorSpecialty: appointment.doctors?.speciality || "General",
        date: appointment.requested_time,
        status: appointment.status,
        patientAvatar: appointment.mothers?.profile_url || "https://randomuser.me/api/portraits/women/44.jpg",
        doctorAvatar: appointment.doctors?.profile_url || "https://randomuser.me/api/portraits/women/68.jpg",
      }))

      setAppointments(formattedAppointments)
    } catch (err) {
      console.error("Error fetching appointments:", err.message)
      setError("Failed to fetch appointments data. Please try again later.")
    }
  }

  // Fetch articles data
  const fetchArticles = async () => {
    try {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from("education_articles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setArticles(data)
    } catch (err) {
      console.error("Error fetching articles:", err.message)
      setError("Failed to fetch articles. Please try again later.")
    }
  }

  // Fetch roles data
  const fetchRoles = async () => {
    try {
      // Check if the roles table exists in Supabase
      try {
        // Try to fetch roles from Supabase
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("*")
          .order("name", { ascending: true })

        if (rolesError) {
          // If the table doesn't exist, use mock data
          if (rolesError.message.includes("does not exist")) {
            console.warn("Roles table does not exist in the database, using mock data")
            setRoles([
              {
                id: 1,
                name: "Admin",
                description: "Full system access with all permissions",
                userCount: 3,
                permissions: [
                  "manage_doctors",
                  "manage_patients",
                  "manage_content",
                  "manage_roles",
                  "system_monitoring",
                ],
              },
              {
                id: 2,
                name: "Doctor",
                description: "Access to patient data and appointments",
                userCount: 42,
                permissions: ["view_patients", "manage_appointments", "view_content"],
              },
              {
                id: 3,
                name: "Patient",
                description: "Limited access to personal data and appointments",
                userCount: 189,
                permissions: ["view_profile", "book_appointments", "view_content"],
              },
              {
                id: 4,
                name: "Content Manager",
                description: "Manages health information and educational content",
                userCount: 5,
                permissions: ["manage_content", "view_content"],
              },
            ])
          } else {
            throw rolesError
          }
        } else {
          // If we successfully fetched roles, use them
          setRoles(rolesData)
        }
      } catch (err) {
        console.error("Error checking for roles table:", err.message)
      }
    } catch (err) {
      console.error("Error fetching roles:", err.message)
      setError("Failed to fetch user roles. Please try again later.")
    }
  }

  // Fetch system stats
  const fetchStats = async () => {
    try {
      // Get doctors count
      const { count: doctorsCount } = await supabase.from("doctors").select("*", { count: "exact", head: true })

      // Get patients (mothers) count
      const { count: patientsCount } = await supabase.from("mothers").select("*", { count: "exact", head: true })

      // Get appointments count
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })

      // Get articles count
      const { count: articlesCount } = await supabase
        .from("education_articles")
        .select("*", { count: "exact", head: true })

      setStats({
        doctorsCount: doctorsCount || 0,
        patientsCount: patientsCount || 0,
        appointmentsCount: appointmentsCount || 0,
        articlesCount: articlesCount || 0,
      })
    } catch (err) {
      console.error("Error fetching stats:", err.message)
    }
  }

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      // Simulate database query to check connection
      const startTime = Date.now()
      await supabase.from("admins").select("*", { count: "exact", head: true })

      const endTime = Date.now()
      const dbLatency = endTime - startTime

      // Get storage usage (this is a mock since Supabase doesn't expose this directly)
      const storageUsage = Math.floor(Math.random() * 20) + 60 // Mock value between 60-80GB

      // Get user counts
      const { count: totalUsers, error: usersError } = await supabase
        .from("mothers")
        .select("*", { count: "exact", head: true })

      if (usersError) throw usersError

      // Get active users (users who have logged in within the last 24 hours - mock data)
      const activeUsers = Math.floor(totalUsers * 0.3) // Assume 30% of users are active

      // Get API latency (mock data)
      const apiLatency = Math.floor(Math.random() * 100) + 80 // 80-180ms

      // Update system status with real database latency and user counts
      setSystemStatus({
        database: {
          status: dbLatency > 500 ? "warning" : "healthy",
          latency: dbLatency,
          uptime: 99.98,
        },
        api: {
          status: apiLatency > 150 ? "warning" : "healthy",
          latency: apiLatency,
          uptime: 99.95,
        },
        storage: {
          status: storageUsage > 400 ? "warning" : "healthy",
          usage: storageUsage,
          total: 500,
        },
        auth: {
          status: "healthy",
          activeUsers: activeUsers,
          totalUsers: totalUsers || 0,
        },
      })
    } catch (err) {
      console.error("Error fetching system status:", err.message)
    }
  }

  // Fetch all admin data - using useCallback to fix the exhaustive-deps warning
  const fetchAllAdminData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchAdminData(),
        fetchDoctors(),
        fetchPatients(),
        fetchAppointments(),
        fetchArticles(),
        fetchRoles(),
        fetchStats(),
        fetchSystemStatus(),
      ])
    } catch (err) {
      console.error("Error fetching admin data:", err.message)
      setError("Failed to load admin data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array since these functions don't depend on any props or state

  // Set up real-time subscriptions - using useCallback to fix the exhaustive-deps warning
  const setupSubscriptions = useCallback(() => {
    // Doctors subscription
    const doctorsSubscription = supabase
      .channel("doctors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => {
        fetchDoctors()
        fetchStats()
      })
      .subscribe()

    // Appointments subscription
    const appointmentsSubscription = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments()
        fetchStats()
      })
      .subscribe()

    // Articles subscription
    const articlesSubscription = supabase
      .channel("articles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "education_articles" }, () => {
        fetchArticles()
        fetchStats()
      })
      .subscribe()

    // Patients subscription
    const patientsSubscription = supabase
      .channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "mothers" }, () => {
        fetchPatients()
        fetchStats()
      })
      .subscribe()

    // Return cleanup function
    return () => {
      supabase.removeChannel(doctorsSubscription)
      supabase.removeChannel(appointmentsSubscription)
      supabase.removeChannel(articlesSubscription)
      supabase.removeChannel(patientsSubscription)
    }
  }, []) // Empty dependency array since these functions don't depend on any props or state

  // Initial data fetch when session changes
  useEffect(() => {
    if (session && session.user) {
      fetchAllAdminData()
      const cleanup = setupSubscriptions()
      return cleanup
    } else {
      setLoading(false)
    }
  }, [session, fetchAllAdminData, setupSubscriptions]) // Added missing dependencies

  // Methods for updating data
  const addDoctor = async (doctorData) => {
    try {
      const { data, error } = await supabase.from("doctors").insert(doctorData).select()

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true, data }
    } catch (err) {
      console.error("Error adding doctor:", err.message)
      return { success: false, error: err.message }
    }
  }

  const updateDoctor = async (id, doctorData) => {
    try {
      const { data, error } = await supabase.from("doctors").update(doctorData).eq("id", id).select()

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true, data }
    } catch (err) {
      console.error("Error updating doctor:", err.message)
      return { success: false, error: err.message }
    }
  }

  const deleteDoctor = async (id) => {
    try {
      const { error } = await supabase.from("doctors").delete().eq("id", id)

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true }
    } catch (err) {
      console.error("Error deleting doctor:", err.message)
      return { success: false, error: err.message }
    }
  }

  const addArticle = async (articleData) => {
    try {
      const { data, error } = await supabase.from("education_articles").insert(articleData).select()

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true, data }
    } catch (err) {
      console.error("Error adding article:", err.message)
      return { success: false, error: err.message }
    }
  }

  const updateArticle = async (id, articleData) => {
    try {
      const { data, error } = await supabase.from("education_articles").update(articleData).eq("id", id).select()

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true, data }
    } catch (err) {
      console.error("Error updating article:", err.message)
      return { success: false, error: err.message }
    }
  }

  const deleteArticle = async (id) => {
    try {
      const { error } = await supabase.from("education_articles").delete().eq("id", id)

      if (error) throw error

      // No need to manually update state as the subscription will trigger a refresh
      return { success: true }
    } catch (err) {
      console.error("Error deleting article:", err.message)
      return { success: false, error: err.message }
    }
  }

  // Refresh all data manually if needed
  const refreshData = () => {
    fetchAllAdminData()
  }

  // Context value
  const value = {
    loading,
    error,
    adminData,
    doctors,
    patients,
    appointments,
    articles,
    roles,
    stats,
    systemStatus,
    refreshData,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addArticle,
    updateArticle,
    deleteArticle,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

// Add prop types validation to fix the ESLint warning
AdminContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
