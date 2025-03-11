import { supabase } from "../supabaseClient"

// Helper function to get doctor ID from user ID
export const getDoctorIdFromUserId = async (userId) => {
  try {
    const { data, error } = await supabase.from("doctors").select("id").eq("user_id", userId).single()

    if (error) throw error
    return { success: true, doctorId: data.id }
  } catch (error) {
    console.error("Error fetching doctor ID:", error.message)
    return { success: false, error }
  }
}

// Fetch appointments for a specific doctor
export const fetchDoctorAppointments = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        requested_time, 
        status, 
        payment_status, 
        video_conference_link,
        created_at,
        updated_at,
        mothers:mother_id (
          id, 
          full_name, 
          profile_url
        )
      `)
      .eq("doctor_id", doctorId)
      .order("requested_time", { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching appointments:", error.message)
    return { success: false, error }
  }
}

// Fetch a single appointment by ID
export const fetchAppointmentById = async (appointmentId) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id, 
        requested_time, 
        status, 
        payment_status, 
        video_conference_link,
        created_at,
        updated_at,
        doctors:doctor_id (
          id,
          full_name,
          profile_url,
          speciality
        ),
        mothers:mother_id (
          id, 
          full_name, 
          profile_url
        )
      `)
      .eq("id", appointmentId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching appointment:", error.message)
    return { success: false, error }
  }
}

// Update appointment status (accept/reject)
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    // If accepting, generate a video conference link
    let videoLink = null
    if (status === "accepted") {
      videoLink = `https://meet.jit.si/${appointmentId}`
    }

    const { data, error } = await supabase
      .from("appointments")
      .update({
        status,
        video_conference_link: videoLink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()

    if (error) throw error

    // If accepting, increment the consultation count for the doctor
    if (status === "accepted") {
      const appointment = data[0]
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("consultations_given")
        .eq("id", appointment.doctor_id)
        .single()

      if (!doctorError) {
        const currentCount = doctorData.consultations_given || 0
        await supabase
          .from("doctors")
          .update({ consultations_given: currentCount + 1 })
          .eq("id", appointment.doctor_id)
      }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error(`Error updating appointment status to ${status}:`, error.message)
    return { success: false, error }
  }
}

// Update appointment payment status
export const updatePaymentStatus = async (appointmentId, paymentStatus) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (error) {
    console.error(`Error updating payment status to ${paymentStatus}:`, error.message)
    return { success: false, error }
  }
}

// Update the fetchDoctorAvailability function to properly return the recordId
export const fetchDoctorAvailability = async (doctorId) => {
  try {
    const { data, error } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error

    // If no availability record exists, return empty structure
    if (data.length === 0) {
      return {
        success: true,
        data: { dates: [] },
        recordId: null,
      }
    }

    // Parse the JSONB availability data
    const availabilityData = data[0].availability || { dates: [] }

    // Ensure the structure is correct
    if (!availabilityData.dates) {
      availabilityData.dates = []
    }

    console.log("Fetched availability record:", data[0].id)

    return {
      success: true,
      data: availabilityData,
      recordId: data[0].id,
    }
  } catch (error) {
    console.error("Error fetching doctor availability:", error.message)
    return { success: false, error }
  }
}

// Update the updateDoctorAvailability function to properly handle both creating and updating records
export const updateDoctorAvailability = async (doctorId, availabilityData, recordId = null) => {
  try {
    let result;

    // Ensure the availability data has the correct structure
    if (!availabilityData.dates) {
      availabilityData.dates = [];
    }

    console.log("Updating availability with recordId:", recordId);
    console.log("Availability data:", JSON.stringify(availabilityData));

    // If we have a record ID, update the existing record
    if (recordId) {
      result = await supabase
        .from("doctor_availability")
        .update({
          availability: availabilityData, // Only update the `availability` field
        })
        .eq("id", recordId)
        .select();
    } else {
      // Otherwise, create a new record
      result = await supabase
        .from("doctor_availability")
        .insert({
          doctor_id: doctorId,
          availability: availabilityData, // Only insert the `availability` field
        })
        .select();
    }

    if (result.error) {
      console.error("Database operation error:", result.error);
      throw result.error;
    }

    if (!result.data || result.data.length === 0) {
      throw new Error("No data returned from database operation");
    }

    return {
      success: true,
      data: result.data[0],
      recordId: result.data[0].id,
    };
  } catch (error) {
    console.error("Error updating doctor availability:", error.message);
    return { success: false, error };
  }
};
// Add a new availability slot
export const addAvailabilitySlot = async (doctorId, availableDate, startTime, endTime) => {
  try {
    // Step 1: Fetch the current availability for the doctor
    const { success, data: availabilityData, recordId, error: fetchError } = await fetchDoctorAvailability(doctorId);

    if (!success) {
      console.error("Failed to fetch current availability:", fetchError?.message || "Unknown error");
      return { success: false, error: { message: "Failed to fetch current availability" } };
    }

    // Step 2: Check if the date already exists in the availability data
    const dateIndex = availabilityData.dates.findIndex((dateObj) => dateObj.date === availableDate);

    // Step 3: Generate all time slots between startTime and endTime (1-hour increments)
    const slots = [];
    let currentTime = startTime;

    while (currentTime <= endTime) {
      slots.push(currentTime);

      // Move to the next hour
      const [hours, minutes] = currentTime.split(":").map(Number);
      const nextTime = new Date();
      nextTime.setHours(hours, minutes, 0, 0);
      nextTime.setHours(nextTime.getHours() + 1); // Increment by 1 hour
      currentTime = `${String(nextTime.getHours()).padStart(2, "0")}:${String(nextTime.getMinutes()).padStart(2, "0")}`;
    }

    // Step 4: Check for conflicts with existing slots
    let hasConflict = false;

    if (dateIndex !== -1) {
      const existingSlots = availabilityData.dates[dateIndex].slots;

      for (const slot of slots) {
        if (existingSlots.includes(slot)) {
          hasConflict = true;
          break;
        }
      }
    }

    if (hasConflict) {
      return {
        success: false,
        error: { message: "One or more time slots conflict with existing availability" },
      };
    }

    // Step 5: Update the availability data
    const updatedAvailability = { ...availabilityData };

    if (dateIndex !== -1) {
      // Add slots to an existing date
      updatedAvailability.dates[dateIndex].slots = [...updatedAvailability.dates[dateIndex].slots, ...slots].sort();
    } else {
      // Add a new date with the generated slots
      updatedAvailability.dates.push({
        date: availableDate,
        slots: slots,
      });

      // Sort dates chronologically
      updatedAvailability.dates.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Step 6: Update the availability in the database
    const updateResult = await updateDoctorAvailability(doctorId, updatedAvailability, recordId);

    if (!updateResult.success) {
      console.error("Failed to update availability:", updateResult.error?.message || "Unknown error");
      return { success: false, error: { message: "Failed to update availability" } };
    }

    // Step 7: Return success response
    return {
      success: true,
      data: {
        date: availableDate,
        slots,
      },
    };
  } catch (error) {
    console.error("Error adding availability slot:", error.message);
    return { success: false, error: { message: error.message || "An unexpected error occurred" } };
  }
};

// Delete availability slot
export const deleteAvailabilitySlot = async (doctorId, date, slot) => {
  try {
    // First, get the current availability
    const { success, data: availabilityData, recordId, error: fetchError } = await fetchDoctorAvailability(doctorId)

    if (!success) throw fetchError || new Error("Failed to fetch current availability")

    // Find the date in the availability
    const dateIndex = availabilityData.dates.findIndex((dateObj) => dateObj.date === date)

    if (dateIndex === -1) {
      return {
        success: false,
        error: { message: "Date not found in availability" },
      }
    }

    // Find the slot in the date
    const slotIndex = availabilityData.dates[dateIndex].slots.indexOf(slot)

    if (slotIndex === -1) {
      return {
        success: false,
        error: { message: "Slot not found in date" },
      }
    }

    // Check if there are any appointments booked for this slot
    const slotDate = new Date(date)
    const [hours, minutes] = slot.split(":").map(Number)
    slotDate.setHours(hours, minutes, 0, 0)

    const slotEnd = new Date(slotDate)
    slotEnd.setHours(slotEnd.getHours() + 1)

    // Check for appointments in this time slot
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("status", "accepted")

    if (apptError) throw apptError

    const hasAppointments = appointments.some((appt) => {
      const apptTime = new Date(appt.requested_time)
      return apptTime >= slotDate && apptTime < slotEnd
    })

    if (hasAppointments) {
      return {
        success: false,
        error: { message: "Cannot delete this slot as there are appointments scheduled during this time" },
      }
    }

    // Update the availability data
    const updatedAvailability = { ...availabilityData }

    // Remove the slot
    updatedAvailability.dates[dateIndex].slots.splice(slotIndex, 1)

    // If no slots left for this date, remove the date
    if (updatedAvailability.dates[dateIndex].slots.length === 0) {
      updatedAvailability.dates.splice(dateIndex, 1)
    }

    // Update the availability in the database
    const updateResult = await updateDoctorAvailability(doctorId, updatedAvailability, recordId)

    if (!updateResult.success) throw updateResult.error

    return { success: true }
  } catch (error) {
    console.error("Error deleting availability slot:", error.message)
    return { success: false, error }
  }
}

// Check if a time slot is available
export const checkAvailability = async (doctorId, requestedTime) => {
  try {
    const requestedDate = new Date(requestedTime)
    const dateString = requestedDate.toISOString().split("T")[0]

    // Get the doctor's availability
    const { success, data: availabilityData, error: availError } = await fetchDoctorAvailability(doctorId)

    if (!success) throw availError || new Error("Failed to fetch availability")

    // Find the date in the availability
    const dateObj = availabilityData.dates.find((d) => d.date === dateString)

    if (!dateObj) {
      return {
        success: false,
        error: { message: "The requested date is not within the doctor's availability" },
      }
    }

    // Check if the requested time is in the slots
    // We'll consider the slot available if the requested time is within the hour of any slot
    const isAvailable = dateObj.slots.some((slot) => {
      const [slotHour, slotMinute] = slot.split(":").map(Number)
      const slotDate = new Date(requestedDate)
      slotDate.setHours(slotHour, slotMinute, 0, 0)

      const slotEnd = new Date(slotDate)
      slotEnd.setHours(slotEnd.getHours() + 1)

      return requestedDate >= slotDate && requestedDate < slotEnd
    })

    if (!isAvailable) {
      return {
        success: false,
        error: { message: "The requested time is not within the doctor's availability" },
      }
    }

    // Check if there's already an appointment at this time
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("status", "accepted")

    if (apptError) throw apptError

    // Check for appointment conflicts (within 30 minutes of the requested time)
    const hasConflict = appointments.some((appt) => {
      const apptTime = new Date(appt.requested_time)
      const diffMs = Math.abs(requestedDate - apptTime)
      const diffMinutes = Math.floor(diffMs / 1000 / 60)
      return diffMinutes < 30
    })

    if (hasConflict) {
      return {
        success: false,
        error: { message: "The doctor already has an appointment scheduled at this time" },
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error checking availability:", error.message)
    return { success: false, error }
  }
}

