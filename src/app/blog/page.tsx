import { redirect } from "next/navigation";

/** The blog was removed; old links land on the home page. */
export default function BlogRedirect() {
  redirect("/");
}
