import { supabase } from "../supabaseClient"

// Fetch notifications for a doctor
export const fetchDoctorNotifications = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching notifications:", error.message)
    return { success: false, error }
  }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error marking notification as read:", error.message)
    return { success: false, error }
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", doctorId)
      .eq("read", false)
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error marking all notifications as read:", error.message)
    return { success: false, error }
  }
}

// Set up real-time notifications
export const subscribeToNotifications = (doctorId, callback) => {
  const subscription = supabase
    .channel('notifications-channel')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications',
      filter: `recipient_id=eq.${doctorId}`
    }, payload => {
      callback(payload.new)
    })
    .subscribe()

  return subscription
}
