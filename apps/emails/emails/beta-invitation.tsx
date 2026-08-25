import { Heading, Section, Text } from "react-email";
import { EmailLayout, BrandButton, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface BetaInvitationProps { firstName: string; betaUrl: string; }

export default function BetaInvitation({ firstName, betaUrl }: BetaInvitationProps) {
  return (
    <EmailLayout preview="Join the private beta and help shape sickle cell healthcare.">
      <Heading style={{ color: colors.ink, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 24, fontWeight: 700, lineHeight: "32px", margin: "0 0 24px", textAlign: "center" }}>Your invitation to join the Hemo beta</Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>You joined the Hemo waitlist because you believed sickle cell healthcare could feel more connected, more understandable, and a little less difficult to manage.</Text>
      <Text style={bodyTextStyle}>We’re now inviting people from the waitlist to join the private beta.</Text>
      <Text style={bodyTextStyle}>Hemo is being built for people living with sickle cell disease — to help make health information easier to organise, understand, and share when it matters.</Text>
      <Text style={bodyTextStyle}>We’d love for you to take the next step and join us.</Text>
      <Section style={{ padding: "8px 0 24px", textAlign: "center" }}><BrandButton href={betaUrl}>JOIN THE BETA</BrandButton></Section>
      <Text style={bodyTextStyle}>It only takes a few minutes to tell us a little about yourself and your device. Your answers will help us prepare the right beta access for you.</Text>
      <Text style={bodyTextStyle}>We’re still building. That means your feedback will directly shape what Hemo becomes.</Text>
      <Text style={bodyTextStyle}>Thank you for being here early.</Text>
      <Text style={bodyTextStyle}>The Hemo Team</Text>
      <Text style={smallTextStyle}>P.S. If you no longer want to hear from us, simply reply to this email and let us know.</Text>
    </EmailLayout>
  );
}

BetaInvitation.PreviewProps = { firstName: "Amara", betaUrl: "https://www.hemo-scd.com/beta" } satisfies BetaInvitationProps;
