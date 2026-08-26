import { Heading, Section, Text } from "react-email";
import { EmailLayout, BrandButton, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface BetaClaimProps { firstName: string; betaUrl: string; }

export default function BetaClaim({ firstName, betaUrl }: BetaClaimProps) {
  return (
    <EmailLayout preview="Your invitation to try Hemo is ready">
      <Heading style={{ color: colors.ink, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, fontWeight: 700, lineHeight: "32px", margin: "0 0 24px", textAlign: "center" }}>Your Hemo invitation is ready</Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>You’re among the first people invited to experience Hemo — a place to keep the details of your care journey together.</Text>
      <Text style={bodyTextStyle}>Choose your phone below and we’ll send you the right way to get started.</Text>
      <Section style={{ padding: "8px 0 24px", textAlign: "center" }}><BrandButton href={betaUrl}>GET STARTED WITH HEMO</BrandButton></Section>
      <Text style={bodyTextStyle}>Hemo is still taking shape. What feels helpful, what feels unclear, and what would make your day easier will guide what we build next.</Text>
      <Text style={bodyTextStyle}>Thank you for helping us build Hemo with the sickle cell community.</Text>
      <Text style={bodyTextStyle}>Talk soon,</Text>
      <Text style={{ ...bodyTextStyle, margin: 0 }}>Curtis &amp; Tamara</Text>
    </EmailLayout>
  );
}

BetaClaim.PreviewProps = { firstName: "Amara", betaUrl: "https://hemo-scd.com/beta" } satisfies BetaClaimProps;
