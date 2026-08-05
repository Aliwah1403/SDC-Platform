import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Blog14, type Blog14Post } from "./_Blog14";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

interface BlogIndexPageProps {
  posts: Blog14Post[];
}

export default function BlogIndexPage({ posts }: BlogIndexPageProps) {
  return (
    <div>
      <Blog14
        heading="Sickle cell guides & resources"
        description="Practical, sourced guidance for living well with sickle cell disease."
        posts={posts}
        formatDate={formatDate}
        emptyMessage="New guides are on the way — join the waitlist to hear when they land."
      />

      <PageWaitlistCTA
        title="Get new guides as they publish"
        description="Join the waitlist for early access to Hemo and a heads-up when new sickle cell guides go live."
      />
    </div>
  );
}
