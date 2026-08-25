import { Heading, Text } from "react-email";
import { BrandButton, EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface SignupConfirmationProps {
  firstName: string;
  confirmationUrl: string;
}

export default function SignupConfirmation({ firstName, confirmationUrl }: SignupConfirmationProps) {
  return (
    <EmailLayout preview="Confirm your email to finish setting up Hemo">
      <Heading style={{ color: colors.ink, fontSize: 26, lineHeight: "32px", margin: "0 0 16px" }}>
        Confirm your email
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Thanks for signing up for Hemo. You’re one step away from finishing
        your account setup.
      </Text>
      <Text style={bodyTextStyle}>
        Confirm your email address to make sure your account is secure and
        ready to use.
      </Text>
      <BrandButton href={confirmationUrl}>Confirm your email</BrandButton>
      <Text style={{ ...bodyTextStyle, color: colors.muted, margin: "24px 0 0" }}>
        If you didn’t create a Hemo account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

SignupConfirmation.PreviewProps = {
  firstName: "Amara",
  confirmationUrl: "https://example.com/auth/confirm",
} satisfies SignupConfirmationProps;
