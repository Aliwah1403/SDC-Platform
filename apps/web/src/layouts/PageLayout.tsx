import React from "react";
import { Outlet } from "react-router";
import Footer from "./Footer";
import Navigation from "./Navigation/Navigation";

const PageLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* Navigation */}
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
