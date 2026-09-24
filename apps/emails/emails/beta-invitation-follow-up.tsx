import { Heading, Section, Text } from "react-email";
import { BrandButton, bodyTextStyle, colors, EmailLayout, smallTextStyle } from "./_components/EmailLayout";

export interface BetaInvitationFollowUpProps {
  betaUrl: string;
  unsubscribeUrl?: string;
}

export default function BetaInvitationFollowUp({
  betaUrl,
  unsubscribeUrl,
}: BetaInvitationFollowUpProps) {
  return (
    <EmailLayout
      preview="A gentle reminder about your Hemo beta invitation."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading
        style={{
          color: colors.ink,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          lineHeight: "32px",
          margin: "0 0 24px",
          textAlign: "center",
        }}
      >
        Still interested in joining the Hemo beta?
      </Heading>
      <Text style={bodyTextStyle}>
        A little while ago, we invited you to join the Hemo beta. We know life
        gets busy, so we wanted to leave the door open.
      </Text>
      <Text style={bodyTextStyle}>
        Hemo is a companion for living with sickle cell disease: a place to
        keep track of symptoms, medications, hydration, and the details that
        matter in day-to-day care.
      </Text>
      <Text style={bodyTextStyle}>
        If you would still like to help shape it, tell us a little about your
        device and we’ll prepare the right beta access for you.
      </Text>
      <Section style={{ padding: "8px 0 24px", textAlign: "center" }}>
        <BrandButton href={betaUrl}>JOIN THE BETA</BrandButton>
      </Section>
      <Text style={bodyTextStyle}>
        No pressure if the timing is not right. We’re grateful you joined us
        early, and we’ll keep building with the community in mind.
      </Text>
      <Text style={bodyTextStyle}>The Hemo Team</Text>
      <Text style={smallTextStyle}>
        If you no longer want to hear from us, you can unsubscribe below.
      </Text>
    </EmailLayout>
  );
}

BetaInvitationFollowUp.PreviewProps = {
  betaUrl: "https://www.hemo-scd.com/beta",
  unsubscribeUrl: "https://resend.com/unsubscribe",
} satisfies BetaInvitationFollowUpProps;
