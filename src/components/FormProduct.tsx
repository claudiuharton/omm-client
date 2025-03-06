import {FormEvent, useState} from "react";
import {useCarStore} from "../stores";
import {useNavigate} from "react-router-dom";
import {toast} from "sonner";

export const FormProduct = () => {
    const carLoading = useCarStore((state) => state.carLoading);
    const createCar = useCarStore((state) => state.createCar);

    const navigate = useNavigate();

    const [item, setItem] = useState({
        carNumber: "",

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
        const {carNumber} = item;
        if ([carNumber].includes(""))
            return toast.error("All fields are mandatory.");
        try {
            await createCar(item);
            navigate("/");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="md:w-2/3 lg:w-1/2 bg-white p-10 shadow-lg flex flex-col gap-2 ">
            <h2 className="text-gray-600 uppercase text-center text-xl font-bold">
                Register new car
            </h2>
            {carLoading ? <p>Car is being added</p>
                : <form onSubmit={handleSubmit} className="flex flex-col gap-2 ">
                    <input
                        type="text"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-gray-500 outline-none"
                        placeholder="Car plate"
                        name="carNumber"
                        value={item.carNumber}
                        onChange={handleChange}
                    />

                    <button className="bg-indigo-600 py-3 rounded-md text-white uppercase font-medium">
                        Add car
                    </button>
                </form>}
        </div>
    );
};
