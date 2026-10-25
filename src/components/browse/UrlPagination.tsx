"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/search/Pagination";

interface UrlPaginationProps {
  page: number;
  total: number;
  perPage: number;
}

export function UrlPagination({ page, total, perPage }: UrlPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Pagination
      page={page}
      total={total}
      perPage={perPage}
      onPageChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next > 1) params.set("page", String(next));
        else params.delete("page");
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    />
  );
}
