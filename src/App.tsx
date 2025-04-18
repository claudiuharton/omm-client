import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
// Import AppRouter
import { AppRouter } from "./routes/AppRouter";
import { useEffect } from "react";
import { useAuthStore } from "./stores";

/**
 * Main App component that sets up the application structure
 * - Error boundaries for graceful error handling
 * - Toast notifications system
 */
const App = () => {
  // Check authentication status when app starts
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    console.log("App mounted - checking auth status");
    checkAuthStatus().catch(err => {
      console.error("Initial auth check failed:", err);
    });
  }, [checkAuthStatus]);

  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: "text-sm"
        }}
      />
    </ErrorBoundary>
  );
};

export default App;
