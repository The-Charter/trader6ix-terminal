import { redirect } from "next/navigation";

/** The contact page was removed; old links land on the home page. */
export default function ContactRedirect() {
  redirect("/");
}
