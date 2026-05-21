import type { ReactNode } from "react";

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      {children}
    </section>
  );
}
