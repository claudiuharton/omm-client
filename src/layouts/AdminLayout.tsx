import { Suspense, useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import { useAuth } from "../hooks/useAuth";
import { useJobStore } from "../stores"; // Import job store

/**
 * Admin Layout component
 * - Handles authentication state
 * - Provides the common layout for authenticated pages (header, main content, footer)
 * - Implements loading states and redirects based on state from useAuth
 */
export const AdminLayout = () => {
  // useAuth now directly reflects the store state
  const { status, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  // const authCheckedRef = useRef(false); // No longer needed
  // Get job store actions and state
  const fetchAdminBookings = useJobStore(state => state.fetchAdminBookings);
  const isAdminBookingsFetched = useJobStore(state => state.isAdminBookingsFetched);

  // Effect to redirect non-admins or fetch admin data
  useEffect(() => {
    if (status === "authorized" && user) {
      if (user.role !== 'admin') {
        console.log("AdminLayout: User is not admin, navigating to home");
        navigate("/"); // Or another appropriate non-admin page
        return;
      }
      // If user is admin and bookings haven't been fetched, fetch them
      if (!isAdminBookingsFetched) {
        console.log("AdminLayout: User is admin, triggering fetchAdminBookings");
        fetchAdminBookings();
      }
    }
  }, [status, user, navigate, fetchAdminBookings, isAdminBookingsFetched]);

  // Effect to handle missing zipCode (existing)
  useEffect(() => {
    if (status === "authorized" && user && !user.zipCode) {
      console.log("AdminLayout: User authorized but missing zipCode, navigating to /add-address");
      navigate("/add-address");
    }
  }, [status, user, navigate]);

  // Render logic based on auth status:

  // Show loader if auth status is pending (still checking/rehydrating)
  // or if useAuth reports loading (e.g., during login process initiated elsewhere)
  if (status === "pending" || authLoading) {
    console.log("AdminLayout: Rendering Loader (status pending or authLoading)");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Send to login page if explicitly unauthorized
  if (status === "unauthorized") {
    console.log("AdminLayout: Status unauthorized, navigating to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Check admin role again before rendering outlet
  if (status === "authorized" && user?.role === 'admin') {
    console.log("AdminLayout: Status authorized as admin, rendering main layout");
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 mt-20">
          {/* Optional: Welcome message based on user */}
          {user?.firstName && (
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Welcome <span className="text-indigo-600">{user.firstName}</span>!
            </h1>
          )}
          {/* Render nested routes */}
          <Suspense fallback={
            <div className="py-10 flex justify-center">
              <Loader />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  // Fallback case (e.g., authorized but not admin, should have been redirected by effect)
  console.warn(`AdminLayout: Reached fallback render case with status: ${status} and role: ${user?.role}`);
  // Redirect non-admins explicitly here as a safety net if the effect fails
  if (status === "authorized" && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return null; // Or return loader/error if appropriate
};
