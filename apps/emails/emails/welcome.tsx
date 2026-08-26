import { Heading, Img, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface WelcomeProps {
  firstName: string;
}

export default function Welcome({ firstName }: WelcomeProps) {
  return (
    <EmailLayout preview="Welcome to Hemo — getting started">
      <Heading
        style={{
          color: colors.ink,
          fontSize: 26,
          lineHeight: "32px",
          margin: "0 0 16px",
        }}
      >
        Welcome to Hemo
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        We’re glad you’re here. Hemo is designed to help you feel more
        organized, more prepared, and more supported in the moments that matter.
      </Text>
      <Text style={bodyTextStyle}>
        There’s no perfect way to begin. Start with what feels useful today and
        make Hemo work around your life.
      </Text>
      <Section style={{ padding: "4px 0 28px", textAlign: "center" }}>
        <Img
          alt="Three Hemo app screens showing care, daily health tracking, and streaks"
          height={402}
          src="https://res.cloudinary.com/dzycxaapd/image/upload/v1787652850/Hemo-Welcome-Mail-Shot_lg11v8.png"
          style={{
            borderRadius: 16,
            display: "block",
            margin: "0 auto",
            maxWidth: 536,
            width: "100%",
          }}
          width={536}
        />
      </Section>
      <Text
        style={{
          color: colors.ink,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: "24px",
          margin: "0 0 12px",
        }}
      >
        A few good places to start
      </Text>
      <Text style={{ ...bodyTextStyle, margin: "0 0 8px" }}>
        • Add the people and care details you want close at hand
        <br />• Capture how you’re feeling when it feels helpful
        <br />• Explore the tools that can help you prepare for better care
        conversations
      </Text>
      <Text style={bodyTextStyle}>
        Hemo is built with the sickle cell community, and it will keep getting
        better with your perspective. We’re here to help you build a clearer,
        more connected care journey — one day at a time.
      </Text>
      <Text style={bodyTextStyle}>We’re glad to be building this with you.</Text>
      <Text style={{ ...bodyTextStyle, margin: 0 }}>
        Curtis &amp; Tamara
      </Text>
    </EmailLayout>
  );
}

Welcome.PreviewProps = {
  firstName: "Amara",
} satisfies WelcomeProps;
