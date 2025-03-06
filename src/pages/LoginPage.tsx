import { FormEvent, useState } from "react";
import { useAuthStore } from "../stores";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const LoginPage = () => {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({email: "", password: "",});

  const loginUser = useAuthStore((state) => state.loginUser);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { email, password } = credentials;
    if([email, password].includes('')) return toast.error('Todos los campos son obligatarios');
    try {
      await loginUser(email, password);
      navigate("/");
    } catch (error) {
      console.log("Authentication failed.");
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
        Log In.
      </h2>
      <form className="mt-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700">Email.</label>
          <input
            type="email"
            placeholder="correo@correo.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
            name="email"
            value={credentials.email}
            onChange={handleChange}
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
          />
        </div>
        <p className="mt-2 text-gray-500">
          Don't have an account? <Link to={"register"} className="text-indigo-600 underline">Create Account</Link>
        </p>
        <button
          type="submit"
          className="w-full block bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
        >
          Access
        </button>
      </form>
    </>
  );
};
