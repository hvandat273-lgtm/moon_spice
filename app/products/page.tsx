import { redirect } from "next/navigation";

/**
 * The public catalogue now lives on the home page.
 * Keep this redirect so saved links never show the retired product-list UI.
 */
export default function RetiredProductListPage() {
  redirect("/");
}
