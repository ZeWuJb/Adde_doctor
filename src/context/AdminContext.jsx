"use client"

import { createContext, useState, useEffect, useCallback } from "react"
import PropTypes from "prop-types"
import { supabase } from "../supabaseClient"
import { UserAuth } from "./AuthContext"

export const AdminContext = createContext()

export const AdminContextProvider = ({ children }) => {
  const { session } = UserAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [weeklyTips, setWeeklyTips] = useState([])
  const [infoArticles, setInfoArticles] = useState([])
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
  const [babyNames, setBabyNames] = useState([])

  const fetchAdminData = useCallback(async () => {
    if (!session || !session.user) return
    try {
      const { data, error } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()
      if (error) throw error
      setAdminData(data)
    } catch (err) {
      console.error("Error fetching admin data:", err.message)
    }
  }, [session])

  const fetchDoctors = useCallback(async () => {
    try {
      const { data: doctorsData, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      const doctorsWithCounts = await Promise.all(
        doctorsData.map(async (doctor) => {
          const { count: appointmentsCount, error: appointmentsError } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)
          if (appointmentsError) console.error("Error fetching appointment count:", appointmentsError.message)
          const { data: uniquePatients, error: patientsError } = await supabase
            .from("appointments")
            .select("mother_id")
            .eq("doctor_id", doctor.id)
          if (patientsError) console.error("Error fetching patient count:", patientsError.message)
          const uniquePatientCount = uniquePatients ? new Set(uniquePatients.map((p) => p.mother_id)).size : 0
          return {
            id: doctor.id,
            full_name: doctor.full_name,
            email: doctor.email,
            profile_url: doctor.profile_url,
            speciality: doctor.speciality || "General",
            created_at: doctor.created_at,
            type: doctor.type || "doctor",
            description: doctor.description || "",
            payment_required_amount: doctor.payment_required_amount || 0,
            consultations_given: doctor.consultations_given || 0,
            user_id: doctor.user_id,
            // Additional fields for compatibility with existing code
            name: doctor.full_name,
            specialty: doctor.speciality || "General",
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
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("mothers").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setPatients(data)
    } catch (err) {
      console.error("Error fetching patients:", err.message)
      setError("Failed to fetch patients. Please try again later.")
    }
  }, [])

  const fetchAppointments = useCallback(async () => {
    try {
      const { data: appointmentsData, error } = await supabase
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
      if (error) throw error
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
  }, [])

  const fetchWeeklyTips = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("weekly_tips").select("*").order("week", { ascending: true })
      if (error) throw error
      setWeeklyTips(data)
    } catch (err) {
      console.error("Error fetching weekly tips:", err.message)
      setError("Failed to fetch weekly tips. Please try again later.")
    }
  }, [])

  const fetchInfoArticles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("info1").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setInfoArticles(data)
    } catch (err) {
      console.error("Error fetching info articles:", err.message)
      setError("Failed to fetch info articles. Please try again later.")
    }
  }, [])

  const fetchBabyNames = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("baby_names").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setBabyNames(data)
    } catch (err) {
      console.error("Error fetching baby names:", err.message)
      setError("Failed to fetch baby names. Please try again later.")
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const { count: doctorsCount } = await supabase.from("doctors").select("*", { count: "exact", head: true })
      const { count: patientsCount } = await supabase.from("mothers").select("*", { count: "exact", head: true })
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
      const { count: weeklyTipsCount } = await supabase.from("weekly_tips").select("*", { count: "exact", head: true })
      const { count: infoArticlesCount } = await supabase.from("info1").select("*", { count: "exact", head: true })
      setStats({
        doctorsCount: doctorsCount || 0,
        patientsCount: patientsCount || 0,
        appointmentsCount: appointmentsCount || 0,
        articlesCount: (weeklyTipsCount || 0) + (infoArticlesCount || 0),
      })
    } catch (err) {
      console.error("Error fetching stats:", err.message)
    }
  }, [])

  const fetchSystemStatus = useCallback(async () => {
    try {
      const startTime = Date.now()
      await supabase.from("admins").select("*", { count: "exact", head: true })
      const dbLatency = Date.now() - startTime
      const storageUsage = Math.floor(Math.random() * 20) + 60
      const { count: totalUsers, error: usersError } = await supabase
        .from("mothers")
        .select("*", { count: "exact", head: true })
      if (usersError) throw usersError
      const activeUsers = Math.floor(totalUsers * 0.3)
      const apiLatency = Math.floor(Math.random() * 100) + 80
      setSystemStatus({
        database: { status: dbLatency > 500 ? "warning" : "healthy", latency: dbLatency, uptime: 99.98 },
        api: { status: apiLatency > 150 ? "warning" : "healthy", latency: apiLatency, uptime: 99.95 },
        storage: { status: storageUsage > 400 ? "warning" : "healthy", usage: storageUsage, total: 500 },
        auth: { status: "healthy", activeUsers: activeUsers, totalUsers: totalUsers || 0 },
      })
    } catch (err) {
      console.error("Error fetching system status:", err.message)
    }
  }, [])

  const fetchAllAdminData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchAdminData(),
        fetchDoctors(),
        fetchPatients(),
        fetchAppointments(),
        fetchWeeklyTips(),
        fetchInfoArticles(),
        fetchBabyNames(), // Add this line
        fetchStats(),
        fetchSystemStatus(),
      ])
    } catch (err) {
      console.error("Error fetching admin data:", err.message)
      setError("Failed to load admin data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [
    fetchAdminData,
    fetchDoctors,
    fetchPatients,
    fetchAppointments,
    fetchWeeklyTips,
    fetchInfoArticles,
    fetchStats,
    fetchSystemStatus,
    fetchBabyNames,
  ])

  const setupSubscriptions = useCallback(() => {
    const doctorsSubscription = supabase
      .channel("doctors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => {
        fetchDoctors()
        fetchStats()
      })
      .subscribe()
    const appointmentsSubscription = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments()
        fetchStats()
      })
      .subscribe()
    const weeklyTipsSubscription = supabase
      .channel("weekly-tips-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "weekly_tips" }, () => {
        fetchWeeklyTips()
        fetchStats()
      })
      .subscribe()
    const infoArticlesSubscription = supabase
      .channel("info-articles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "info1" }, () => {
        fetchInfoArticles()
        fetchStats()
      })
      .subscribe()
    const patientsSubscription = supabase
      .channel("patients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "mothers" }, () => {
        fetchPatients()
        fetchStats()
      })
      .subscribe()
    const babyNamesSubscription = supabase
      .channel("baby-names-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "baby_names" }, () => {
        fetchBabyNames()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(doctorsSubscription)
      supabase.removeChannel(appointmentsSubscription)
      supabase.removeChannel(weeklyTipsSubscription)
      supabase.removeChannel(infoArticlesSubscription)
      supabase.removeChannel(patientsSubscription)
      supabase.removeChannel(babyNamesSubscription)
    }
  }, [fetchDoctors, fetchAppointments, fetchWeeklyTips, fetchInfoArticles, fetchPatients, fetchStats, fetchBabyNames])

  useEffect(() => {
    if (session && session.user) {
      fetchAllAdminData()
      const cleanup = setupSubscriptions()
      return cleanup
    } else {
      setLoading(false)
    }
  }, [session, fetchAllAdminData, setupSubscriptions])

  const addDoctor = async (doctorData) => {
    try {
      const { data, error } = await supabase.from("doctors").insert(doctorData).select()
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error("Error adding doctor:", err.message)
      return { success: false, error: err.message }
    }
  }

  const addDoctorWithAuth = async (doctorData) => {
    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: doctorData.email.toLowerCase(),
        password: doctorData.password,
        email_confirm: true, // Auto-confirm email
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create auth user")

      // Step 2: Create doctor record with user_id
      const doctorRecord = {
        full_name: doctorData.full_name,
        email: doctorData.email.toLowerCase(),
        speciality: doctorData.speciality,
        description: doctorData.description,
        payment_required_amount: doctorData.payment_required_amount,
        type: doctorData.type,
        user_id: authData.user.id,
      }

      const { data: doctorDbData, error: doctorError } = await supabase.from("doctors").insert(doctorRecord).select()

      if (doctorError) {
        // If doctor creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw doctorError
      }

      return { success: true, data: doctorDbData[0] }
    } catch (err) {
      console.error("Error adding doctor with auth:", err.message)
      return { success: false, error: err.message }
    }
  }

  const updateDoctor = async (id, doctorData) => {
    try {
      const { data, error } = await supabase.from("doctors").update(doctorData).eq("id", id).select()
      if (error) throw error
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
      return { success: true }
    } catch (err) {
      console.error("Error deleting doctor:", err.message)
      return { success: false, error: err.message }
    }
  }

  const addArticle = async (table, articleData, imageFile) => {
    try {
      let imageBase64 = null
      if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
          throw new Error("Image size exceeds 2MB limit")
        }
        const reader = new FileReader()
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64String = reader.result.split(",")[1]
            if (!base64String) {
              reject(new Error("Failed to extract Base64 string"))
            }
            resolve(base64String)
          }
          reader.onerror = () => reject(new Error("Failed to read image file"))
          reader.readAsDataURL(imageFile)
        })
        imageBase64 = await base64Promise
      }
      const payload = { ...articleData, image: imageBase64 }
      const { data, error } = await supabase.from(table).insert([payload]).select()
      if (error) throw error
      if (table === "weekly_tips") await fetchWeeklyTips()
      else if (table === "info1") await fetchInfoArticles()
      return { success: true, data }
    } catch (err) {
      console.error(`Error adding article to ${table}:`, err.message, err)
      return { success: false, error: err.message }
    }
  }

  const updateArticle = async (table, id, articleData, imageFile) => {
    try {
      let imageBase64 = articleData.image
      if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
          throw new Error("Image size exceeds 2MB limit")
        }
        const reader = new FileReader()
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => {
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64String = reader.result.split(",")[1]
            if (!base64String) {
              reject(new Error("Failed to extract Base64 string"))
            }
            resolve(base64String)
          }
          reader.onerror = () => reject(new Error("Failed to read image file"))
          reader.readAsDataURL(imageFile)
        })
        imageBase64 = await base64Promise
      }
      const payload = { ...articleData, image: imageBase64 }
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select()
      if (error) throw error
      if (table === "weekly_tips") await fetchWeeklyTips()
      else if (table === "info1") await fetchInfoArticles()
      return { success: true, data }
    } catch (err) {
      console.error(`Error updating article in ${table}:`, err.message, err)
      return { success: false, error: err.message }
    }
  }

  const deleteArticle = async (table, id) => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id)
      if (error) throw error
      if (table === "weekly_tips") await fetchWeeklyTips()
      else if (table === "info1") await fetchInfoArticles()
      return { success: true }
    } catch (err) {
      console.error(`Error deleting article from ${table}:`, err.message)
      return { success: false, error: err.message }
    }
  }

  const addBabyName = async (babyNameData) => {
    try {
      const { data, error } = await supabase.from("baby_names").insert([babyNameData]).select()
      if (error) throw error
      await fetchBabyNames()
      return { success: true, data }
    } catch (err) {
      console.error("Error adding baby name:", err.message)
      return { success: false, error: err.message }
    }
  }

  const updateBabyName = async (id, babyNameData) => {
    try {
      const { data, error } = await supabase.from("baby_names").update(babyNameData).eq("id", id).select()
      if (error) throw error
      await fetchBabyNames()
      return { success: true, data }
    } catch (err) {
      console.error("Error updating baby name:", err.message)
      return { success: false, error: err.message }
    }
  }

  const deleteBabyName = async (id) => {
    try {
      const { error } = await supabase.from("baby_names").delete().eq("id", id)
      if (error) throw error
      await fetchBabyNames()
      return { success: true }
    } catch (err) {
      console.error("Error deleting baby name:", err.message)
      return { success: false, error: err.message }
    }
  }

  const refreshData = () => {
    fetchAllAdminData()
  }

  const value = {
    loading,
    error,
    setError,
    adminData,
    doctors,
    patients,
    appointments,
    weeklyTips,
    infoArticles,
    babyNames, // Add this line
    stats,
    systemStatus,
    refreshData,
    addDoctor,
    addDoctorWithAuth,
    updateDoctor,
    deleteDoctor,
    addArticle,
    updateArticle,
    deleteArticle,
    addBabyName, // Add this line
    updateBabyName, // Add this line
    deleteBabyName, // Add this line
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

AdminContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
