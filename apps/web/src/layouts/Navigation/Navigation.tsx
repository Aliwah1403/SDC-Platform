import { Navbar22 } from "@/components/navbar22";

const scrollToWaitlist = () => {
  document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
};

const Navigation = () => {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4">
        <Navbar22
          className="py-2"
          onJoinWaitlistClick={scrollToWaitlist}
        />
      </div>
    </header>
  );
};

export default Navigation;