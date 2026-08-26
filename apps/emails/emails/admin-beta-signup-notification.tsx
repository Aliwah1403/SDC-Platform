import { Heading, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface AdminBetaSignupNotificationProps {
  name: string;
  email: string;
  platform: string;
  googleEmail: string;
  phoneModel: string;
  alreadyOnWaitlist: string;
  signedUpAt: string;
  wishes: string;
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

function Detail({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <Section
      style={{
        borderBottom: last ? undefined : `1px solid ${colors.border}`,
        padding: "14px 0",
      }}
    >
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle}>{value}</Text>
    </Section>
  );
}

export default function AdminBetaSignupNotification({
  name,
  email,
  platform,
  googleEmail,
  phoneModel,
  alreadyOnWaitlist,
  signedUpAt,
  wishes,
}: AdminBetaSignupNotificationProps) {
  return (
    <EmailLayout preview={`New Hemo beta signup from ${name}`}>
      <Heading
        style={{
          color: colors.ink,
          fontSize: 26,
          lineHeight: "32px",
          margin: "0 0 16px",
        }}
      >
        Someone joined the beta
      </Heading>
      <Text style={bodyTextStyle}>
        A new person has signed up to try Hemo. Their responses are below so you
        can follow up with the right context.
      </Text>
      <Section
        style={{
          borderBottom: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <Detail label="Name" value={name} />
        <Detail label="Email address" value={email} />
        <Detail label="Device" value={platform} />
        <Detail label="Google account" value={googleEmail} />
        <Detail label="Phone model" value={phoneModel} />
        <Detail label="Already on waitlist" value={alreadyOnWaitlist} />
        <Detail label="Joined" value={signedUpAt} />
        <Detail label="What they hope for" value={wishes} last />
      </Section>
      <Text style={{ ...bodyTextStyle, color: colors.muted, margin: "20px 0 0" }}>
        Keep their feedback close as you prepare the next beta conversation.
      </Text>
    </EmailLayout>
  );
}

AdminBetaSignupNotification.PreviewProps = {
  name: "Amara Ali",
  email: "amara@example.com",
  platform: "iPhone",
  googleEmail: "—",
  phoneModel: "iPhone 15 Pro",
  alreadyOnWaitlist: "Yes",
  signedUpAt: "24 Aug 2026, 10:30 UTC",
  wishes: "A clearer way to prepare for appointments.",
} satisfies AdminBetaSignupNotificationProps;
