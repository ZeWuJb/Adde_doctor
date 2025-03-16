"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import socketService from "../services/socketService"

const ConnectionStatus = () => {
  const [connected, setConnected] = useState(false)
  const [showStatus, setShowStatus] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Register for connection status changes
    socketService.onConnectionChange((status) => {
      setConnected(status)

      // Show the status whenever it changes
      setShowStatus(true)
      setFadeOut(false)

      // After 5 seconds, start the fade out
      const fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 5000)

      // After fade completes, hide the component
      const hideTimer = setTimeout(() => {
        setShowStatus(false)
      }, 5500) // 5s delay + 0.5s transition

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    })

    // Initial status check
    setConnected(socketService.connected)
  }, [])

  if (!showStatus) return null

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 p-3 rounded-lg shadow-md transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      } ${connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
    >
      {connected ? (
        <>
          <Wifi size={16} />
          <span className="text-sm font-medium">Connected to server</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="text-sm font-medium">Disconnected</span>
        </>
      )}
    </div>
  )
}

export default ConnectionStatus

