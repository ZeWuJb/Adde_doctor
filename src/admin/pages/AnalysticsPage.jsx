import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { UserAuth } from "../../context/AuthContext"; 
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { useLocation } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ResourceEntryPage = () => {
  const { session, userData, signOut } = UserAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [base64ImageString, setBase64ImageString] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [week, setWeek] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [formType, setFormType] = useState("Analysis");
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);
  const location = useLocation();

  const isWeeklyTip = formType === "Weekly Tip";
  const tableName = isWeeklyTip ? "weekly_tips" : "info1";

  useEffect(() => {
    fetchResources();
  }, [formType]);

  const fetchResources = async () => {
    try {
      const query = supabase
        .from(tableName)
        .select("*");
      
      if (!isWeeklyTip) {
        query.eq("type", "analysis").order("created_at", { ascending: false });
      } else {
        query.order("week", { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setResources(data);
    } catch (e) {
      console.error(`Error fetching ${formType.toLowerCase()} entries:`, e.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1]; 
        setImage(file);
        setBase64ImageString(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadResource = async () => {
    if (!title || !content || (isWeeklyTip && !week) || (!isWeeklyTip && !image && !base64ImageString)) {
      alert(`Please fill all required fields${isWeeklyTip ? " (week, title, description)" : " (image, title, content)"}`);
      return;
    }

    setIsLoading(true);

    try {
      if (editingId) {
        
        if (isWeeklyTip) {
          const { error } = await supabase
            .from("weekly_tips")
            .update({
              week: parseInt(week),
              title,
              description: content,
              image: base64ImageString || null,
            })
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("info1")
            .update({
              title,
              text: content,
              image: base64ImageString,
              day: selectedDate.toLocaleDateString("en-US", { weekday: "long" }),
              time: selectedTime,
            })
            .eq("id", editingId);

          if (error) throw error;
        }
        alert(`${formType} entry updated successfully!`);
      } else {
        if (isWeeklyTip) {
          const { error } = await supabase.from("weekly_tips").insert({
            week: parseInt(week),
            title,
            description: content,
            image: base64ImageString || null,
          });

          if (error) throw error;
        } else {
          const resourceId = uuidv4();
          const { error } = await supabase.from("info1").insert({
            id: resourceId,
            title,
            text: content,
            image: base64ImageString,
            created_at: new Date().toISOString(),
            day: selectedDate.toLocaleDateString("en-US", { weekday: "long" }),
            time: selectedTime,
            type: "analysis",
          });

          if (error) throw error;
        }
        alert(`${formType} entry uploaded successfully!`);
      }

      resetForm();
      await fetchResources();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResource = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${formType.toLowerCase()} entry?`)) {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq("id", id);

        if (error) throw error;

        alert(`${formType} entry deleted successfully!`);
        await fetchResources();
      } catch (e) {
        alert(`Error deleting ${formType.toLowerCase()} entry: ${e.message}`);
      }
    }
  };

  const editResource = (resource) => {
    setEditingId(resource.id);
    setTitle(resource.title);
    setContent(isWeeklyTip ? resource.description : resource.text);
    if (isWeeklyTip) {
      setWeek(resource.week.toString());
    } else {
      setSelectedDate(new Date(resource.created_at || Date.now()));
      setSelectedTime(resource.time);
    }
    setBase64ImageString(resource.image);
    setImage(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setImage(null);
    setBase64ImageString(null);
    setTitle("");
    setContent("");
    setWeek("");
    setSelectedDate(new Date());
    setSelectedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const clearFields = () => {
    if (window.confirm("Are you sure you want to clear all fields?")) {
      resetForm();
    }
  };

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
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
        />

        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  {formType} Entry
                </h1>
                <p className="text-gray-600">
                  Add or edit {formType.toLowerCase()} resources
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => setFormType("Analysis")}
                    className={`px-4 py-2 mr-2 rounded-md ${formType === "Analysis" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => setFormType("Weekly Tip")}
                    className={`px-4 py-2 rounded-md ${formType === "Weekly Tip" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                  >
                    Weekly Tip
                  </button>
                </div>
              </div>

              {/* Vertical List of Existing Entries */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Existing {formType} Entries
                </h2>
                {resources.length === 0 ? (
                  <p className="text-gray-500">No {formType.toLowerCase()} entries found</p>
                ) : (
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-white p-4 rounded-lg shadow flex justify-between items-start"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                          <p className="text-gray-600 text-sm">
                            {(isWeeklyTip ? resource.description : resource.text)?.substring(0, 100) || "No content available"}...
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {isWeeklyTip ? `Week ${resource.week}` : `${resource.day} at ${resource.time}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editResource(resource)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteResource(resource.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            
              <div className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Image for Your {formType}
                  </h2>
                  <div className="flex space-x-4 mt-2">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Choose from Gallery
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImagePick}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  {base64ImageString && (
                    <img
                      src={image ? URL.createObjectURL(image) : `data:image/jpeg;base64,${base64ImageString}`}
                      alt="Selected"
                      className="mt-4 max-w-xs rounded-md"
                    />
                  )}
                  {!base64ImageString && (
                    <p className="mt-4 text-gray-500">
                      Selected image will appear here {isWeeklyTip ? "(optional)" : ""}
                    </p>
                  )}
                </div>

                {isWeeklyTip && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Week Number
                    </h2>
                    <input
                      type="number"
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      placeholder="Enter week number"
                      className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Title for Your {formType}
                  </h2>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Enter ${formType.toLowerCase()} title`}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {isWeeklyTip ? "Description" : "Analysis Content"}
                  </h2>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Enter your ${formType.toLowerCase()} ${isWeeklyTip ? "description" : "content"}`}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!isWeeklyTip && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Select Day
                      </h2>
                      <input
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Select Time
                      </h2>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

               
                <div className="flex justify-end items-center space-x-4">
                  <button
                    onClick={uploadResource}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <span className="mr-2">{editingId ? "Update" : "Save"}</span>
                    <span role="img" aria-label={editingId ? "Update" : "Save"}>{editingId ? "✏️" : "💾"}</span>
                  </button>
                  <button
                    onClick={clearFields}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <span className="mr-2">Clear</span>
                    <span role="img" aria-label="Delete">🗑️</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResourceEntryPage;