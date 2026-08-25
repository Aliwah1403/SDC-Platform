import { Heading, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface WaitlistUpdateProps { firstName: string; }

export default function WaitlistUpdate({ firstName }: WaitlistUpdateProps) {
  return (
    <EmailLayout preview="Beta’s nearly here, and I wanted to tell you first.">
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>Curtis &amp; Tamara here — we’re the people building Hemo, the app you joined the waitlist for a while back. It’s been heads-down for months, so we owe you an update.</Text>
      <Text style={{ ...bodyTextStyle, marginBottom: 8 }}>Since you signed up, we’ve:</Text>
      <Text style={{ ...bodyTextStyle, margin: 0 }}>• Rebuilt how logging pain and mood actually feels to use, so everything is seamless from the get-go<br />• Added weekly and monthly health recaps that show you your own patterns<br />• Built hydration goals that adjust to your body and the day’s weather</Text>
      <Text style={bodyTextStyle}>Beta invites are going out soon, and as an early waitlist member you’re at the front of the line — I’ll send yours shortly.</Text>
      <Text style={bodyTextStyle}>Before then, one question, if you have 30 seconds: what made you join the waitlist — and what’s the one thing you’d want Hemo to do for you?</Text>
      <Text style={bodyTextStyle}>Just hit reply. I read every single answer, and it genuinely shapes what we build next.</Text>
      <Text style={bodyTextStyle}>Thank you for being here early. It means a lot.</Text>
      <Text style={{ ...bodyTextStyle, color: colors.muted, fontSize: 12, lineHeight: "16px", margin: 0, textAlign: "center" }}>You’re receiving this because you signed up for Hemo. We’re here to support your daily health journey.</Text>
    </EmailLayout>
  );
}

WaitlistUpdate.PreviewProps = { firstName: "Amara" } satisfies WaitlistUpdateProps;
