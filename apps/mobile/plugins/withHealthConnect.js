// Local Expo config plugin for react-native-health-connect (v3.x).
//
// The library's bundled `app.plugin.js` only adds the rationale intent-filter.
// It does NOT:
//   1. Register the permission delegate on MainActivity — without this,
//      `HealthConnectPermissionDelegate.requestPermission` stays a lateinit
//      that is never initialized, so calling requestPermission() crashes with
//      "lateinit property requestPermission has not been initialized".
//   2. Declare the health <uses-permission> entries in the manifest — so the
//      permissions passed to the library's plugin are silently ignored and no
//      permission is ever actually granted.
//
// This plugin fixes both. Add it to app.json plugins AFTER
// "react-native-health-connect" and move the health permission list here.

const {
  withMainActivity,
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const DELEGATE_IMPORT =
  "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";
const DELEGATE_CALL =
  "HealthConnectPermissionDelegate.setPermissionDelegate(this)";

function withPermissionDelegate(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    const isKotlin = config.modResults.language === "kt";

    if (!isKotlin) {
      throw new Error(
        "[withHealthConnect] Expected a Kotlin MainActivity; got " +
          config.modResults.language
      );
    }

    // 1. Add the import (right after the package declaration) if missing.
    if (!contents.includes(DELEGATE_IMPORT)) {
      contents = contents.replace(
        /^(package .+?\n)/m,
        `$1\n${DELEGATE_IMPORT}\n`
      );
    }

    // 2. Register the delegate inside onCreate, after super.onCreate(...).
    if (!contents.includes(DELEGATE_CALL)) {
      const superOnCreate = /super\.onCreate\([^)]*\)/;
      if (superOnCreate.test(contents)) {
        contents = contents.replace(
          superOnCreate,
          (match) => `${match}\n    ${DELEGATE_CALL}`
        );
      } else {
        throw new Error(
          "[withHealthConnect] Could not find super.onCreate() in MainActivity to anchor the delegate registration."
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withHealthPermissions(config, permissions) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];

    for (const name of permissions) {
      const already = manifest["uses-permission"].some(
        (p) => p.$?.["android:name"] === name
      );
      if (!already) {
        manifest["uses-permission"].push({ $: { "android:name": name } });
      }
    }

    return config;
  });
}

module.exports = function withHealthConnect(config, props = {}) {
  const permissions = props.permissions || [];
  config = withPermissionDelegate(config);
  config = withHealthPermissions(config, permissions);
  return config;
};
