import type { Metadata } from "next";
import { CheckCircle, XCircle } from "lucide-react";
import { list } from "@/lib/api";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Status",
  description: "Current operational status of Omniplex services.",
};

export const revalidate = 60;

interface ServiceStatus {
  name: string;
  ok: boolean;
  detail: string;
}

export default async function StatusPage() {
  const apiOk = await list.getStats().then(() => true).catch(() => false);

  const services: ServiceStatus[] = [
    {
      name: "API",
      ok: apiOk,
      detail: apiOk ? "All systems operational" : "Unable to reach backend",
    },
    {
      name: "Bot Listings",
      ok: apiOk,
      detail: apiOk ? "Serving normally" : "Degraded",
    },
    {
      name: "Server Listings",
      ok: apiOk,
      detail: apiOk ? "Serving normally" : "Degraded",
    },
    {
      name: "Auth",
      ok: apiOk,
      detail: apiOk ? "Discord OAuth operational" : "May be affected",
    },
  ];

  const allOk = services.every((s) => s.ok);

  return (
    <Container className="py-16">
      <div className="max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Platform Status
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Live operational status refreshes every 60 seconds.
          </p>
        </div>

        {/* Overall banner */}
        <div
          className={[
            "mb-8 rounded-2xl border px-5 py-4 text-center text-sm font-medium",
            allOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
          ].join(" ")}
        >
          {allOk ? "All systems operational" : "Some services are experiencing issues"}
        </div>

        {/* Service list */}
        <div className="border divide-y divide-zinc-200 rounded-2xl border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {service.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  {service.detail}
                </p>
              </div>
              {service.ok ? (
                <CheckCircle size={18} className="text-emerald-500" />
              ) : (
                <XCircle size={18} className="text-red-500" />
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-center text-zinc-400 dark:text-zinc-600">
          Status is determined by live API availability checks.
        </p>
      </div>
    </Container>
  );
}
