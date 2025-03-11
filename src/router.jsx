import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import Signup from "./components/Signup"
import Signin from "./components/Signin"
import Dashboard from "./components/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import AdminDashboard from "./components/AdminDashboard"

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      { path: "dashboard", element: <Dashboard activeTab="dashboard" /> },
      { path: "profile", element: <Dashboard activeTab="profile" /> },
      { path: "appointments", element: <Dashboard activeTab="appointments" /> },
      { path: "availability", element: <Dashboard activeTab="availability" /> },
      { path: "statistics", element: <Dashboard activeTab="statistics" /> },
      { path: "admin-dashboard", element: <AdminDashboard /> },
    ],
  },
])





































// import { createBrowserRouter } from "react-router-dom";
// import App from "./App";
// import Signup from "./components/Signup";
// import Signin from "./components/Signin";
// import Dashboard from "./components/Dashboard";
// //import PrivateRoute from "./components/PrivateRoute";
// import AdminDashboard from "./components/AdminDashboard";

// export const router = createBrowserRouter([
//     { path: "/", element: <App /> },
//     { path: "/signup", element: <Signup /> },
//     { path: "/signin", element: <Signin /> },
//     { path: "/dashboard", element: (
//         //<PrivateRoute>
//             <Dashboard />
//        // </PrivateRoute>
//     ) },
//     {
//         path: "/admin-dashboard",
//         element: (
//          // <PrivateRoute>
//             <AdminDashboard />
//          // </PrivateRoute>
//         ),
//       },
// ]);