import { NextResponse } from "next/server";
import { isStorageConfigured, getMaxVideoSizeBytes } from "@/lib/storage/r2";

export async function GET() {
  const configured = isStorageConfigured();
  const maxBytes = getMaxVideoSizeBytes();

  return NextResponse.json(
    {
      configured,
      maxUploadSizeBytes: maxBytes,
      maxUploadSizeMb: Math.round(maxBytes / (1024 * 1024)),
    },
    { status: 200 }
  );
}
