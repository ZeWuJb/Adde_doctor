"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Heading,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
  useToast,
  Spinner,
  Flex,
  Spacer,
} from "@chakra-ui/react"
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons"
import { supabase } from "../../supabaseClient"
import { useSession } from "../../hooks/useSession"

const UserRolesPage = () => {
  const [roles, setRoles] = useState([])
  const [filteredRoles, setFilteredRoles] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()

  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] })
  const [currentRole, setCurrentRole] = useState({ id: null, name: "", description: "", permissions: [] })

  const session = useSession()
  const toast = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Check if user is admin
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", session?.user?.id)
          .maybeSingle()

        const userIsAdmin = !!adminData
        setIsAdmin(userIsAdmin)

        if (!userIsAdmin) {
          setError("You don't have permission to manage roles. Please contact an administrator.")
          setLoading(false)
          return
        }

        // Fetch permissions with better error handling
        const { data: permData, error: permError } = await supabase
          .from("permissions")
          .select("*")
          .order("name", { ascending: true })

        if (permError) {
          console.error("Error fetching permissions:", permError)
          // Create default permissions if they don't exist
          await createDefaultPermissions()
          const { data: newPermData } = await supabase.from("permissions").select("*")
          setAvailablePermissions(newPermData || [])
        } else {
          setAvailablePermissions(permData || [])
        }

        // Fetch roles with better error handling
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("*")
          .order("name", { ascending: true })

        if (rolesError) {
          console.error("Error fetching roles:", rolesError)
          // Create default roles if they don't exist
          await createDefaultRoles()
          const { data: newRolesData } = await supabase.from("roles").select("*")
          setRoles(newRolesData || [])
          setFilteredRoles(newRolesData || [])
          setLoading(false)
          return
        }

        // Fetch role_permissions
        const { data: rpData, error: rpError } = await supabase
          .from("role_permissions")
          .select("role_id, permission_id")

        if (rpError) {
          console.error("Error fetching role permissions:", rpError)
        }

        // Fetch user counts for roles
        const { data: urData, error: urError } = await supabase.from("user_roles").select("role_id")

        if (urError) {
          console.error("Error fetching user roles:", urError)
        }

        const userCounts = (urData || []).reduce((acc, ur) => {
          acc[ur.role_id] = (acc[ur.role_id] || 0) + 1
          return acc
        }, {})

        // Combine roles with permissions and user counts
        const rolesWithDetails = rolesData.map((role) => {
          const permIds = (rpData || []).filter((rp) => rp.role_id === role.id).map((rp) => rp.permission_id)
          const permissions = (permData || []).filter((perm) => permIds.includes(perm.id)).map((perm) => perm.name)
          return {
            ...role,
            permissions,
            userCount: userCounts[role.id] || 0,
          }
        })

        setRoles(rolesWithDetails)
        setFilteredRoles(rolesWithDetails)
      } catch (err) {
        console.error("Error fetching data:", err.message)
        setError("Failed to fetch data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  // Add helper function to create default permissions
  const createDefaultPermissions = async () => {
    const defaultPermissions = [
      { name: "read_users", description: "View user information" },
      { name: "write_users", description: "Create and edit users" },
      { name: "delete_users", description: "Delete users" },
      { name: "read_appointments", description: "View appointments" },
      { name: "write_appointments", description: "Create and edit appointments" },
      { name: "delete_appointments", description: "Delete appointments" },
      { name: "read_reports", description: "View reports" },
      { name: "write_reports", description: "Create and edit reports" },
      { name: "admin_access", description: "Access admin panel" },
      { name: "manage_roles", description: "Manage user roles and permissions" },
    ]

    try {
      const { error } = await supabase.from("permissions").insert(defaultPermissions)
      if (error) console.error("Error creating default permissions:", error)
    } catch (err) {
      console.error("Error creating default permissions:", err)
    }
  }

  // Add helper function to create default roles
  const createDefaultRoles = async () => {
    const defaultRoles = [
      { name: "admin", description: "Full system access" },
      { name: "doctor", description: "Healthcare provider access" },
      { name: "nurse", description: "Nursing staff access" },
      { name: "patient", description: "Patient access" },
    ]

    try {
      const { error } = await supabase.from("roles").insert(defaultRoles)
      if (error) console.error("Error creating default roles:", error)
    } catch (err) {
      console.error("Error creating default roles:", err)
    }
  }

  useEffect(() => {
    const results = roles.filter((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredRoles(results)
  }, [searchTerm, roles])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewRole({ ...newRole, [name]: value })
  }

  const handlePermissionChange = (e) => {
    const permissionName = e.target.value
    const isChecked = e.target.checked

    setNewRole((prevRole) => {
      if (isChecked) {
        return {
          ...prevRole,
          permissions: [...prevRole.permissions, permissionName],
        }
      } else {
        return {
          ...prevRole,
          permissions: prevRole.permissions.filter((permission) => permission !== permissionName),
        }
      }
    })
  }

  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      setError("Please provide a role name")
      return
    }

    // Check if role name already exists
    const existingRole = roles.find((role) => role.name.toLowerCase() === newRole.name.toLowerCase())
    if (existingRole) {
      setError("A role with this name already exists")
      return
    }

    try {
      setLoading(true)

      // Insert the new role
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .insert({
          name: newRole.name.trim(),
          description: newRole.description?.trim() || null,
        })
        .select()

      if (roleError) throw roleError

      const newRoleId = roleData[0].id

      // Add permissions to the role
      if (newRole.permissions.length > 0) {
        const permIds = availablePermissions
          .filter((perm) => newRole.permissions.includes(perm.name))
          .map((perm) => perm.id)

        if (permIds.length > 0) {
          const rpToInsert = permIds.map((permId) => ({
            role_id: newRoleId,
            permission_id: permId,
          }))

          const { error: rpError } = await supabase.from("role_permissions").insert(rpToInsert)
          if (rpError) throw rpError
        }
      }

      const newRoleWithDetails = {
        ...roleData[0],
        permissions: newRole.permissions,
        userCount: 0,
      }

      const updatedRoles = [...roles, newRoleWithDetails]
      setRoles(updatedRoles)
      setFilteredRoles(updatedRoles)
      setNewRole({ name: "", description: "", permissions: [] })
      setShowAddModal(false)
      setError(null)
    } catch (err) {
      console.error("Error adding role:", err.message)
      setError("Failed to add role. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setCurrentRole({ ...currentRole, [name]: value })
  }

  const handleEditPermissionChange = (e) => {
    const permissionName = e.target.value
    const isChecked = e.target.checked

    setCurrentRole((prevRole) => {
      if (isChecked) {
        return {
          ...prevRole,
          permissions: [...prevRole.permissions, permissionName],
        }
      } else {
        return {
          ...prevRole,
          permissions: prevRole.permissions.filter((permission) => permission !== permissionName),
        }
      }
    })
  }

  const handleEditRole = async () => {
    if (!currentRole.name.trim()) {
      setError("Please provide a role name")
      return
    }

    // Check if role name already exists (excluding current role)
    const existingRole = roles.find(
      (role) => role.name.toLowerCase() === currentRole.name.toLowerCase() && role.id !== currentRole.id,
    )
    if (existingRole) {
      setError("A role with this name already exists")
      return
    }

    try {
      setLoading(true)

      // Update the role
      const { error: roleError } = await supabase
        .from("roles")
        .update({
          name: currentRole.name.trim(),
          description: currentRole.description?.trim() || null,
        })
        .eq("id", currentRole.id)

      if (roleError) throw roleError

      // Delete existing role permissions
      const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", currentRole.id)

      if (deleteError) throw deleteError

      // Add updated permissions
      if (currentRole.permissions.length > 0) {
        const permIds = availablePermissions
          .filter((perm) => currentRole.permissions.includes(perm.name))
          .map((perm) => perm.id)

        if (permIds.length > 0) {
          const rpToInsert = permIds.map((permId) => ({
            role_id: currentRole.id,
            permission_id: permId,
          }))

          const { error: rpError } = await supabase.from("role_permissions").insert(rpToInsert)
          if (rpError) throw rpError
        }
      }

      // Update roles state
      const updatedRoles = roles.map((role) => (role.id === currentRole.id ? { ...currentRole } : role))
      setRoles(updatedRoles)
      setFilteredRoles(updatedRoles)
      setShowEditModal(false)
      setError(null)
    } catch (err) {
      console.error("Error editing role:", err.message)
      setError("Failed to edit role. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (roleId) => {
    try {
      setLoading(true)
      const { error } = await supabase.from("roles").delete().eq("id", roleId)
      if (error) throw error

      setRoles(roles.filter((role) => role.id !== roleId))
      setFilteredRoles(filteredRoles.filter((role) => role.id !== roleId))

      toast({
        title: "Role deleted.",
        description: "The role has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error deleting role.",
        description: "Failed to delete the role. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (role) => {
    setCurrentRole({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    })
    onEditOpen()
  }

  const setShowAddModal = (value) => {
    if (value) {
      onAddOpen()
    } else {
      onAddClose()
    }
  }

  const setShowEditModal = (value) => {
    if (value) {
      onEditOpen()
    } else {
      onEditClose()
    }
  }

  return (
    <Box p={5}>
      <Flex align="center" mb={4}>
        <Heading as="h2" size="lg">
          User Roles Management
        </Heading>
        <Spacer />
        {isAdmin && (
          <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => setShowAddModal(true)}>
            Add Role
          </Button>
        )}
      </Flex>

      {error && (
        <Box mb={4} p={3} bg="red.100" color="red.700" borderRadius="md">
          {error}
        </Box>
      )}

      <Input placeholder="Search roles..." mb={4} value={searchTerm} onChange={handleSearch} isDisabled={!isAdmin} />

      {loading ? (
        <Flex justify="center" align="center">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Permissions</Th>
              <Th>User Count</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredRoles.map((role) => (
              <Tr key={role.id}>
                <Td>{role.name}</Td>
                <Td>{role.description || "N/A"}</Td>
                <Td>{role.permissions?.join(", ") || "No Permissions"}</Td>
                <Td>{role.userCount || 0}</Td>
                <Td>
                  {isAdmin && (
                    <>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit Role"
                        colorScheme="blue"
                        size="sm"
                        onClick={() => openEditModal(role)}
                        mr={2}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete Role"
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                      />
                    </>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Add Role Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input placeholder="Role Name" mb={3} name="name" value={newRole.name} onChange={handleInputChange} />
            <Input
              placeholder="Description"
              mb={3}
              name="description"
              value={newRole.description}
              onChange={handleInputChange}
            />
            <Text fontWeight="bold" mb={2}>
              Permissions:
            </Text>
            {availablePermissions.map((permission) => (
              <Box key={permission.id} mb={1}>
                <Input
                  type="checkbox"
                  id={`add-permission-${permission.id}`}
                  value={permission.name}
                  onChange={handlePermissionChange}
                  isChecked={newRole.permissions.includes(permission.name)}
                  style={{ marginRight: "0.5em" }}
                />
                <label htmlFor={`add-permission-${permission.id}`}>{permission.name}</label>
              </Box>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddRole} isLoading={loading}>
              Add
            </Button>
            <Button variant="ghost" onClick={onAddClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Role Name"
              mb={3}
              name="name"
              value={currentRole.name}
              onChange={handleEditInputChange}
            />
            <Input
              placeholder="Description"
              mb={3}
              name="description"
              value={currentRole.description}
              onChange={handleEditInputChange}
            />
            <Text fontWeight="bold" mb={2}>
              Permissions:
            </Text>
            {availablePermissions.map((permission) => (
              <Box key={permission.id} mb={1}>
                <Input
                  type="checkbox"
                  id={`edit-permission-${permission.id}`}
                  value={permission.name}
                  onChange={handleEditPermissionChange}
                  isChecked={currentRole.permissions.includes(permission.name)}
                  style={{ marginRight: "0.5em" }}
                />
                <label htmlFor={`edit-permission-${permission.id}`}>{permission.name}</label>
              </Box>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditRole} isLoading={loading}>
              Update
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default UserRolesPage
