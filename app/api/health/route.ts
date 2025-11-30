import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: Math.floor(Date.now() / 1000),
  });
}


