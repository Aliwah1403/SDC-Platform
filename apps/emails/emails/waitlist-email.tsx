import { Heading, Text } from "react-email";
import { EmailLayout, colors } from "./_components/EmailLayout";

export interface WaitlistEmailProps { firstName: string; }

export default function WaitlistEmail({ firstName }: WaitlistEmailProps) {
  return (
    <EmailLayout preview="You are on the Hemo waitlist">
      <Heading style={{ color: colors.ink, fontSize: 26, margin: "0 0 16px" }}>You are on the list</Heading>
      <Text style={{ color: colors.ink, fontSize: 16, lineHeight: "25px" }}>Hi {firstName},</Text>
      <Text style={{ color: colors.muted, fontSize: 16, lineHeight: "25px" }}>Thanks for your interest in Hemo. We will be in touch as we get closer to launch.</Text>
    </EmailLayout>
  );
}

WaitlistEmail.PreviewProps = { firstName: "Amara" } satisfies WaitlistEmailProps;
