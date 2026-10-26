/**
 * Serialize structured data for a `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone leaves `<` untouched, so a CMS string containing
 * `</script>` would close the element early and the rest of the value would be
 * parsed as HTML. Replacing `<` with the JSON escape `\u003c` keeps the value
 * identical after `JSON.parse` while making the script body inert to the HTML
 * parser. Every JSON-LD sink goes through this helper so the three pages cannot
 * drift apart again.
 */
export function jsonLdScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
