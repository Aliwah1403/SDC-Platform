import { Heading, Text } from "react-email";
import { EmailLayout, colors } from "./_components/EmailLayout";

export interface PasswordResetVerificationProps {
  firstName: string;
  token: string;
}

export default function PasswordResetVerification({ firstName, token }: PasswordResetVerificationProps) {
  return (
    <EmailLayout preview="Your Hemo verification code">
      <Heading style={{ color: colors.ink, fontSize: 26, margin: "0 0 16px" }}>Your verification code</Heading>
      <Text style={{ color: colors.ink, fontSize: 16, lineHeight: "25px" }}>Hi {firstName},</Text>
      <Text style={{ color: colors.muted, fontSize: 16, lineHeight: "25px" }}>
        Use the code below to reset your Hemo password. If you did not request this, you can ignore this email.
      </Text>
      <Text style={{ backgroundColor: colors.cream, color: colors.rose, fontSize: 32, fontWeight: 700, letterSpacing: 6, margin: "24px 0", padding: "18px 20px", textAlign: "center" as const }}>
        {token}
      </Text>
    </EmailLayout>
  );
}

PasswordResetVerification.PreviewProps = {
  firstName: "Amara",
  token: "482913",
} satisfies PasswordResetVerificationProps;
