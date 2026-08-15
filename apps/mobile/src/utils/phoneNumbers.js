import phoneLib from "google-libphonenumber";

const { PhoneNumberFormat, PhoneNumberUtil } = phoneLib;

export const DEFAULT_PHONE_COUNTRY = "GB";

const phoneUtil = PhoneNumberUtil.getInstance();

function normalizeRegion(region, fallbackCountry = DEFAULT_PHONE_COUNTRY) {
  if (!region) return fallbackCountry;

  // google-libphonenumber can classify some +44 mobile ranges as GG/JE/IM.
  // For this UI, default the shared +44 selector to GB unless the user picks
  // a more specific territory manually.
  if (["GG", "JE", "IM"].includes(region)) return "GB";

  return region;
}

export function parsePhoneForInput(rawPhone, fallbackCountry = DEFAULT_PHONE_COUNTRY) {
  const raw = `${rawPhone ?? ""}`.trim();
  const fallbackCallingCode = `${phoneUtil.getCountryCodeForRegion(fallbackCountry)}`;
  if (!raw) {
    return {
      countryCode: fallbackCountry,
      callingCode: fallbackCallingCode,
      nationalNumber: "",
      formattedNumber: "",
    };
  }

  try {
    const parsed = phoneUtil.parseAndKeepRawInput(raw, fallbackCountry);
    const region = normalizeRegion(
      phoneUtil.getRegionCodeForNumber(parsed),
      fallbackCountry,
    );
    const nationalNumber = phoneUtil.getNationalSignificantNumber(parsed) || raw;
    const formattedNumber = phoneUtil.format(parsed, PhoneNumberFormat.E164);

    return {
      countryCode: region,
      callingCode: `${phoneUtil.getCountryCodeForRegion(region)}`,
      nationalNumber,
      formattedNumber,
    };
  } catch {
    return {
      countryCode: fallbackCountry,
      callingCode: fallbackCallingCode,
      nationalNumber: raw.replace(/^\+\d+\s*/, ""),
      formattedNumber: raw,
    };
  }
}

export function countryFlagEmoji(countryCode = DEFAULT_PHONE_COUNTRY) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return "";

  return countryCode
    .split("")
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
}
