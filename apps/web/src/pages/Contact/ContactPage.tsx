"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GlobeIcon, LoaderIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";

interface ContactFormDetailsProps {
  title: string;
  description: string;
  phone: string;
  email: string;
  web: { label: string; url: string };
  formSubheading: string;
  formHeading: string;
  successMessage: string;
  submitLabel: string;
  submittingLabel: string;
  className?: string;
}

interface Contact2Props extends ContactFormDetailsProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
}
type Props = Partial<Contact2Props>;

const defaultProps: Contact2Props = {
  title: `Let's start a conversation`,
  description:
    "Have a question about support, clinician access, partnerships, or launch timing? Send us a message and our team will get back to you.",
  phone: "+1 (555) 010-2400",
  email: "hello@hemo-scd.com",
  web: {
    label: "hemo-scd.com",
    url: "https://www.hemo-scd.com",
  },
  formSubheading: "We usually reply within 1-2 business days.",
  formHeading: "Send us a message",
  successMessage: "Thanks - your message is in our inbox.",
  submitLabel: "Send message",
  submittingLabel: "Sending...",
};

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email().min(1, "Email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const Contact2 = (props: Props) => {
  const {
    title,
    description,
    phone,
    email,
    web,
    formHeading,
    formSubheading,
    successMessage,
    submitLabel,
    submittingLabel,
    className,
    onSubmit,
  } = { ...defaultProps, ...props };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log("Form submitted:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      setShowSuccess(true);
      form.reset();
      setTimeout(() => setShowSuccess(false), 4500);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      form.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-24">
          <div className="flex flex-1 flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-semibold tracking-tight text-pretty md:text-3xl lg:text-4xl">
                {title}
              </h1>
              <p className="text-muted-foreground lg:text-balance lg:text-md">
                {description}
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <a
                href={`tel:${phone}`}
                className="group flex items-center gap-3"
              >
                <PhoneIcon className="size-5 text-muted-foreground" />
                <span className="group-hover:underline">{phone}</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="group flex items-center gap-3"
              >
                <MailIcon className="size-5 text-muted-foreground" />
                <span className="group-hover:underline">{email}</span>
              </a>
              <a
                href={web.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${web.label} (opens in new tab)`}
                className="group flex items-center gap-3"
              >
                <GlobeIcon className="size-5 text-muted-foreground" />
                <span className="group-hover:underline">{web.label}</span>
              </a>
            </div>
          </div>
          <div className="flex-1">
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="flex flex-col gap-6 rounded-xl bg-muted/50 p-8 md:p-10"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight text-balance">
                  {formHeading}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formSubheading}
                </p>
              </div>
              {isSubmitted && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center transition-opacity duration-500",
                    showSuccess ? "opacity-100" : "opacity-0",
                  )}
                >
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {successMessage}
                  </p>
                </div>
              )}
              <FieldGroup className="gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="firstName"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          First Name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="Jordan"
                          className="bg-background"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="lastName"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Last Name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="Kim"
                          className="bg-background"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="email"
                        aria-invalid={fieldState.invalid}
                        placeholder="you@company.com"
                        className="bg-background"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="subject"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Subject <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="Question about Hemo"
                        className="bg-background"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="message"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Message <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="Tell us what you are looking for..."
                        rows={4}
                        className="bg-background"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <LoaderIcon className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {form.formState.isSubmitting ? submittingLabel : submitLabel}
                </Button>
              </FieldGroup>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactPage = () => {
  return <Contact2 />;
};

export { Contact2 };
export default ContactPage;
