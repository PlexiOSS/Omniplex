import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default function PaymentSuccessPage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
        <CheckCircle2 size={28} className="text-green-500" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Payment successful
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Thanks! Premium has been applied to your bot. It may take a minute
        to show up.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="primary" size="sm">
          Go to dashboard
        </Button>
      </Link>
    </Container>
  );
}
