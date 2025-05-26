"use client"

import { useState, useEffect, useContext } from "react"
import { AdminContext } from "../../context/AdminContext"
import { X, Baby, Save, Loader } from "lucide-react"
import PropTypes from "prop-types"
import FormInput from "../../components/ui/FormInput"
import FormTextarea from "../../components/ui/FormTextarea"
import { validateName, validateDescription } from "../../utils/validation"

const BabyNameFormModal = ({ isOpen, onClose, babyName, isEditing }) => {
  const { addBabyName, updateBabyName, refreshData } = useContext(AdminContext)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gender: "Boy",
    religion: "Christian",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditing && babyName) {
      setFormData({
        name: babyName.name || "",
        description: babyName.description || "",
        gender: babyName.gender || "Boy",
        religion: babyName.religion || "Christian",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        gender: "Boy",
        religion: "Christian",
      })
    }
    setErrors({})
  }, [isEditing, babyName, isOpen])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Real-time validation
    let error = ""
    switch (field) {
      case "name":
        error = validateName(value)
        break
      case "description":
        error = validateDescription(value)
        break
      default:
        break
    }

    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateForm = () => {
    const newErrors = {}

    const nameError = validateName(formData.name)
    const descriptionError = validateDescription(formData.description)

    if (nameError) newErrors.name = nameError
    if (descriptionError) newErrors.description = descriptionError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      let result
      if (isEditing) {
        result = await updateBabyName(babyName.id, formData)
      } else {
        result = await addBabyName(formData)
      }

      if (result.success) {
        refreshData()
        onClose()
        // Reset form
        setFormData({
          name: "",
          description: "",
          gender: "Boy",
          religion: "Christian",
        })
        setErrors({})
      } else {
        setErrors({ submit: result.error || "An error occurred" })
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setErrors({ submit: error.message || "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full">
                <Baby className="w-5 h-5 text-white" />
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                {isEditing ? "Edit Baby Name" : "Add New Baby Name"}
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <FormInput
              label="Baby Name"
              type="text"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              error={errors.name}
              placeholder="Enter baby name"
              required
              icon={Baby}
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              error={errors.description}
              placeholder="Enter name meaning or description"
              required
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="Boy">Boy</option>
                  <option value="Girl">Girl</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                <select
                  value={formData.religion}
                  onChange={(e) => handleInputChange("religion", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Object.values(errors).some((error) => error)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isEditing ? "Update Name" : "Add Name"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

BabyNameFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  babyName: PropTypes.object,
  isEditing: PropTypes.bool.isRequired,
}

export default BabyNameFormModal
