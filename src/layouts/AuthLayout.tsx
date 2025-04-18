import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores";
import { Loader } from "../components/Loader";

export const AuthLayout = () => {
    const authStatus = useAuthStore((state) => state.status);

    // Handle loading/pending state
    if (authStatus === "pending") {
        console.log("AuthLayout: Rendering loader (status pending)");
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    // Only redirect if user is authorized, skip loading state
    if (authStatus === "authorized") return <Navigate to="/" />;

    return (
        <div>
            <main>
                <section className="flex flex-col md:flex-row h-screen items-center">
                    <div className="bg-indigo-600 hidden lg:block w-full md:w-1/2 xl:w-2/3 h-screen">
                        <img
                            src="https://placehold.co/800x600/6366f1/ffffff?text=Our+mobile+mechanic"
                            alt="Decorative background image for authentication section"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div
                        className="bg-white w-full md:max-w-md lg:max-w-full md:mx-auto md:w-1/2 xl:w-1/3 h-screen px-6 lg:px-16 xl:px-12 flex items-center justify-center"
                    >
                        <div className="w-full h-100">
                            <Outlet />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};
