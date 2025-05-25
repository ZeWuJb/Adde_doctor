"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { supabaseAdmin } from "../supabaseAdmin"

export const useAdmin = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [systemStatus] = useState({
    database: { status: "healthy", latency: 45, uptime: 99.9 },
    api: { status: "healthy", latency: 32, uptime: 99.8 },
    storage: { status: "healthy", usage: 2.4, total: 10 },
    auth: { status: "healthy", activeUsers: 156, totalUsers: 1247 },
  })
  const [stats, setStats] = useState({
    doctorsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    articlesCount: 0,
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    await Promise.all([fetchDoctors(), fetchPatients(), fetchAppointments(), fetchStats()])
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      await fetchAllData()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch doctors count
      const { count: doctorsCount, error: doctorsError } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })

      if (doctorsError) throw doctorsError

      // Fetch patients count
      const { count: patientsCount, error: patientsError } = await supabase
        .from("mothers")
        .select("*", { count: "exact", head: true })

      if (patientsError) throw patientsError

      // Fetch appointments count
      const { count: appointmentsCount, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })

      if (appointmentsError) throw appointmentsError

      // Fetch articles count
      const { count: weeklyTipsCount, error: weeklyTipsError } = await supabase
        .from("weekly_tips")
        .select("*", { count: "exact", head: true })

      if (weeklyTipsError) throw weeklyTipsError

      setStats({
        doctorsCount: doctorsCount || 0,
        patientsCount: patientsCount || 0,
        appointmentsCount: appointmentsCount || 0,
        articlesCount: weeklyTipsCount || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError(error.message)
    }
  }

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase.from("doctors").select("*")
      if (error) throw error
      if (data) {
        setDoctors(data)
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
      setError(error.message)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase.from("mothers").select("*").order("created_at", { ascending: false })

      if (error) throw error
      if (data) {
        setPatients(data)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
      setError(error.message)
    }
  }

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          doctor_id,
          mother_id,
          requested_time,
          status,
          payment_status,
          video_conference_link,
          created_at,
          updated_at,
          mothers!appointments_mother_id_fkey (
            user_id,
            full_name,
            email,
            profile_url
          ),
          doctors!appointments_doctor_id_fkey (
            id,
            full_name,
            speciality,
            profile_url
          )
        `)
        .order("requested_time", { ascending: false })

      if (error) throw error

      if (data) {
        // Transform data to match the expected format in AppointmentsPage
        const transformedAppointments = data.map((appointment) => ({
          id: appointment.id,
          doctor_id: appointment.doctor_id,
          mother_id: appointment.mother_id,
          requested_time: appointment.requested_time,
          status: appointment.status,
          payment_status: appointment.payment_status,
          video_conference_link: appointment.video_conference_link,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
          // Patient data
          patientName: appointment.mothers?.full_name || "Unknown Patient",
          patientAvatar: appointment.mothers?.profile_url,
          // Doctor data
          doctorName: appointment.doctors?.full_name || "Unknown Doctor",
          doctorSpecialty: appointment.doctors?.speciality || "General",
          doctorAvatar: appointment.doctors?.profile_url,
          // Date for compatibility
          date: appointment.requested_time,
          // Keep original nested objects for flexibility
          mothers: appointment.mothers,
          doctors: appointment.doctors,
        }))

        setAppointments(transformedAppointments)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      setError(error.message)
    }
  }

  const deleteDoctor = async (id) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("doctors").delete().eq("id", id)
      if (error) throw error
      setDoctors(doctors.filter((doctor) => doctor.id !== id))
      // Refresh stats after deleting a doctor
      fetchStats()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addDoctor = async (doctorData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("doctors").insert([doctorData]).select()
      if (error) throw error
      if (data) {
        setDoctors([...doctors, data[0]])
        // Refresh stats after adding a doctor
        fetchStats()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addDoctorWithAuth = async (doctorData) => {
    try {
      // Step 1: Create Supabase auth user using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: doctorData.email.toLowerCase(),
        password: doctorData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: doctorData.full_name,
          role: "doctor",
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create auth user")

      // Step 2: Create doctor record with user_id using admin client
      const doctorRecord = {
        full_name: doctorData.full_name,
        email: doctorData.email.toLowerCase(),
        speciality: doctorData.speciality,
        description: doctorData.description,
        payment_required_amount: doctorData.payment_required_amount,
        type: doctorData.type,
        user_id: authData.user.id,
        profile_url: doctorData.profile_url || null,
      }

      const { data: doctorDbData, error: doctorError } = await supabaseAdmin
        .from("doctors")
        .insert(doctorRecord)
        .select()

      if (doctorError) {
        // If doctor creation fails, clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw doctorError
      }

      // Update local state
      setDoctors([...doctors, doctorDbData[0]])
      // Refresh stats after adding a doctor
      fetchStats()

      return { success: true, data: doctorDbData[0] }
    } catch (err) {
      console.error("Error adding doctor with auth:", err.message)
      return { success: false, error: err.message }
    }
  }

  const updateDoctor = async (id, doctorData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("doctors").update(doctorData).eq("id", id).select()
      if (error) throw error
      if (data) {
        setDoctors(doctors.map((doctor) => (doctor.id === id ? data[0] : doctor)))
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setError,
    doctors,
    patients,
    appointments,
    systemStatus,
    stats,
    deleteDoctor,
    addDoctor,
    addDoctorWithAuth,
    updateDoctor,
    fetchStats,
    refreshData,
  }
}
