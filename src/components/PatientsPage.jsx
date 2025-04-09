"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { fetchDoctorPatients, fetchPatientById, updatePatient, uploadPatientImage } from "../services/patientService"
import {
  Search,
  Plus,
  Edit,
  AlertCircle,
  ChevronLeft,
  Upload,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarIcon,
} from "lucide-react"

const PatientsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        } else {
          setError("Failed to retrieve doctor information")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    fetchDoctorId()
  }, [session])

  // Then, load patients once we have the doctor ID
  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorPatients(doctorId)
        if (result.success) {
          setPatients(result.data)
          setFilteredPatients(result.data)
        } else {
          setError("Failed to load patients")
        }
      } catch (err) {
        console.error("Error loading patients:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [doctorId])

  // Filter patients when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handlePatientSelect = async (patientId) => {
    try {
      setLoading(true)
      const result = await fetchPatientById(patientId)
      if (result.success) {
        setSelectedPatient(result.data)
        setEditForm(result.data)
      } else {
        setError("Failed to load patient details")
      }
    } catch (err) {
      console.error("Error loading patient details:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleClosePatientDetails = () => {
    setSelectedPatient(null)
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    if (!isEditing) {
      setEditForm({ ...selectedPatient })
    }
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setLoading(true)

      // First upload image if there's a new one
      if (imageFile) {
        setUploadingImage(true)
        const uploadResult = await uploadPatientImage(selectedPatient.id, imageFile)
        if (uploadResult.success) {
          setEditForm((prev) => ({
            ...prev,
            profile_url: uploadResult.url,
          }))
        } else {
          setError("Failed to upload image")
          setUploadingImage(false)
          setLoading(false)
          return
        }
        setUploadingImage(false)
      }

      // Then update patient data
      const updateResult = await updatePatient(selectedPatient.id, editForm)
      if (updateResult.success) {
        // Update the patient in the list
        setPatients((prev) => prev.map((p) => (p.id === selectedPatient.id ? { ...p, ...updateResult.data } : p)))
        setSelectedPatient(updateResult.data)
        setIsEditing(false)
        setImageFile(null)
        setImagePreview(null)
      } else {
        setError("Failed to update patient information")
      }
    } catch (err) {
      console.error("Error updating patient:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Patients</h1>
        <p className="text-gray-600">Manage your patient records and information</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {selectedPatient ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handleClosePatientDetails}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span>Back to patients</span>
              </button>
              <button
                onClick={handleEditToggle}
                className={`px-4 py-2 rounded-md ${
                  isEditing ? "bg-gray-200 text-gray-800" : "bg-primary-600 text-white"
                }`}
              >
                {isEditing ? (
                  "Cancel"
                ) : (
                  <span className="flex items-center">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </span>
                )}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                    <img
                      src={imagePreview || editForm.profile_url || "/placeholder.svg?height=128&width=128"}
                      alt={editForm.full_name}
                      className="h-full w-full object-cover"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-white" />
                    </label>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  {uploadingImage && <p className="text-sm text-gray-500">Uploading image...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={editForm.full_name || ""}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editForm.email || ""}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={editForm.phone_number || ""}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={editForm.date_of_birth || ""}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={editForm.address || ""}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
                      Medical History
                    </label>
                    <textarea
                      id="medical_history"
                      name="medical_history"
                      value={editForm.medical_history || ""}
                      onChange={handleEditFormChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                      Allergies
                    </label>
                    <textarea
                      id="allergies"
                      name="allergies"
                      value={editForm.allergies || ""}
                      onChange={handleEditFormChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                      <img
                        src={selectedPatient.profile_url || "/placeholder.svg?height=128&width=128"}
                        alt={selectedPatient.full_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h2 className="text-xl font-semibold text-center">{selectedPatient.full_name}</h2>
                    <p className="text-gray-500 text-center">Patient since {formatDate(selectedPatient.created_at)}</p>
                  </div>

                  <div className="md:w-2/3 md:pl-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-2" />
                            <span>{selectedPatient.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-2" />
                            <span>{selectedPatient.phone_number || "Not provided"}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                            <span>{selectedPatient.address || "Not provided"}</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span>
                              {selectedPatient.date_of_birth
                                ? formatDate(selectedPatient.date_of_birth)
                                : "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Medical Information</h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Medical History</h4>
                            <p className="mt-1">{selectedPatient.medical_history || "No medical history recorded"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Allergies</h4>
                            <p className="mt-1">{selectedPatient.allergies || "No allergies recorded"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Appointment History</h3>
                      {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedPatient.appointments.map((appointment) => (
                                <tr key={appointment.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {formatDate(appointment.requested_time)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(appointment.requested_time).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        appointment.status === "accepted"
                                          ? "bg-green-100 text-green-800"
                                          : appointment.status === "declined"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        appointment.payment_status === "paid"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {appointment.payment_status.charAt(0).toUpperCase() +
                                        appointment.payment_status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">{appointment.notes || "No notes"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No appointment history</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              <Plus className="h-5 w-5 mr-2" />
              Add New Patient
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePatientSelect(patient.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                              <img
                                src={patient.profile_url || "/placeholder.svg?height=40&width=40"}
                                alt={patient.full_name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                              <div className="text-sm text-gray-500">
                                Patient since {formatDate(patient.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">{patient.total_appointments || 0}</div>
                            <div className="text-xs text-gray-500">
                              ({patient.completed_appointments || 0} completed)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.appointments && patient.appointments.length > 0
                              ? formatDate(
                                  patient.appointments.sort(
                                    (a, b) => new Date(b.requested_time) - new Date(a.requested_time),
                                  )[0].requested_time,
                                )
                              : "Never"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePatientSelect(patient.id)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try a different search term" : "You haven't added any patients yet"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PatientsPage

