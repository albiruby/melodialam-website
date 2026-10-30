import { cacheLife, cacheTag } from "next/cache";
import { SITE } from "./site";
import { contentClient } from "./sanity";

/**
 * Site-wide copy and contact facts.
 *
 * Reads the `siteSettings` singleton from Sanity and falls back to the constants
 * below, so the site renders before an editor has filled the document in — and
 * keeps rendering if Sanity is unreachable.
 *
 * The header no longer reads brand copy from the CMS: the lockup, promise and
 * navigation are code-owned. What remains editable is the footer name, the
 * hover curtain, and the two contact addresses.
 *
 * `url` and `locale` are deliberately NOT here: the origin has to come from the
 * environment so a preview deployment produces correct canonical URLs, and the
 * locale is a technical constant.
 *
 * Channel statistics are deliberately NOT here either. Subscriber counts, total
 * views and "last scraped" were shown in the footer and rotted the moment the
 * scrape aged: nothing refreshed them, so they drifted further from the truth
 * every day. A number nobody maintains is worse than no number.
 */

export const SETTINGS_TAG = "siteSettings";

/** Copy for the green hover curtain that covers an article card. */
export interface CardCurtainCopy {
  /** Small top-right label on a Stories-page card. */
  articleLabel: string;
  /** Bottom "open the note" CTA on a Stories-page card. */
  articleCta: string;
}

export interface SiteSettings {
  name: string;
  /** Where readers write about the site itself. */
  contactEmail: string;
  /** Where partnership offers go. */
  partnerEmail: string;
  cardCurtain: CardCurtainCopy;
  /** Where the values came from, for the admin UI and for debugging. */
  source: "cms" | "static";
}

const STATIC: SiteSettings = {
  name: SITE.name,
  contactEmail: "melodialam.ip@gmail.com",
  partnerEmail: "helfan@infia.co",
  cardCurtain: {
    articleLabel: "READ STORY",
    articleCta: "Buka Catatan Redaksi",
  },
  source: "static",
};

const SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  name,
  cardCurtain{ articleLabel, articleCta },
  contactEmail,
  partnerEmail
}`;

interface SettingsDoc {
  name?: string;
  cardCurtain?: {
    articleLabel?: string;
    articleCta?: string;
  };
  contactEmail?: string;
  partnerEmail?: string;
}

/** An empty field in the CMS means "not filled in yet", not "blank it out". */
function or(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag(SETTINGS_TAG);

  let doc: SettingsDoc | null = null;
  try {
    doc = await contentClient.fetch<SettingsDoc | null>(SETTINGS_QUERY, {}, { cache: "no-store" });
  } catch {
    return STATIC;
  }

  if (!doc) return STATIC;

  return {
    name: or(doc.name, STATIC.name),
    contactEmail: or(doc.contactEmail, STATIC.contactEmail),
    partnerEmail: or(doc.partnerEmail, STATIC.partnerEmail),
    cardCurtain: {
      articleLabel: or(doc.cardCurtain?.articleLabel, STATIC.cardCurtain.articleLabel),
      articleCta: or(doc.cardCurtain?.articleCta, STATIC.cardCurtain.articleCta),
    },
    source: "cms",
  };
}
