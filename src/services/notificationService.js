import { supabase } from "../supabaseClient"

// Fetch notifications for a doctor
export const fetchDoctorNotifications = async (doctorId) => {
  try {
    // First check if the notifications table exists
    const { error: tableCheckError } = await supabase
      .from("notifications")
      .select("count", { count: "exact", head: true })
      .limit(1)

    // If the table doesn't exist, return an empty array instead of throwing an error
    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist in the database")
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching notifications:", error.message)
    return { success: false, error, data: [] }
  }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    // Check if notifications table exists
    const { error: tableCheckError } = await supabase
      .from("notifications")
      .select("count", { count: "exact", head: true })
      .limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist in the database")
      return { success: true, data: { id: notificationId, read: true } }
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()

    if (error) throw error
    return { success: true, data: data?.[0] || { id: notificationId, read: true } }
  } catch (error) {
    console.error("Error marking notification as read:", error.message)
    return { success: false, error }
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (doctorId) => {
  try {
    // Check if notifications table exists
    const { error: tableCheckError } = await supabase
      .from("notifications")
      .select("count", { count: "exact", head: true })
      .limit(1)

    if (tableCheckError && tableCheckError.message.includes("does not exist")) {
      console.warn("Notifications table does not exist in the database")
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", doctorId)
      .eq("read", false)
      .select()

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error marking all notifications as read:", error.message)
    return { success: false, error }
  }
}

// Set up real-time notifications
export const subscribeToNotifications = (doctorId, callback) => {
  const subscription = supabase
    .channel("notifications-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${doctorId}`,
      },
      (payload) => {
        callback(payload.new)
      },
    )
    .subscribe()

  return subscription
}
