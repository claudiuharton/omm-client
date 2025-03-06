import { formatDate } from "../helpers/helpers";
import {useCarStore, useJobStore} from "../stores";
import {Car as CarObj} from "../interfaces/car.interface.ts";

export const Car= ({item}: {item: CarObj}) => {
  const deleteCar = useCarStore(state => state.deleteCar);
  const selectCar = useJobStore(state => state.selectCar);

  return (
    <div className="bg-white shadow-lg p-5 rounded-xl w-72">
      <div className="flex flex-col items-center gap-2">
        <h5 className="uppercase font-medium">{item.carNumber}</h5>

        <div className="flex flex-col items-center">
          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Make: <span className="font-normal capitalize text-gray-900">{item.make}</span>
          </p>
          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Model: <span className="font-normal capitalize text-gray-900">{item.model}</span>
          </p>

          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Date of manufacture: <span className="font-normal capitalize text-gray-900">{item.dateOfManufacture}</span>
          </p>

          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Engine size: <span className="font-normal capitalize text-gray-900">{item.engineSize}</span>
          </p>

          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Tec Doc K Type: <span className="font-normal capitalize text-gray-900">{item.tecDocKType}</span>
          </p>

          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            Mot expiry date: <span className="font-normal capitalize text-gray-900">{item.motExpiryDate}</span>
          </p>

          <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
            VIN: <span className="font-normal capitalize text-gray-900">{item.vin}</span>
          </p>
        </div>
        <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
          Added on: {formatDate(item.createdAt ? item.createdAt : "")}
        </p>
      </div>
      <div className="w-full flex items-center justify-between gap-2 mt-3">
        <button onClick={() => deleteCar(`${item.id}`)} className="bg-red-600 text-white rounded-xl py-2 px-4">Remove</button>
        <button onClick={() => selectCar(`${item.id}`)} className="bg-blue-600 text-white rounded-xl py-2 px-4">Add job</button>
      </div>
    </div>
  );
};
