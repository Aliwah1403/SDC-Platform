import { Section, Text } from "react-email";
import { BrandButton, EmailLayout, bodyTextStyle } from "./_components/EmailLayout";

export interface AccountDeletionRequestedProps {
  confirmationUrl: string;
}

export default function AccountDeletionRequested({ confirmationUrl }: AccountDeletionRequestedProps) {
  return (
    <EmailLayout preview="Confirm your Hemo account deletion request">
      <Text style={bodyTextStyle}>Hi,</Text>
      <Text style={bodyTextStyle}>
        We received a request to permanently delete your Hemo account and associated health data.
      </Text>
      <Text style={bodyTextStyle}>
        This cannot be undone. If you made this request, confirm it within 24 hours.
      </Text>
      <Section style={{ marginBottom: 24 }}>
        <BrandButton href={confirmationUrl}>Confirm account deletion</BrandButton>
      </Section>
      <Text style={bodyTextStyle}>
        If you did not make this request, you can safely ignore this email. Your account will remain unchanged.
      </Text>
      <Text style={bodyTextStyle}>The Hemo Team</Text>
    </EmailLayout>
  );
}

AccountDeletionRequested.PreviewProps = {
  confirmationUrl: "https://hemo-scd.com/delete-account?token=example",
} satisfies AccountDeletionRequestedProps;
