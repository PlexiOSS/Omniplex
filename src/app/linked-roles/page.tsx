import { Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { linkedRoles } from "@/lib/api";
import type { LinkedRolesMeta } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";
import { ConnectButton } from "./ConnectButton";

export const metadata: Metadata = {
  title: "Linked Roles",
  description:
    "Connect your Discord account to Omniplex so servers can give you roles for your Omniplex badges.",
};

export default async function LinkedRolesPage() {
  let meta: LinkedRolesMeta;
  try {
    meta = await linkedRoles.getMeta();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Link2 size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Linked Roles
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Connect your Discord account so servers can give you roles for the
          badges you&apos;ve earned on Omniplex. Your roles update on their own
          when you earn or lose a badge.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {!meta.enabled ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Linked roles aren&apos;t available right now. Check back soon.
          </p>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Badges servers can use
            </h2>
            {meta.badges.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                No badges are set up for linked roles yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {meta.badges.map((b) => (
                  <li key={b.id} className="text-sm">
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">
                      {b.name}
                    </span>
                    {b.description && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {" "}
                        · {b.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <ConnectButton clientId={meta.client_id} />
            <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              We only ask Discord for your username and permission to update
              your Omniplex connection. You can remove it any time in Discord
              under User Settings, Connections.
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Running a server?{" "}
        <Link
          href="/kb/account/linked-roles"
          className="text-accent hover:underline"
        >
          Set up a linked role
        </Link>
      </p>
    </Container>
  );
}
