"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { session } = UserAuth()

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get user roles
        const { data: userRoles, error: userRolesError } = await supabase
          .from("user_roles")
          .select(`
            roles:role_id (
              id,
              name,
              role_permissions (
                permissions:permission_id (
                  id,
                  name,
                  description
                )
              )
            )
          `)
          .eq("user_id", session.user.id)

        if (userRolesError) throw userRolesError

        // Extract all permissions from all roles
        const allPermissions = []
        userRoles?.forEach((userRole) => {
          userRole.roles?.role_permissions?.forEach((rp) => {
            if (rp.permissions && !allPermissions.find((p) => p.id === rp.permissions.id)) {
              allPermissions.push(rp.permissions)
            }
          })
        })

        setPermissions(allPermissions)
        setError(null)
      } catch (err) {
        console.error("Error fetching user permissions:", err)
        setError("Failed to fetch permissions")
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserPermissions()
  }, [session])

  // Helper functions
  const hasPermission = (permissionName) => {
    return permissions.some((permission) => permission.name === permissionName)
  }

  const hasAnyPermission = (permissionNames) => {
    return permissionNames.some((permissionName) => hasPermission(permissionName))
  }

  const hasAllPermissions = (permissionNames) => {
    return permissionNames.every((permissionName) => hasPermission(permissionName))
  }

  const getPermissionNames = () => {
    return permissions.map((permission) => permission.name)
  }

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionNames,
  }
}
