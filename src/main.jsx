import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { AuthContextProvider } from "./context/AuthContext"
import { AdminContextProvider } from "./context/AdminContext" // Import AdminContextProvider
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthContextProvider>
      <AdminContextProvider>
        <RouterProvider router={router} />
      </AdminContextProvider>
    </AuthContextProvider>
  </React.StrictMode>,
)
