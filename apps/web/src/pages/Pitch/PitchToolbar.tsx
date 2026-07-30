import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

const PitchToolbar = ({ current, total, onPrev, onNext }: Props) => {
  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-full border border-border bg-card/85 px-4 py-2.5 shadow-lg backdrop-blur-lg">
        <a
          href="/"
          aria-label="Exit pitch"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </a>

        <div className="flex items-center gap-1.5 border-x border-border px-4">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === current ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={current === 0}
            onClick={onPrev}
            className="text-foreground transition-opacity disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={current === total - 1}
            onClick={onNext}
            className="text-foreground transition-opacity disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchToolbar;
