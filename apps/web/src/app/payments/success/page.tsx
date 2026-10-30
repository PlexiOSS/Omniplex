import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { StatusCard } from "@/components/ui/StatusCard";

export const metadata: Metadata = {
  title: "Payment Successful",
};

export default function PaymentSuccessPage() {
  return (
    <Container className="flex flex-1 items-center py-24">
      <StatusCard
        icon={CheckCircle2}
        tone="success"
        title="Payment successful"
        description="Thanks! Premium has been applied to your listing. It may take a minute to show up."
        actions={
          <>
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Go to dashboard
              </Button>
            </Link>
            <Link href="/premium">
              <Button variant="secondary" size="sm">
                Back to Premium
              </Button>
            </Link>
          </>
        }
      />
    </Container>
  );
}
