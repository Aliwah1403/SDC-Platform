import { Heading, Section, Text } from "react-email";
import { BrandButton, bodyTextStyle, colors, EmailLayout, smallTextStyle } from "./_components/EmailLayout";

export interface BetaClaimIosProps {
  firstName: string;
  testFlightUrl: string;
}

export default function BetaClaimIos({ firstName, testFlightUrl }: BetaClaimIosProps) {
  return (
    <EmailLayout preview="Your Hemo iPhone beta access is ready.">
      <Heading style={{ color: colors.ink, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, fontWeight: 700, lineHeight: "32px", margin: "0 0 24px", textAlign: "center" }}>
        Your Hemo access is ready
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        You’re among the first people invited to experience Hemo — a place to keep the details of your care journey together.
      </Text>
      <Text style={bodyTextStyle}>
        Use the link below on your iPhone to join through TestFlight. If you do not already have TestFlight, Apple will guide you through installing it first.
      </Text>
      <Section style={{ padding: "8px 0 24px", textAlign: "center" }}>
        <BrandButton href={testFlightUrl}>CLAIM YOUR ACCESS</BrandButton>
      </Section>
      <Text style={bodyTextStyle}>
        Hemo is still taking shape. What feels helpful, what feels unclear, and what would make your day easier will guide what we build next.
      </Text>
      <Text style={bodyTextStyle}>Thank you for helping us build Hemo with the sickle cell community.</Text>
      <Text style={bodyTextStyle}>Talk soon,</Text>
      <Text style={{ ...bodyTextStyle, margin: 0 }}>Curtis &amp; Tamara</Text>
      <Text style={smallTextStyle}>P.S. This is an early beta, so you may notice unfinished areas. Your honest feedback will help us improve them.</Text>
    </EmailLayout>
  );
}

BetaClaimIos.PreviewProps = {
  firstName: "Amara",
  testFlightUrl: "https://testflight.apple.com/join/184kK1sx",
} satisfies BetaClaimIosProps;
