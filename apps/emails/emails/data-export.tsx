import { Heading, Section, Text } from "react-email";
import { EmailLayout, bodyTextStyle, colors, smallTextStyle } from "./_components/EmailLayout";

export interface DataExportProps {
  firstName: string;
  fileName: string;
  expiresAt?: string;
}

export default function DataExport({ firstName, fileName, expiresAt }: DataExportProps) {
  return (
    <EmailLayout preview="Your Hemo data export is ready">
      <Heading
        style={{
          color: colors.ink,
          fontSize: 26,
          lineHeight: "32px",
          margin: "0 0 16px",
        }}
      >
        Your data export is ready
      </Heading>
      <Text style={bodyTextStyle}>Hi {firstName},</Text>
      <Text style={bodyTextStyle}>
        As requested, we’ve prepared a copy of your Hemo data. You’ll find it
        attached to this email as a ZIP file.
      </Text>
      <Section
        style={{
          borderBottom: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.border}`,
          margin: "24px 0",
          padding: "16px 0",
        }}
      >
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            lineHeight: "16px",
            margin: 0,
            textTransform: "uppercase" as const,
          }}
        >
          File name
        </Text>
        <Text
          style={{
            color: colors.ink,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 16,
            lineHeight: "24px",
            margin: "4px 0 0",
            wordBreak: "break-word" as const,
          }}
        >
          {fileName}
        </Text>
      </Section>
      <Text style={bodyTextStyle}>
        The ZIP file may include the information you’ve added to Hemo, such as
        health entries, medications, appointments, care details, and account
        information.
      </Text>
      {expiresAt && (
        <Text style={smallTextStyle}>
          For your security, this export is available until {expiresAt}.
        </Text>
      )}
      <Text style={smallTextStyle}>
        Please keep this file somewhere secure. It contains personal health
        information and should only be shared with people you trust.
      </Text>
      <Text style={{ ...bodyTextStyle, margin: "24px 0 0" }}>
        If you didn’t request this export, please reply to this email so we can
        look into it.
      </Text>
      <Text style={{ ...bodyTextStyle, margin: "24px 0 0" }}>
        Take care,
        <br />
        The Hemo Team
      </Text>
    </EmailLayout>
  );
}

DataExport.PreviewProps = {
  firstName: "Amara",
  fileName: "hemo-data-export-2026-08-25.zip",
  expiresAt: "31 August 2026",
} satisfies DataExportProps;
