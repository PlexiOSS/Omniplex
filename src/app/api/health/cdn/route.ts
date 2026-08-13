import { NextResponse } from "next/server";
import { isCdnHealthy } from "@/lib/s3/health";

export async function GET() {
  const ok = await isCdnHealthy();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
