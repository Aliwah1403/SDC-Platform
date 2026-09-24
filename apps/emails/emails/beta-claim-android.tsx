import { Heading, Text } from "react-email";
import { bodyTextStyle, colors, EmailLayout, smallTextStyle } from "./_components/EmailLayout";

export interface BetaClaimAndroidProps {
  firstName: string;
}

export default function BetaClaimAndroid({ firstName }: BetaClaimAndroidProps) {
  return (
    <EmailLayout preview="Your Hemo Android beta access is being prepared.">
      <Heading style={{ color: colors.ink, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, fontWeight: 700, lineHeight: "32px", margin: "0 0 24px", textAlign: "center" }}>
        Your Hemo access is ready
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        You’re among the first people invited to experience Hemo — a place to keep the details of your care journey together.
      </Text>
      <Text style={bodyTextStyle}>
        We’re finalising the Android beta route and will email you the right download link and next steps as soon as your access is ready.
      </Text>
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

BetaClaimAndroid.PreviewProps = { firstName: "Amara" } satisfies BetaClaimAndroidProps;
