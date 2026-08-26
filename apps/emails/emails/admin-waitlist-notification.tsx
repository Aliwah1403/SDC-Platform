import { Heading, Link, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface AdminWaitlistNotificationProps {
  signupEmail: string;
  source: string;
  signedUpAt: string;
}

const labelStyle = {
  color: colors.muted,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: "16px",
  margin: 0,
  textTransform: "uppercase" as const,
};

const valueStyle = {
  color: colors.ink,
  fontSize: 16,
  lineHeight: "24px",
  margin: "4px 0 0",
};

export default function AdminWaitlistNotification({
  signupEmail,
  source,
  signedUpAt,
}: AdminWaitlistNotificationProps) {
  return (
    <EmailLayout preview="A new person joined the Hemo waitlist">
      <Heading
        style={{
          color: colors.ink,
          fontSize: 26,
          lineHeight: "32px",
          margin: "0 0 16px",
        }}
      >
        New waitlist signup
      </Heading>
      <Text style={bodyTextStyle}>
        Someone just joined the Hemo waitlist. Here are the details to review:
      </Text>
      <Section
        style={{
          borderBottom: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.border}`,
          padding: "4px 0",
        }}
      >
        <Section style={{ borderBottom: `1px solid ${colors.border}`, padding: "14px 0" }}>
          <Text style={labelStyle}>Email address</Text>
          <Text style={valueStyle}>
            <Link href={`mailto:${signupEmail}`} style={{ color: colors.rose }}>
              {signupEmail}
            </Link>
          </Text>
        </Section>
        <Section style={{ borderBottom: `1px solid ${colors.border}`, padding: "14px 0" }}>
          <Text style={labelStyle}>Signup source</Text>
          <Text style={valueStyle}>{source}</Text>
        </Section>
        <Section style={{ padding: "14px 0" }}>
          <Text style={labelStyle}>Joined</Text>
          <Text style={valueStyle}>{signedUpAt}</Text>
        </Section>
      </Section>
      <Text style={{ ...bodyTextStyle, color: colors.muted, margin: "20px 0 0" }}>
        Consider adding this contact to the next beta update or onboarding
        communication.
      </Text>
    </EmailLayout>
  );
}

AdminWaitlistNotification.PreviewProps = {
  signupEmail: "amara@example.com",
  source: "landing-page",
  signedUpAt: "August 24, 2026 at 10:30 AM GST",
} satisfies AdminWaitlistNotificationProps;
