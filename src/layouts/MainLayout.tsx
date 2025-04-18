import { Suspense, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import { useAuth } from "../hooks/useAuth";

/**
 * MainLayout component
 * - Provides common layout for all authenticated users
 * - Handles authentication state
 * - Includes common header and footer
 */
export const MainLayout = () => {
    const { status, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Effect to handle missing zipCode - applies to all users
    useEffect(() => {
        if (status === "authorized" && user && !user.zipCode) {
            console.log("MainLayout: User authorized but missing zipCode, navigating to /add-address");
            navigate("/add-address");
        }
    }, [status, user, navigate]);

    // Show loader if auth status is pending/checking or during auth operations
    if (status === "pending" || authLoading) {
        console.log("MainLayout: Rendering Loader (status pending or authLoading)");
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader />
            </div>
        );
    }

    // Redirect to login if unauthorized
    if (status !== "authorized") {
        console.log("MainLayout: Status unauthorized, navigating to /auth");
        return <Navigate to="/auth" replace />;
    }

    // Render main layout for authorized users
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 mt-20">
                {/* Welcome message based on user */}
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
}; 