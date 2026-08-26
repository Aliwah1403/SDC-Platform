import { Heading, Text } from "react-email";
import { BrandButton, EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface UserInviteProps { firstName: string; inviterName: string; inviteUrl: string; }

export default function UserInvite({ firstName, inviterName, inviteUrl }: UserInviteProps) {
  return (
    <EmailLayout preview={`${inviterName} invited you to be part of their Hemo care journey`}>
      <Heading style={{ color: colors.ink, fontSize: 26, lineHeight: "32px", margin: "0 0 16px" }}>
        An invitation to support someone’s care
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        {inviterName} has invited you to join them on Hemo, where they can keep
        important parts of their care journey organized.
      </Text>
      <Text style={bodyTextStyle}>
        Hemo helps people keep important parts of their health journey
        organized. By joining, you’ll be able to support the person who invited
        you with more context, continuity, and care.
      </Text>
      <BrandButton href={inviteUrl}>Accept invitation</BrandButton>
      <Text style={{ ...bodyTextStyle, color: colors.muted, margin: "24px 0 0" }}>
        You’re in control of what you see and how you participate. You can
        decide what feels right for you.
      </Text>
    </EmailLayout>
  );
}

UserInvite.PreviewProps = { firstName: "Amara", inviterName: "The Hemo Team", inviteUrl: "https://example.com/auth/invite" } satisfies UserInviteProps;
