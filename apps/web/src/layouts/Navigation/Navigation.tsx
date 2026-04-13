import { Navbar22 } from "@/components/navbar22";

const Navigation = () => {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4">
        <Navbar22 className="py-1" />
      </div>
    </header>
  );
};

export default Navigation;
