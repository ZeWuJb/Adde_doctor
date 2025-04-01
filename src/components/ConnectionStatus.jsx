"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { supabase } from "../supabaseClient"

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [lastChecked, setLastChecked] = useState(new Date())

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        // Simple query to check if we can connect to Supabase
        const { error } = await supabase.from("doctors").select("count", { count: "exact", head: true }).limit(1)

        if (error) {
          console.error("Connection check failed:", error)
          setIsConnected(false)
        } else {
          setIsConnected(true)
        }
      } catch (err) {
        console.error("Connection check error:", err)
        setIsConnected(false)
      }

      setLastChecked(new Date())
    }

    // Check connection immediately
    checkConnection()

    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    // Also check when online/offline status changes
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isConnected) return null // Don't show anything when connected

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg shadow-md flex items-center">
      <WifiOff className="h-5 w-5 mr-2" />
      <div>
        <p className="font-medium text-sm">Connection lost</p>
        <p className="text-xs">Last checked: {lastChecked.toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default ConnectionStatus

