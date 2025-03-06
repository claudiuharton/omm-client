import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { AdminLayout } from "../layouts/AdminLayout";
import { NewProduct } from "../pages/NewProduct";
import { RegisterUser } from "../pages/RegisterUser";
import { CheckAddress } from "../pages/CheckAddress";
import {ThankYou} from "../pages/ThankYou.tsx";

export const AppRouter = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<LoginPage />} />
          <Route path="register" element={<RegisterUser />} />
        </Route>

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<HomePage />} />
          <Route path="thank-you" element={<ThankYou />} />
          <Route path="new-car" element={<NewProduct />} />
          <Route path="add-address" element={<CheckAddress />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
