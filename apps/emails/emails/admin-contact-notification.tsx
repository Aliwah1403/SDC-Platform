import { Heading, Link, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface AdminContactNotificationProps {
  senderFirstName: string;
  senderLastName: string;
  senderEmail: string;
  subject: string;
  message: string;
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

export default function AdminContactNotification({
  senderFirstName,
  senderLastName,
  senderEmail,
  subject,
  message,
}: AdminContactNotificationProps) {
  const senderName = `${senderFirstName} ${senderLastName}`.trim();

  return (
    <EmailLayout preview={`New message from ${senderName}: ${subject}`}>
      <Heading
        style={{
          color: colors.ink,
          fontSize: 26,
          lineHeight: "32px",
          margin: "0 0 16px",
        }}
      >
        A new message for Hemo
      </Heading>
      <Text style={bodyTextStyle}>
        {senderName} reached out through the Hemo contact form. Here’s the
        message they sent:
      </Text>
      <Section
        style={{
          borderBottom: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.border}`,
          padding: "16px 0",
        }}
      >
        <Text style={labelStyle}>From</Text>
        <Text style={{ color: colors.ink, fontSize: 16, lineHeight: "24px", margin: "4px 0 0" }}>
          {senderName} ·{" "}
          <Link href={`mailto:${senderEmail}`} style={{ color: colors.rose }}>
            {senderEmail}
          </Link>
        </Text>
        <Text style={{ ...labelStyle, marginTop: 16 }}>Subject</Text>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: 700, lineHeight: "24px", margin: "4px 0 0" }}>
          {subject}
        </Text>
      </Section>
      <Section style={{ padding: "20px 0 0" }}>
        <Text style={labelStyle}>Message</Text>
        <Text
          style={{
            color: colors.ink,
            fontSize: 16,
            lineHeight: "26px",
            margin: "8px 0 0",
            whiteSpace: "pre-wrap" as const,
          }}
        >
          {message}
        </Text>
      </Section>
      <Text style={{ ...bodyTextStyle, color: colors.muted, margin: "24px 0 0" }}>
        Reply directly to this email to follow up with {senderFirstName}.
      </Text>
    </EmailLayout>
  );
}

AdminContactNotification.PreviewProps = {
  senderFirstName: "Amara",
  senderLastName: "Ali",
  senderEmail: "amara@example.com",
  subject: "Question about Hemo",
  message: "I would like to learn more about the beta.",
} satisfies AdminContactNotificationProps;
