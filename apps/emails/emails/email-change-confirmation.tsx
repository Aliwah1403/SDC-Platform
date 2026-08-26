import { Heading, Text } from "react-email";
import { BrandButton, EmailLayout, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface EmailChangeConfirmationProps { firstName: string; newEmail: string; confirmationUrl: string; }

export default function EmailChangeConfirmation({ firstName, newEmail, confirmationUrl }: EmailChangeConfirmationProps) {
  return (
    <EmailLayout preview="Confirm the email address for your Hemo account">
      <Heading style={{ color: colors.ink, fontSize: 26, lineHeight: "32px", margin: "0 0 16px" }}>
        Confirm your new email
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        We received a request to change the email address on your Hemo account
        to:
      </Text>
      <Text style={{ ...bodyTextStyle, color: colors.rose, fontWeight: 700, margin: "0 0 16px" }}>
        {newEmail}
      </Text>
      <BrandButton href={confirmationUrl}>CONFIRM NEW EMAIL</BrandButton>
      <Text style={{ ...smallTextStyle, margin: "24px 0 0" }}>
        If you didn’t request this change, please ignore this email and consider
        updating your account password.
      </Text>
    </EmailLayout>
  );
}

EmailChangeConfirmation.PreviewProps = { firstName: "Amara", newEmail: "amara@example.com", confirmationUrl: "https://example.com/auth/confirm-email" } satisfies EmailChangeConfirmationProps;
