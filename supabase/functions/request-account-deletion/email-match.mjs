/**
 * Escape PostgreSQL LIKE/ILIKE metacharacters so a user-supplied email is matched
 * literally by the profile lookup.
 *
 * `request-account-deletion` looks the requester up with `ilike` for
 * case-insensitive matching. Passed through unescaped, `%` and `_` in the input
 * act as wildcards, turning the lookup into a user-enumeration oracle (the caller
 * can tell "some row matches this pattern" from "none does" via the response) and
 * letting one request touch a row that isn't the requester's. The address is
 * still validated by the caller's email regex, which permits both characters.
 *
 * Backslash is escaped first so it can't double-escape a following metacharacter.
 */
export function escapeLikePattern(value) {
  return value.replace(/([\\%_])/g, "\\$1");
}
