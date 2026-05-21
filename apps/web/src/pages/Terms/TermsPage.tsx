import { Section } from "@/components/Section";

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero header */}
      <div className="text-center">
        <p className="text-sm font-medium text-primary">Current as of May 21, 2026</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">Terms of Use</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Please read these terms carefully before using Hemo or joining our waitlist.
          By accessing our website or services, you agree to be bound by these terms.
        </p>
      </div>

      {/* Body */}
      <div className="mt-14 space-y-10 text-base text-foreground">
        {/* Intro */}
        <p className="text-muted-foreground">
          These Terms of Use govern your access to and use of the Hemo website and, once
          available, the Hemo mobile application ('Services'), operated by Hemo SCD ('we',
          'us', or 'our'). By using our Services, you confirm that you accept these terms.
        </p>

        {/* Callout box */}
        <div className="rounded-2xl bg-muted px-6 py-5 space-y-2">
          <h2 className="text-base font-semibold">Questions or concerns?</h2>
          <p className="text-sm text-muted-foreground">
            If you have any questions about these terms or how they apply to you, please
            contact us at{" "}
            <a href="mailto:info@hemo-scd.com" className="text-primary hover:underline">
              info@hemo-scd.com
            </a>{" "}
            and we will be happy to help.
          </p>
        </div>

        <Section heading="Not a medical service">
          <p className="text-muted-foreground">
            Hemo is a health tracking and management tool. It is not a medical device, a
            diagnostic tool, or a substitute for professional medical advice, diagnosis, or
            treatment. Nothing within Hemo should be interpreted as clinical guidance.
          </p>
          <p className="text-muted-foreground">
            Always seek the advice of a qualified healthcare provider with any questions you
            may have regarding a medical condition. In an emergency, contact your local
            emergency services immediately. The in-app SOS feature is a convenience tool
            for alerting personal contacts — it is not a replacement for calling emergency
            services.
          </p>
        </Section>

        <Section heading="Use of service">
          <p className="text-muted-foreground">
            You may use Hemo for personal, non-commercial health tracking purposes only. You
            agree not to misuse the Services, attempt to gain unauthorised access, or use the
            Services in any way that could harm others or disrupt the platform.
          </p>
          <p className="text-muted-foreground">
            You must be at least 13 years of age to use Hemo. If you are under 18, you should
            review these terms with a parent or guardian.
          </p>
        </Section>

        <Section heading="Waitlist">
          <p className="text-muted-foreground">
            By joining the Hemo waitlist, you agree to receive email communications about the
            app's launch and pre-launch updates. You can unsubscribe at any time by contacting
            us at{" "}
            <a href="mailto:info@hemo-scd.com" className="text-primary hover:underline">
              info@hemo-scd.com
            </a>.
          </p>
        </Section>

        <Section heading="Account responsibilities">
          <p className="text-muted-foreground">
            Once the app is live, you are responsible for maintaining the security of your
            account credentials and for all activity that occurs under your account. You agree
            to notify us immediately of any unauthorised access or breach of security.
          </p>
        </Section>

        <Section heading="Intellectual property">
          <p className="text-muted-foreground">
            All content, branding, and materials on the Hemo website and app — including the
            name, logo, and design — are owned by Hemo SCD. You may not reproduce, distribute,
            or create derivative works from any part of our Services without our written
            permission.
          </p>
        </Section>

        <Section heading="Availability and changes">
          <p className="text-muted-foreground">
            Hemo is currently pre-launch. Features, pricing, and availability may change before
            and after release. We reserve the right to modify or discontinue any part of the
            Services at any time. We will make reasonable efforts to communicate significant
            changes to waitlist members.
          </p>
        </Section>

        <Section heading="Limitation of liability">
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, Hemo SCD shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of our
            Services. Our Services are provided 'as is' without warranties of any kind.
          </p>
        </Section>

        <Section heading="Changes to these terms">
          <p className="text-muted-foreground">
            We may update these terms from time to time. The 'Current as of' date at the top
            of this page will reflect when changes were last made. Continued use of the
            Services after any update constitutes your acceptance of the revised terms.
          </p>
        </Section>
      </div>
    </div>
  );
};

export default TermsPage;
