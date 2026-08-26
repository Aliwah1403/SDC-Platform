import {
  Button,
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import type { ReactNode } from "react";

export const colors = {
  ink: "#020304",
  muted: "#666666",
  background: "#FFFFFF",
  cream: "#F0E4E1",
  rose: "#A9334D",
  border: "#EAEAEA",
};

export const logoUrl =
  "https://di867tnz6fwga.cloudfront.net/brand-kits/0b06e40e-c16e-4eb6-ae76-6209b4ec6cdf/primary/f336d4b2-3732-4539-9bf2-f7c844495736.png";
export const fingerprintUrl =
  "https://resend-attachments.s3.amazonaws.com/7e243de0-f0c8-456b-b2ac-9dc2135bd2de";

const fontFamily = "Arial, Helvetica, sans-serif";

export function EmailLayout({
  preview,
  children,
  showFingerprint = true,
  showFooter = true,
  unsubscribeUrl = "https://hemo-scd.com",
}: {
  preview: string;
  children: ReactNode;
  showFingerprint?: boolean;
  showFooter?: boolean;
  unsubscribeUrl?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: colors.background,
            margin: "0 auto",
            maxWidth: 600,
            width: "100%",
          }}
        >
          <Section style={{ padding: "20px 16px 32px", textAlign: "center" }}>
            <Img
              alt="Hemo SCD Logo"
              height={80}
              src={logoUrl}
              style={{
                display: "block",
                margin: "0 auto",
                maxWidth: 200,
                width: 200,
              }}
              width={200}
            />
          </Section>
          <Section style={{ color: colors.ink, fontFamily, padding: "0 32px" }}>
            {children}
          </Section>
          {showFooter && (
            <Section
              style={{
                borderTop: `1px solid ${colors.border}`,
                margin: "32px 32px 0",
                padding: "24px 0 32px",
                textAlign: "center",
              }}
            >
              {showFingerprint && (
                <Img
                  alt="Hemo fingerprint icon"
                  height={65}
                  src={fingerprintUrl}
                  style={{ display: "block", margin: "0 auto", width: 65 }}
                  width={65}
                />
              )}
              <Text
                style={{
                  color: colors.muted,
                  fontFamily,
                  fontSize: 12,
                  lineHeight: "16px",
                  margin: "16px 0 8px",
                }}
              >
                You’re receiving this because you signed up for Hemo. We’re here
                to support your daily health journey.
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontFamily,
                  fontSize: 12,
                  lineHeight: "16px",
                  margin: "16px 0 8px",
                }}
              >
                <Link
                  href="https://hemo-scd.com"
                  style={{ color: colors.rose, textDecoration: "underline" }}
                >
                  hemo-scd.com
                </Link>{" "}
                ·{" "}
                <Link
                  href={unsubscribeUrl}
                  style={{ color: colors.rose, textDecoration: "underline" }}
                >
                  Unsubscribe
                </Link>
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontFamily,
                  fontSize: 12,
                  lineHeight: "16px",
                  margin: 0,
                }}
              >
                © 2026 Hemo SCD. All rights reserved.
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export function BrandButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: colors.rose,
        borderRadius: 8,
        color: "#FFFFFF",
        display: "inline-block",
        fontFamily,
        fontSize: 16,
        fontWeight: 700,
        lineHeight: "20px",
        padding: "14px 24px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}

export const bodyTextStyle = {
  color: colors.ink,
  fontFamily,
  fontSize: 16,
  lineHeight: "24px",
  margin: "0 0 16px",
};
export const smallTextStyle = {
  color: colors.muted,
  fontFamily,
  fontSize: 13,
  lineHeight: "20px",
  margin: "0 0 16px",
};
