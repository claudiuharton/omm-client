import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../stores";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser, loading, error } = useAuth();

  const [credentials, setCredentials] = useState({ email: "", password: "", });
  const [loginStatus, setLoginStatus] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { email, password } = credentials;
    if ([email, password].includes('')) return toast.error('All fields are required');

    setLoginStatus("Attempting to login...");
    try {
      const success = await loginUser(email, password);
      if (success) {
        setLoginStatus("Login successful! Redirecting...");
        toast.success("Login successful!");

        // Brief delay before redirect to show success message and ensure store is updated
        setTimeout(() => {
          // Get current user from store
          const currentState = useAuthStore.getState();
          const user = currentState.user;

          console.log("User role:", user?.role);
          console.log("User zipCode:", user?.zipCode);

          // Role-based redirect
          if (user && user.role === "mechanic") {
            console.log("Redirecting to mechanic dashboard");
            navigate("/mechanic-dashboard");
          } else if (user && !user.zipCode) {
            // If user has no address, redirect to add address
            console.log("Redirecting to add address");
            navigate("/add-address");
          } else {
            // Default destination for clients with address
            console.log("Redirecting to client dashboard");
            navigate("/client-dashboard");
          }
        }, 800); // Slightly longer delay to ensure store is updated
      } else {
        setLoginStatus("Login failed.");
        // Error is already handled in the useAuth hook
      }
    } catch (err) {
      setLoginStatus("Login failed due to an unexpected error.");
      toast.error("Login failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setCredentials(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold leading-tight mt-12 text-gray-600 uppercase">
        Log In
      </h2>

      {/* Login status message */}
      {loginStatus && (
        <div className="mt-3 text-sm font-medium text-indigo-600">
          {loginStatus}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <form className="mt-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="mt-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            placeholder="**************"
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500
          focus:bg-white focus:outline-none"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-gray-500">
            Don't have an account? <Link to={"register"} className="text-indigo-600 underline">Create Account</Link>
          </p>
          <p className="text-gray-500">
            Are you a mechanic? <Link to={"register-mechanic"} className="text-indigo-600 underline">Register as a Mechanic</Link>
          </p>
        </div>
        <button
          type="submit"
          className="w-full block bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </>
  );
};
