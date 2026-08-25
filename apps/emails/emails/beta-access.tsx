import { Heading, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface BetaAccessProps { firstName: string; }

export default function BetaAccess({ firstName }: BetaAccessProps) {
  return (
    <EmailLayout preview="Get ready to shape the future of sickle cell care with Hemo.">
      <Heading style={{ color: colors.ink, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, fontWeight: 700, lineHeight: "32px", margin: "0 0 24px", textAlign: "center" }}>You’re part of Hemo’s first beta</Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>You’re officially part of the first Hemo beta group.</Text>
      <Text style={bodyTextStyle}>That means you’re not just waiting to try an app. You’re helping shape something being built carefully, with the sickle cell community at the centre.</Text>
      <Text style={bodyTextStyle}>Over the past few months, we’ve been working on the foundations of Hemo, including:</Text>
      <Text style={bodyTextStyle}>• Health tracking designed around real sickle cell experiences<br />• Clearer ways to understand your own patterns<br />• Tools that make information easier to organise and share</Text>
      <Text style={bodyTextStyle}>We’ve also been listening, testing, refining, and making difficult decisions about what Hemo should — and should not — become.</Text>
      <Text style={bodyTextStyle}>Your access links are being prepared now. We’ll send them to you very soon, together with the next steps for getting started.</Text>
      <Text style={bodyTextStyle}>Thank you for trusting us early. We’ll do our best to earn that trust with every release.</Text>
      <Text style={bodyTextStyle}>The Hemo Team</Text>
      <Text style={smallTextStyle}>P.S. This is an early beta, so you may notice unfinished areas. That is expected — and your honest feedback will help us improve them.</Text>
    </EmailLayout>
  );
}

BetaAccess.PreviewProps = { firstName: "Amara" } satisfies BetaAccessProps;
