import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Payment Cancelled",
};

export default function PaymentCancelledPage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <XCircle size={28} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Payment cancelled
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        No charge was made. You can try again whenever you're ready.
      </p>
      <Link href="/premium" className="mt-6">
        <Button variant="primary" size="sm">
          Back to Premium
        </Button>
      </Link>
    </Container>
  );
}
