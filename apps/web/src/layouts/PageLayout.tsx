import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import Footer from "./Footer";
import Navigation from "./Navigation/Navigation";

const PageLayout = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
