"use client"

// Separate file for useAdmin hook to fix react-refresh/only-export-components error
import { useContext } from "react"
import { AdminContext } from "../context/AdminContext"

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within an AdminContextProvider")
  }
  return context
}
