"use client";
import { useState, useEffect, useMemo } from "react";
import { UserAuth } from "../context/AuthContext";
import { fetchDoctorAppointments, saveAppointmentWhenAccepted, getDoctorIdFromUserId } from "../services/appointmentService";
import { Calendar, Search, Filter, ChevronDown, Video, Check, X, AlertCircle } from "lucide-react";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import socketService from "../services/socketService";

const AppointmentsPage = () => {
  const { session } = UserAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pendingLocalAppointments, setPendingLocalAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { pendingAppointments } = useSocketNotifications();

  // Fetch doctor ID from user session
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return;
      try {
        const result = await getDoctorIdFromUserId(session.user.id); // Ensure this function is imported
        if (result.success) {
          setDoctorId(result.doctorId);
        } else {
          setError("Failed to retrieve doctor information");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    };
    fetchDoctorId();
  }, [session]);
  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorId) return;
      try {
        setLoading(true);
        const result = await fetchDoctorAppointments(doctorId);
        if (result.success) {
          setAppointments(result.data);
        } else {
          setError("Failed to load appointments");
        }
      } catch (err) {
        console.error("Error loading appointments:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [doctorId]);

  // Handle pending appointments received via socket notifications
  useEffect(() => {
    if (pendingAppointments.length === 0) return;

    setPendingLocalAppointments((prev) => {
      const newAppointments = pendingAppointments.map((appt) => ({
        id: appt.appointmentId,
        doctor_id: appt.doctor_id,
        mother_id: appt.mother_id,
        requested_time: appt.requested_time,
        status: "pending",
        mothers: {
          full_name: appt.mother_name || "New Patient",
          profile_url: appt.profile_url || "/placeholder.svg",
        },
      }));
      return [...prev, ...newAppointments];
    });
  }, [pendingAppointments]);

  // Combine local and database appointments
  const allAppointments = useMemo(() => {
    return [...appointments, ...pendingLocalAppointments];
  }, [appointments, pendingLocalAppointments]);

  useEffect(() => {
    if (!allAppointments.length) {
      setFilteredAppointments([]);
      return;
    }
  
    let filtered = allAppointments.filter((appt) => {
      // Apply search filter
      const matchesSearch = searchTerm
        ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
  
      // Apply status filter
      const matchesStatus = statusFilter === "all" 
        ? true 
        : appt.status === statusFilter;
  
      // Apply date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(appt.requested_time);
  
      let matchesDate = true;
     // In your date filter logic
switch(dateFilter) {
  case "today": {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    matchesDate = appointmentDate >= today && appointmentDate < tomorrow;
    break;
  }
  case "upcoming": {
    matchesDate = appointmentDate >= today;
    break;
  }
  case "thisWeek": {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    matchesDate = appointmentDate >= today && appointmentDate < nextWeek;
    break;
  }
  case "past": {
    matchesDate = appointmentDate < today;
    break;
  }
  default: {
    matchesDate = true;
    break;
  }
}
  
      return matchesSearch && matchesStatus && matchesDate;
    });
  
    setFilteredAppointments(filtered);
  }, [allAppointments, searchTerm, statusFilter, dateFilter]);
  // Modified accept handler
  const handleAccept = async (appointment) => {
    try {
      const result = await saveAppointmentWhenAccepted({
        doctor_id: appointment.doctor_id,
        mother_id: appointment.mother_id,
        requested_time: appointment.requested_time,
      });

      if (result.success) {
        setAppointments((prev) => [...prev, result.data]);
        setPendingLocalAppointments((prev) => 
          prev.filter((appt) => appt.id !== appointment.id)
        );
        socketService.acceptAppointment(appointment.id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to accept appointment");
    }
  };

  // Modified reject handler
  const handleReject = (id) => {
    setPendingLocalAppointments((prev) => prev.filter((appt) => appt.id !== id));
    socketService.declineAppointment(id);
  };


  const joinMeeting = (link) => {
    if (link) {
      window.open(link, "_blank");
    } else {
      setError("Video conference link is not available.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Filter className="mr-2" />
          Filters
          <ChevronDown
            className={`ml-2 transform ${showFilters ? "rotate-180" : ""} transition-transform`}
          />
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="thisWeek">This Week</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={appointment.mothers?.profile_url || "/placeholder.svg?height=40&width=40"}
                          alt={appointment.mothers?.full_name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.mothers?.full_name || "Unknown Patient"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(appointment.requested_time)} at{" "}
                          {formatTime(appointment.requested_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(appointment)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-700 transition ease-in-out duration-150"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      {appointment.status === "accepted" &&
                        isUpcoming(appointment.requested_time) && (
                          <button
                            onClick={() => joinMeeting(appointment.video_conference_link)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Meeting
                          </button>
                        )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        Status:{" "}
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      Payment:{" "}
                      {appointment.payment_status.charAt(0).toUpperCase() +
                        appointment.payment_status.slice(1)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no appointments matching your current filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;