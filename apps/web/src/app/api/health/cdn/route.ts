import { isCdnHealthy } from "@omniplex/core/s3/health";
import { NextResponse } from "next/server";

export async function GET() {
  const ok = await isCdnHealthy();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
