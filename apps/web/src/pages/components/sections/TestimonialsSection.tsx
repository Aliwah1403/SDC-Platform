import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Amara",
    role: "SCD Community Member",
    quote:
      "Hemo makes it easier to explain how I've been feeling between clinic visits. My doctor actually noticed the difference.",
  },
  {
    name: "Jordan",
    role: "Caregiver",
    quote:
      "The daily logs helped us catch patterns we kept missing before. We finally have a clear picture of what triggers flares.",
  },
  {
    name: "Tariq",
    role: "Adult SCD Patient",
    quote:
      "Simple, fast, and built for real life. It keeps me consistent without feeling like another chore.",
  },
  {
    name: "Fatima",
    role: "Parent & Advocate",
    quote:
      "Having everything — meds, contacts, logs — in one place has reduced so much anxiety around managing my daughter's care.",
  },
  {
    name: "Dr. Osei",
    role: "Haematologist",
    quote:
      "When patients come in with Hemo data, the conversation becomes so much richer. I wish more tools were built this thoughtfully.",
  },
  {
    name: "Marcus",
    role: "College Student, SCD",
    quote:
      "The streak system keeps me honest. I've logged every day for 6 weeks — that's never happened before.",
  },
];

const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="flex flex-col items-center gap-4 text-center mb-14">
        <Badge variant="secondary" className="w-fit">
          <Star className="size-3" />
          Testimonials
        </Badge>
        <h2 className="max-w-xl text-balance text-4xl font-bold sm:text-5xl">
          Hear What Our Amazing Users Are Saying
        </h2>
        <p className="max-w-lg text-balance text-muted-foreground">
          Honest feedback from our early users who love how Hemo connects,
          informs, and supports their daily lives.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item, i) => (
          <Card
            key={item.name}
            className={`rounded-2xl border ${i === 1 || i === 4 ? "lg:-translate-y-3 shadow-md" : ""}`}
          >
            <CardContent className="flex flex-col gap-4 pt-6 pb-6 px-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{item.quote}"
              </p>
              <Separator />
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">
                    {item.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
