import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// Import layouts that actually exist
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { MainLayout } from "../layouts/MainLayout";
// ClientLayout and MechanicLayout don't exist yet, so removing those imports

// Import pages using the barrel file where possible
import {
  LoginPage,
  RegisterUser,
  ManageBookings,
  ManageCars,
  ManageParts,
  ManageJobs,
  // Other pages that actually exist in the project
  HomePage,
  NewCar,
  CheckAddress,
  ThankYou,
  // Admin, mechanic related pages
  AdminDashboard,
  ManageClients,
  ManageMechanics,
  MechanicDashboard,
  // Import RegisterMechanic (default export imported as RegisterMechanicPage)
  RegisterMechanicPage
} from "../pages";

// Import stores
import { useAuthStore } from '../stores';

const PrivateRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  const { status, user } = useAuthStore();

  if (status === 'pending') {
    return <div>Loading...</div>; // Or a proper loader component
  }

  if (status !== 'authorized' || !user || !allowedRoles.includes(user.role)) {
    // Redirect them to the /auth/login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

/**
 * Main application router
 * - Handles route configuration and organization
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/*" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterUser />} />
          <Route path="register-mechanic" element={<RegisterMechanicPage />} />
          <Route index element={<Navigate to="login" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={<PrivateRoute allowedRoles={['admin']}><AdminLayout /></PrivateRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
          <Route path="manage-cars" element={<ManageCars />} />
          <Route path="manage-parts" element={<ManageParts />} />
          <Route path="manage-jobs" element={<ManageJobs />} />
          <Route path="manage-clients" element={<ManageClients />} />
          <Route path="manage-mechanics" element={<ManageMechanics />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* User Routes - All now wrapped in MainLayout for common header */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/new-car" element={<NewCar />} />
          <Route path="/add-address" element={<CheckAddress />} />
          <Route path="/mechanic-dashboard" element={
            <PrivateRoute allowedRoles={['mechanic']}><MechanicDashboard /></PrivateRoute>
          } />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
