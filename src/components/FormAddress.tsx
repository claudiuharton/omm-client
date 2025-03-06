import {FormEvent, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "sonner";
import {useAuthStore} from "../stores";
import {allowedPostCodeRegex, zipCodeRegex} from "../helpers/helpers.ts";



export const FormAddress = () => {
    const addAddress = useAuthStore((state) => state.addAddress);

    const navigate = useNavigate();

    const [item, setItem] = useState({
        zipCode: "",

    });

    const handleChange = (e: FormEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.currentTarget;

        setItem((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const {zipCode} = item;
        if ([zipCode].includes(""))
            return toast.error("Zip code cannot be empty");
        else if (!zipCodeRegex.test(zipCode)){
            return toast.error("Invalid ZIP Code");
        }
        else if (!allowedPostCodeRegex.test(zipCode)){
            return toast.error("The service supports only Birmingham, Coventry, Leicester, Dudley, Wolverhampton and Walsall.");
        }
        try {
            await addAddress(zipCode);
            toast.success("ZIP Code added successfully");
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="md:w-2/3 lg:w-1/2 bg-white p-10 shadow-lg flex flex-col gap-2 ">
            <h2 className="text-gray-600 uppercase text-center text-xl font-bold">
                Add your Postal Code
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 ">
                <input
                    type="text"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-gray-500 outline-none"
                    placeholder="Postal code"
                    name="zipCode"
                    value={item.zipCode}
                    onChange={handleChange}
                />

                <button className="bg-indigo-600 py-3 rounded-md text-white uppercase font-medium">
                    Add Postal Code
                </button>
            </form>

        </div>
    );
};
