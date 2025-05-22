import { Mail, Calendar, Users, User } from "lucide-react"
import PropTypes from "prop-types"

const DoctorsList = ({ doctors, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-24">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
        <div className="text-center py-8 text-gray-500">No doctors found in the system.</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
      <div className="space-y-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="flex items-start">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
              {doctor.profile_url ? (
                <img
                  src={doctor.profile_url || "/placeholder.svg"}
                  alt={`Profile picture of ${doctor.full_name || "Doctor"}`}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.parentNode.innerHTML = `<div class="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
                  }}
                />
              ) : (
                <User size={24} className="text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{doctor.full_name || "Unnamed Doctor"}</h3>
              <p className="text-sm text-gray-600">{doctor.speciality || "Not specified"}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-1" aria-hidden="true" />
                <span className="truncate">{doctor.email || "No email provided"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end text-sm text-gray-500 mb-1">
                <Users className="h-4 w-4 mr-1" aria-hidden="true" />
                <span>{doctor.consultations_given || 0} consultations</span>
              </div>
              <div className="flex items-center justify-end text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                <span>{doctor.type || "doctor"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

DoctorsList.propTypes = {
  doctors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired, // UUID from schema
      full_name: PropTypes.string,
      speciality: PropTypes.string,
      email: PropTypes.string,
      profile_url: PropTypes.string,
      consultations_given: PropTypes.number,
      type: PropTypes.string,
      payment_required_amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      created_at: PropTypes.string,
      user_id: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
}

DoctorsList.defaultProps = {
  doctors: [],
  loading: false,
}

export default DoctorsList
