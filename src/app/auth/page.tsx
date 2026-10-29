import { redirect } from "next/navigation";

/**
 * There is no sign-in page: "Connect Wallet" opens the Privy modal wherever it
 * is clicked. Old links and bookmarks to /auth land on the home page.
 */
export default function AuthRedirect() {
  redirect("/");
}
