import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    name: "Dr. Osei",
    role: "Haematologist",
    quote:
      "When patients come in with Hemo data, the conversation becomes much more focused and useful.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mb-14 flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="w-fit">
          <Star className="size-3" />
          Early Stories
        </Badge>
        <h2 className="max-w-2xl text-balance text-4xl font-bold sm:text-5xl">
          Real feedback from patients, caregivers, and clinicians
        </h2>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Hemo is being shaped around everyday SCD realities, not generic health tracking assumptions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.name} className="rounded-2xl border">
            <CardContent className="flex flex-col gap-4 px-6 py-6">
              <p className="text-sm leading-relaxed text-muted-foreground">"{item.quote}"</p>
              <Separator />
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
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
