import { redirect } from "next/navigation";

// The OAuth callback now lands at /auth/sauron — redirect any stale bookmarks
export default function CallbackPage() {
  redirect("/auth/login");
}
