import { Section } from "@/components/Section";

const PrivacyPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero header */}
      <div className="text-center">
        <p className="text-sm font-medium text-primary">Last updated: May 21, 2026</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">Privacy Policy</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Your privacy matters to us at Hemo. We respect your privacy regarding any information
          we may collect from you across our website and app.
        </p>
      </div>

      {/* Body */}
      <div className="mt-14 space-y-10 text-base text-foreground">
        {/* Intro */}
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This Privacy Notice for Hemo SCD ('we', 'us', or 'our') describes how and why we
            may collect, store, use, and share your personal information when you interact with
            our services, including when you:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Visit our website at <a href="https://www.hemo-scd.com" className="text-primary hover:underline">hemo-scd.com</a></li>
            <li>Join our waitlist to receive early access and launch updates</li>
            <li>Download and use the Hemo mobile app once it is available</li>
            <li>Contact us or engage with us in other related ways</li>
          </ul>
        </div>

        {/* Callout box */}
        <div className="rounded-2xl bg-muted px-6 py-5 space-y-2">
          <h2 className="text-base font-semibold">Questions or concerns?</h2>
          <p className="text-sm text-muted-foreground">
            Reading this Privacy Notice will help you understand your privacy rights and choices.
            If you do not agree with our policies and practices, please do not use our services.
            If you have any questions or concerns, please contact us at{" "}
            <a href="mailto:info@hemo-scd.com" className="text-primary hover:underline">
              info@hemo-scd.com
            </a>.
          </p>
        </div>

        <Section heading="What information do we collect?">
          <p className="text-muted-foreground">
            At this stage, Hemo is pre-launch. The only personal information we collect is your
            email address when you join our waitlist. We do not collect health data, location,
            payment details, or any other personal information through this website.
          </p>
          <p className="text-muted-foreground">
            Once the app is live, we will collect information you voluntarily provide — such as
            account details, health log entries, and care preferences — to deliver app
            functionality. This notice will be updated with full detail before that time.
          </p>
        </Section>

        <Section heading="How do we use your information?">
          <p className="text-muted-foreground">
            Your email address is used solely to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Notify you when Hemo launches</li>
            <li>Share relevant pre-launch updates and early access information</li>
          </ul>
          <p className="text-muted-foreground">
            We do not use your email for advertising, profiling, or any purpose beyond the above.
          </p>
        </Section>

        <Section heading="Do we share your information?">
          <p className="text-muted-foreground">
            We do not sell, trade, or share your personal information with third parties. Your
            email address is stored securely and is only accessible to the Hemo team.
          </p>
        </Section>

        <Section heading="How long do we keep your information?">
          <p className="text-muted-foreground">
            We keep your email address on the waitlist until you request removal or until the
            waitlist is closed at launch. You can ask us to delete your information at any time.
          </p>
        </Section>

        <Section heading="Your rights">
          <p className="text-muted-foreground">
            Depending on your location, you may have the right to access, correct, or delete
            your personal data. To exercise any of these rights — including removing yourself
            from the waitlist — contact us at{" "}
            <a href="mailto:info@hemo-scd.com" className="text-primary hover:underline">
              info@hemo-scd.com
            </a>{" "}
            and we will respond promptly.
          </p>
        </Section>

        <Section heading="Changes to this policy">
          <p className="text-muted-foreground">
            We may update this Privacy Notice from time to time. The updated version will be
            indicated by an updated 'Current as of' date at the top of this page. If we make
            material changes to this Privacy Notice, we may notify you either by prominently
            posting a notice of such changes or by directly sending you a notification to the
            email address you provided. We encourage you to review this Privacy Notice
            frequently to be informed of how we are protecting your information.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPage;
