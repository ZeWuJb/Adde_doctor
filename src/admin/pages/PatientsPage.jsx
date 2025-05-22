import { useState, useEffect } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { Search, Filter, ChevronDown, User, AlertCircle } from "lucide-react";
import { useAdmin } from "../../hooks/useAdmin";
import { getImageSrc } from "../../services/imageService";

const PatientsPage = () => {
  const { session, userData, signOut } = UserAuth();
  const { loading, error, patients } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [ageFilter, setAgeFilter] = useState("all");
  const [pregnancyWeekFilter, setPregnancyWeekFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (patients.length === 0) {
      setFilteredPatients([]);
      return;
    }

    let filtered = [...patients];

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ageFilter !== "all") {
      if (ageFilter === "under25") {
        filtered = filtered.filter((patient) => patient.age < 25);
      } else if (ageFilter === "25to35") {
        filtered = filtered.filter((patient) => patient.age >= 25 && patient.age <= 35);
      } else if (ageFilter === "over35") {
        filtered = filtered.filter((patient) => patient.age > 35);
      }
    }

    if (pregnancyWeekFilter !== "all") {
      if (pregnancyWeekFilter === "first") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks <= 12);
      } else if (pregnancyWeekFilter === "second") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks > 12 && patient.pregnancy_weeks <= 27);
      } else if (pregnancyWeekFilter === "third") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks > 27);
      }
    }

    setFilteredPatients(filtered);
  }, [searchTerm, ageFilter, pregnancyWeekFilter, patients]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateDueDate = (startDate, weeks, days) => {
    if (!startDate) return "N/A";

    const pregnancyStart = new Date(startDate);
    const dueDate = new Date(pregnancyStart);

    dueDate.setDate(dueDate.getDate() + 280);

    if (weeks) {
      dueDate.setDate(dueDate.getDate() - weeks * 7);
    }

    if (days) {
      dueDate.setDate(dueDate.getDate() - days);
    }

    return formatDate(dueDate);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
      />

      <div className="flex-1 md:ml-64">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Patients Management</h1>
            <p className="text-gray-600">View and manage patient information</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Filter className="mr-2 h-5 w-5" />
              Filters
              <ChevronDown className={`ml-2 h-4 w-4 transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Ages</option>
                    <option value="under25">Under 25</option>
                    <option value="25to35">25 to 35</option>
                    <option value="over35">Over 35</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Trimester</label>
                  <select
                    value={pregnancyWeekFilter}
                    onChange={(e) => setPregnancyWeekFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Trimesters</option>
                    <option value="first">First Trimester (0-12 weeks)</option>
                    <option value="second">Second Trimester (13-27 weeks)</option>
                    <option value="third">Third Trimester (28+ weeks)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pregnancy Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Health Conditions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {patient.profile_url ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={getImageSrc(patient.profile_url, "/placeholder.svg?height=40&width=40")}
                                  alt={patient.full_name}
                                  onError={(e) => {
                                    if (e.target.src !== "/placeholder.svg?height=40&width=40") {
                                      e.target.src = "/placeholder.svg?height=40&width=40";
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                                  <User className="h-6 w-6 text-pink-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                              <div className="text-sm text-gray-500">{patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.pregnancy_weeks ? `${patient.pregnancy_weeks} weeks` : "N/A"}
                          {patient.pregnancy_days ? `, ${patient.pregnancy_days} days` : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {calculateDueDate(
                            patient.pregnancy_start_date,
                            patient.pregnancy_weeks,
                            patient.pregnancy_days
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.health_conditions && patient.health_conditions.length > 0
                            ? patient.health_conditions.join(", ")
                            : "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="text-pink-600 hover:text-pink-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                <p className="text-gray-500">
                  {searchTerm || ageFilter !== "all" || pregnancyWeekFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No patients are registered in the system yet"}
                </p>
                {(searchTerm || ageFilter !== "all" || pregnancyWeekFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setAgeFilter("all");
                      setPregnancyWeekFilter("all");
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
                <button onClick={() => setShowPatientDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20">
                    {selectedPatient.profile_url ? (
                      <img
                        className="h-20 w-20 rounded-full"
                        src={getImageSrc(selectedPatient.profile_url, "/placeholder.svg?height=80&width=80")}
                        alt={selectedPatient.full_name}
                        onError={(e) => {
                          if (e.target.src !== "/placeholder.svg?height=80&width=80") {
                            e.target.src = "/placeholder.svg?height=80&width=80";
                          }
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center">
                        <User className="h-10 w-10 text-pink-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-gray-900">{selectedPatient.full_name}</h3>
                    <p className="text-gray-500">{selectedPatient.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Personal Information</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Age</p>
                          <p className="text-sm font-medium">{selectedPatient.age || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Gender</p>
                          <p className="text-sm font-medium">{selectedPatient.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Height</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.height
                              ? `${selectedPatient.height} ${selectedPatient.height_unit || "cm"}`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.weight
                              ? `${selectedPatient.weight} ${selectedPatient.weight_unit || "kg"}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Pregnancy Information</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium">{formatDate(selectedPatient.pregnancy_start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Current Week</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.pregnancy_weeks ? `${selectedPatient.pregnancy_weeks} weeks` : "N/A"}
                            {selectedPatient.pregnancy_days ? `, ${selectedPatient.pregnancy_days} days` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium">
                            {calculateDueDate(
                              selectedPatient.pregnancy_start_date,
                              selectedPatient.pregnancy_weeks,
                              selectedPatient.pregnancy_days
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Trimester</p>
                          <p className="text-sm font-medium">
                            {!selectedPatient.pregnancy_weeks
                              ? "N/A"
                              : selectedPatient.pregnancy_weeks <= 12
                              ? "First"
                              : selectedPatient.pregnancy_weeks <= 27
                              ? "Second"
                              : "Third"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Health Information</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Blood Pressure</p>
                        <p className="text-sm font-medium">{selectedPatient.blood_pressure || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Health Conditions</p>
                        <div>
                          {selectedPatient.health_conditions && selectedPatient.health_conditions.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedPatient.health_conditions.map((condition, index) => (
                                <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-medium">None reported</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Account Information</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="text-sm font-medium">{selectedPatient.user_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="text-sm font-medium">{formatDate(selectedPatient.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPatientDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;