import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export { viewport } from "next-sanity/studio";

/**
 * The embedded Studio.
 *
 * The catch-all is what makes the two workspaces reachable: each declares a
 * `basePath` in `sanity.config.ts`, so /studio/content and /studio/submissions
 * both land here and the Studio picks the workspace from the path.
 */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
