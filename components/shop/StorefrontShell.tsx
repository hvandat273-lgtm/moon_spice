import { getSiteSetting } from "@/lib/server/settings";

import { StorefrontHeaderView } from "./StorefrontHeaderView";
import { StorefrontFooterView } from "./StorefrontFooterView";

/**
 * The shell is split in two: these Server Components fetch the editable
 * settings, and the `*View` client components render them. The split exists
 * because the chrome is translated, and translation lives in a client context
 * so the language can change without a navigation.
 */

export async function StorefrontHeader() {
  const announcementText = await getSiteSetting("announcement_text");
  return <StorefrontHeaderView announcement={announcementText || null} />;
}

export async function StorefrontFooter() {
  const contact = await getSiteSetting("store_contact");
  return <StorefrontFooterView contact={contact} />;
}
