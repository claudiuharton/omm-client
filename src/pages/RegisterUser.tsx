import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../stores";

export const RegisterUser = () => {
  const registerUser = useAuthStore(state => state.registerUser);

  const navigate = useNavigate();
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone:"",
  });

  const { firstName,lastName, email, password,phone } = user;

  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async ( e: FormEvent<HTMLFormElement> ) => {
    e.preventDefault();
    if ([firstName,lastName,phone, email, password].includes(""))
      return toast.error("All fields are required");

    try {
      await registerUser(user);
      toast.success("User registered successfully");
      navigate("/auth");
    } catch (error) {
      toast.error(`${error}`)
    }
  };

  return (
    <>
      <h2 className="text-xl md:text-2xl font-bold leading-tight mt-12 text-gray-600 uppercase">
        Register
      </h2>
      <form className="mt-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700">First Name</label>
          <input
              type="text"
              placeholder="Insert your first name"
              className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
              name="firstName"
              value={firstName}
              onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-gray-700">Last Name</label>
          <input
              type="text"
              placeholder="Insert your last name"
              className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
              name="lastName"
              value={lastName}
              onChange={handleChange}
          />
        </div>
        <div className="mt-4">
          <label className="block text-gray-700">Phone</label>
          <input
              type="phone"
              placeholder="Insert your phone number"
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500
              focus:bg-white focus:outline-none"
              name="phone"
              value={phone}
              onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-gray-700">Email.</label>
          <input
              type="email"
              placeholder="correo@correo.com"
              className="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none"
              name="email"
              value={email}
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
              value={password}
              onChange={handleChange}
          />
        </div>

        <p className="mt-2 text-gray-500">
          Already have an account?{" "}
          <Link to={"/auth"} className="text-indigo-600 underline">
            Log In.
          </Link>
        </p>
        <button
            type="submit"
            className="w-full block bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg px-4 py-3 mt-6"
        >
          Register
        </button>
      </form>
    </>
  );
};
