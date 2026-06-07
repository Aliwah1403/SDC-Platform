import type { ReactElement, ReactNode } from "react";
import { PDFDownloadLink, type DocumentProps } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── PageNav ───────────────────────────────────────────────────────────────────

interface PageNavProps {
  document: ReactElement<DocumentProps>;
  fileName: string;
  meta: ReactNode;
  onDownload?: () => void;
}

export function PageNav({ document, fileName, meta, onDownload }: PageNavProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-[#F0E4E1] bg-[#F8F4F0]/85 backdrop-blur supports-backdrop-filter:bg-[#F8F4F0]/65">
      <div className="mx-auto flex max-w-240 items-center gap-4 px-6 py-3 max-sm:px-4">
        <a href="/" className="relative z-20 mr-4 flex items-center px-2 py-1">
          <img src="/logo.png" alt="Hemo" className="h-9 w-9" />
          <span className="text-sm font-bold text-primary">Hemo</span>
        </a>

        <div className="flex flex-1 items-center gap-2.5 text-[13px] text-[#1A1414]/65 max-md:hidden">
          {meta}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <PDFDownloadLink document={document} fileName={fileName} onClick={onDownload}>
            {({ loading }) => (
              <Button
                size="lg"
                variant="ghost"
                className="gap-1.5 text-[13px] font-semibold text-[#1A1414]/65 hover:bg-[#1A1414]/[0.07] hover:text-[#1A1414]"
              >
                <Download className="size-3.5" />
                {loading ? "Preparing…" : "PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}

// ── PageFooter ────────────────────────────────────────────────────────────────

interface PageFooterProps {
  disclaimer: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function PageFooter({
  disclaimer,
  className,
  containerClassName,
}: PageFooterProps) {
  return (
    <footer
      className={cn("border-t border-[#F0E4E1]", className)}
    >
      <div className={cn("text-center", containerClassName)}>
        <a href="/" className="relative z-20 inline-flex items-center gap-1.5">
          <img src="/logo.png" alt="Hemo" className="size-10" />
          <span className="text-sm font-bold text-primary">Hemo</span>
        </a>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#1A1414]/55">
          A daily companion for people living with sickle cell disease.
        </p>
        <p className="mt-6 text-[12px] leading-relaxed text-[#1A1414]/40">
          {disclaimer}
        </p>
      </div>
    </footer>
  );
}
