import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import PageLayout from "./layouts/PageLayout";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import FeaturesPage from "./pages/FeaturesPage";
import Homepage from "./pages/Homepage";
import MedicalDisclaimerPage from "./pages/MedicalDisclaimerPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import WhyHemoPage from "./pages/WhyHemoPage";

import "./index.css";

const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      { path: "/why-hemo", element: <WhyHemoPage /> },
      { path: "/features", element: <FeaturesPage /> },
      { path: "/pricing", element: <PricingPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/faq", element: <FaqPage /> },
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/medical-disclaimer", element: <MedicalDisclaimerPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
