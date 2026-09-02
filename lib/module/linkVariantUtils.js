"use strict";

// Lookbehind assertions (?<=...) and (?<!...) are not supported by
// NSRegularExpression on iOS. Warn early so the issue surfaces in JS tests
// before it silently misfires on device.
const UNSAFE_LOOKBEHIND_RE = /\(\?<[=!]/;
function warnAboutUnsafePattern(pattern) {
  if (UNSAFE_LOOKBEHIND_RE.test(pattern)) {
    console.warn(`[MarkdownStyle] linkVariants pattern "${pattern}" contains a lookbehind assertion (?<= or ?<!). ` + 'Lookbehinds are not supported by NSRegularExpression on iOS and will never match. ' + 'Use a lookahead or restructure the pattern to avoid them.');
  }
}
export function normalizeLinkVariantEntries(linkVariants) {
  return Object.entries(linkVariants ?? {}).sort(([a], [b]) => b.length - a.length).filter(([pattern]) => {
    try {
      RegExp(pattern);
    } catch {
      if (__DEV__) {
        console.warn(`[MarkdownStyle] linkVariants pattern "${pattern}" is not a valid regex and will be ignored.`);
      }
      return false;
    }
    if (__DEV__) {
      warnAboutUnsafePattern(pattern);
    }
    return true;
  });
}
//# sourceMappingURL=linkVariantUtils.js.map