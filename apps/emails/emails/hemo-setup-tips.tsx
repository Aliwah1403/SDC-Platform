import { Heading, Img, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors } from "./_components/EmailLayout";

export interface HemoSetupTipsProps {
  firstName: string;
}

const featureSectionStyle = {
  padding: "24px 0 0",
};

const screenshotStyle = {
  borderRadius: 18,
  display: "block",
  margin: "0 auto 20px",
  width: 180,
};

const featureLabelStyle = {
  color: colors.rose,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "1px",
  lineHeight: "16px",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

export default function HemoSetupTips({ firstName }: HemoSetupTipsProps) {
  return (
    <EmailLayout preview="A few Hemo features that are easy to miss.">
      <Heading
        as="h1"
        style={{
          color: colors.ink,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          lineHeight: "36px",
          margin: "0 0 16px",
          textAlign: "center",
        }}
      >
        A few useful things to set up
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        Some of Hemo&apos;s most useful features are tucked into the setup screens,
        so they&apos;re easy to miss. Here are a few worth taking a look at when you
        have a moment.
      </Text>

      <Section style={featureSectionStyle}>
        <Text style={featureLabelStyle}>01 · Medications</Text>
        <Heading
          as="h2"
          style={{
            color: colors.ink,
            fontSize: 20,
            lineHeight: "26px",
            margin: "0 0 8px",
          }}
        >
          Keep your medication list close
        </Heading>
        <Text style={{ ...bodyTextStyle, margin: 0 }}>
          Add the medications you take, including their strength and schedule.
          Hemo can then give you a clearer view of what is due and help you keep
          your care information in one place.
        </Text>
        <Img
          alt="Hemo Medications screen showing today's medication schedule"
          height={390}
          src="/static/hemo-medications.png"
          style={{ ...screenshotStyle, marginTop: 20 }}
          width={180}
        />
      </Section>

      <Section style={featureSectionStyle}>
        <Text style={featureLabelStyle}>02 · Hydration</Text>
        <Heading
          as="h2"
          style={{
            color: colors.ink,
            fontSize: 20,
            lineHeight: "26px",
            margin: "0 0 8px",
          }}
        >
          Make hydration fit your day
        </Heading>
        <Text style={{ ...bodyTextStyle, margin: 0 }}>
          Set a hydration goal and add the containers you actually use—your
          bottle, cup, or glass. Logging becomes much easier when Hemo can work
          with the measurements already familiar to you.
        </Text>
        <Img
          alt="Hemo Hydration Goal screen showing a daily water intake target"
          height={390}
          src="/static/hemo-hydration-goal.png"
          style={{ ...screenshotStyle, marginTop: 20 }}
          width={180}
        />
      </Section>

      <Section style={featureSectionStyle}>
        <Text style={featureLabelStyle}>03 · Sleep</Text>
        <Heading
          as="h2"
          style={{
            color: colors.ink,
            fontSize: 20,
            lineHeight: "26px",
            margin: "0 0 8px",
          }}
        >
          Set a sleep target that feels realistic
        </Heading>
        <Text style={{ ...bodyTextStyle, margin: 0 }}>
          Choose a sleep target that works for you. It gives your daily check-in
          more context and helps you notice how rest connects with the rest of
          your health picture.
        </Text>
        <Img
          alt="Hemo Health Tracker screen showing hydration and sleep"
          height={390}
          src="/static/hemo-health-trends.png"
          style={{ ...screenshotStyle, marginTop: 20 }}
          width={180}
        />
      </Section>

      <Section style={featureSectionStyle}>
        <Text style={featureLabelStyle}>04 · Health connections</Text>
        <Heading
          as="h2"
          style={{
            color: colors.ink,
            fontSize: 20,
            lineHeight: "26px",
            margin: "0 0 8px",
          }}
        >
          Let Hemo bring in the bigger picture
        </Heading>
        <Text style={{ ...bodyTextStyle, margin: 0 }}>
          Connect Apple Health on iPhone or Health Connect on Android to bring
          activity, sleep, heart rate, and other available health metrics into
          your Hemo view. You stay in control of what you share.
        </Text>
        <Section style={{ margin: "20px 0 0", textAlign: "center" }}>
          <Img
            alt="Apple Health logo"
            height={64}
            src="/static/apple-health.png"
            style={{ display: "inline-block", margin: "0 8px", width: 64 }}
            width={64}
          />
          <Img
            alt="Health Connect logo"
            height={64}
            src="/static/health-connect.png"
            style={{ display: "inline-block", margin: "0 8px", width: 64 }}
            width={64}
          />
        </Section>
      </Section>

      <Text style={{ ...bodyTextStyle, marginTop: 24 }}>
        You don&apos;t need to set everything up at once. Start with the feature that
        would make today a little easier, then build from there.
      </Text>
      <Text style={{ ...bodyTextStyle, marginBottom: 0 }}>
        Curtis &amp; Tamara
      </Text>
    </EmailLayout>
  );
}

HemoSetupTips.PreviewProps = {
  firstName: "Iman",
} satisfies HemoSetupTipsProps;
