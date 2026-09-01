import assert from "node:assert/strict";
import test from "node:test";
import { escapeLikePattern } from "./email-match.mjs";

test("neutralises LIKE wildcards in a user-supplied email", () => {
  assert.equal(escapeLikePattern("a_b%c@example.com"), "a\\_b\\%c@example.com");
});

test("escapes backslash before any following metacharacter", () => {
  assert.equal(escapeLikePattern("a\\%b@example.com"), "a\\\\\\%b@example.com");
});

test("leaves an ordinary address untouched", () => {
  assert.equal(escapeLikePattern("alice@example.com"), "alice@example.com");
});

test("a wildcard probe becomes an exact-match string", () => {
  // Unescaped, "%@example.com" matches every example.com profile and "a_ice@x.com"
  // matches "alice@x.com" — the enumeration oracle this guards against.
  assert.equal(escapeLikePattern("%@example.com"), "\\%@example.com");
  assert.equal(escapeLikePattern("a_ice@x.com"), "a\\_ice@x.com");
});
