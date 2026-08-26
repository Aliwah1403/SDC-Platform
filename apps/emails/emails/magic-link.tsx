import { Heading, Section, Text } from "react-email";
import { BrandButton, EmailLayout, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface MagicLinkProps { firstName: string; magicLinkUrl: string; }

export default function MagicLink({ firstName, magicLinkUrl }: MagicLinkProps) {
  return (
    <EmailLayout preview="Your secure link to sign in to Hemo">
      <Heading style={{ color: colors.ink, fontSize: 26, lineHeight: "32px", margin: "0 0 16px" }}>
        Sign in to Hemo
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Use the button below to sign in securely. You won’t need to enter a
        password.
      </Text>
      <Section style={{ padding: "8px 0 24px", textAlign: "center" }}>
        <BrandButton href={magicLinkUrl}>SIGN IN TO HEMO</BrandButton>
      </Section>
      <Text style={smallTextStyle}>
        This link is for you and will expire shortly. If you didn’t request it,
        you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

MagicLink.PreviewProps = { firstName: "Amara", magicLinkUrl: "https://example.com/auth/magic-link" } satisfies MagicLinkProps;
