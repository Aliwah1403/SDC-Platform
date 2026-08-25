import { Heading, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface PasswordResetVerificationProps {
  firstName: string;
  token: string;
}

export default function PasswordResetVerification({ firstName, token }: PasswordResetVerificationProps) {
  return (
    <EmailLayout preview="Your Hemo verification code">
      <Heading style={{ color: colors.ink, fontSize: 26, lineHeight: "32px", margin: "0 0 16px" }}>
        Your verification code
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Use this one-time code to continue in Hemo. It will expire shortly.
      </Text>
      <Section
        style={{
          borderBottom: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.border}`,
          margin: "24px 0",
          padding: "20px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            color: colors.rose,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: "40px",
            margin: 0,
          }}
        >
          {token}
        </Text>
      </Section>
      <Text style={smallTextStyle}>
        If you didn’t request this code, you can ignore this email. Your account
        remains secure.
      </Text>
    </EmailLayout>
  );
}

PasswordResetVerification.PreviewProps = {
  firstName: "Amara",
  token: "482913",
} satisfies PasswordResetVerificationProps;
