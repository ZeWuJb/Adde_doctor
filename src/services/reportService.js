import { supabase } from "../supabaseClient"

// Fetch appointment statistics for a doctor
export const fetchAppointmentStats = async (doctorId, period = "month") => {
  try {
    // Get the date range based on the period
    const { startDate, endDate } = getDateRange(period)

    // Fetch all appointments within the date range
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        requested_time,
        status,
        payment_status
      `)
      .eq("doctor_id", doctorId)
      .gte("requested_time", startDate.toISOString())
      .lte("requested_time", endDate.toISOString())

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: data.length,
      completed: data.filter((a) => a.status === "accepted" && new Date(a.requested_time) < new Date()).length,
      upcoming: data.filter((a) => a.status === "accepted" && new Date(a.requested_time) >= new Date()).length,
      cancelled: data.filter((a) => a.status === "declined").length,
      pending: data.filter((a) => a.status === "pending").length,
      paid: data.filter((a) => a.payment_status === "paid").length,
      unpaid: data.filter((a) => a.payment_status !== "paid").length,
      period,
      startDate,
      endDate,
    }

    // Calculate daily/weekly/monthly distribution
    stats.distribution = calculateDistribution(data, period)

    return { success: true, data: stats }
  } catch (error) {
    console.error("Error fetching appointment statistics:", error.message)
    return { success: false, error }
  }
}


// Helper function to calculate the date range
const getDateRange = (period) => {
  const now = new Date()
  let startDate, endDate

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1))
  }

  endDate = new Date()
  return { startDate, endDate }
}

// Helper function to calculate distribution of appointments
const calculateDistribution = (appointments) => {
  const distribution = {}

  appointments.forEach((appointment) => {
    const dateKey = new Date(appointment.requested_time).toISOString().split("T")[0]
    distribution[dateKey] = (distribution[dateKey] || 0) + 1
  })

  return distribution
}

