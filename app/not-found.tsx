import NotFound from "./(site)/not-found";

/**
 * The 404 for a URL that matches no route at all. The root layout supplies the
 * ticker, header, footer and fonts, so this is the same branded page an unknown
 * article slug gets — not Next's bare "This page could not be found".
 */
export default function RootNotFound() {
  return <NotFound />;
}
