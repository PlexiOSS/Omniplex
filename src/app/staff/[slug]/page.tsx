import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Shorthand for /kb/staff/[slug] the KB's staff category does the actual work. */
export default async function StaffArticleRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/kb/staff/${slug}`);
}
