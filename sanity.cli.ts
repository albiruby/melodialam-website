import { defineCliConfig } from "sanity/cli";

/**
 * Config for the Sanity CLI (`npm run sanity -- …`), which `sanity deploy` reads
 * so it never has to prompt.
 *
 * `studioHost` is the subdomain the Studio is published at:
 * `https://melodi-alam.sanity.studio`. Changing it here and redeploying moves
 * the Studio; the old hostname stops working.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error(
    "Sanity env vars missing. Set NEXT_PUBLIC_SANITY_PROJECT_ID and " +
      "NEXT_PUBLIC_SANITY_DATASET before running a sanity command.",
  );
}

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: "melodi-alam",
});
