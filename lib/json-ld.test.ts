import { describe, expect, it } from "vitest";
import { jsonLdScript } from "./json-ld";

describe("jsonLdScript", () => {
  it("never emits a literal < that could close the script element", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c");
  });

  it("round-trips through JSON.parse unchanged", () => {
    const value = { name: "A < B & C", list: ["</script>", "<b>"] };
    expect(JSON.parse(jsonLdScript(value))).toEqual(value);
  });

  it("leaves ordinary JSON untouched", () => {
    expect(jsonLdScript({ a: 1, b: "ok" })).toBe('{"a":1,"b":"ok"}');
  });
});
