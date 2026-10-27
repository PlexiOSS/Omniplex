import { XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { StatusCard } from "@/components/ui/StatusCard";

export const metadata: Metadata = {
  title: "Payment Cancelled",
};

export default function PaymentCancelledPage() {
  return (
    <Container className="flex flex-1 items-center py-24">
      <StatusCard
        icon={XCircle}
        tone="neutral"
        title="Payment cancelled"
        description="No charge was made. You can try again whenever you're ready."
        actions={
          <Link href="/premium">
            <Button variant="primary" size="sm">
              Back to Premium
            </Button>
          </Link>
        }
      />
    </Container>
  );
}
