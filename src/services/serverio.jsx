"use client"

import { useSocketNotifications } from "../hooks/useSocketNotifications"

// For backward compatibility, also export a component version
const AppointmentNotifications = () => {
  const { connected, notifications, unreadCount } = useSocketNotifications()

  return (
    <div className="appointment-notifications">
      <div className="status">Connection Status: {connected ? "Connected" : "Disconnected"}</div>
      <div className="unread-count">Unread Notifications: {unreadCount}</div>
      {notifications.length > 0 ? (
        <div className="notification-list">
          <h3>Recent Notifications</h3>
          <ul>
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className={notification.read ? "read" : "unread"}>
                {notification.message} - {new Date(notification.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>No notifications</div>
      )}
    </div>
  )
}

export default AppointmentNotifications

