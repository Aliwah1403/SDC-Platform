import { Text } from "react-email";
import { EmailLayout, bodyTextStyle } from "./_components/EmailLayout";

export interface AccountDeletedProps {
  firstName: string;
}

export default function AccountDeleted({ firstName }: AccountDeletedProps) {
  return (
    <EmailLayout preview="Your Hemo account and health data have been deleted">
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        We’re sad to see you go. Your Hemo account and associated health data
        have been permanently deleted.
      </Text>
      <Text style={bodyTextStyle}>
        Thank you for giving Hemo a place in your care journey. If you’re open
        to sharing, reply to this email and tell us what led to your decision or
        what we could have done better. Your perspective helps us make Hemo
        more useful and trustworthy for the sickle cell community.
      </Text>
      <Text style={bodyTextStyle}>
        Wishing you well,
        <br />
        The Hemo Team
      </Text>
    </EmailLayout>
  );
}

AccountDeleted.PreviewProps = {
  firstName: "Amara",
} satisfies AccountDeletedProps;
