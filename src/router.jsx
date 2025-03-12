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
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Dashboard /> },
      { path: "appointments", element: <Dashboard /> },
      { path: "availability", element: <Dashboard /> },
      { path: "statistics", element: <Dashboard /> },
      { path: "patients", element: <Dashboard /> },
      { path: "reports", element: <Dashboard /> },
      { path: "settings", element: <Dashboard /> },
      { path: "help", element: <Dashboard /> },
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