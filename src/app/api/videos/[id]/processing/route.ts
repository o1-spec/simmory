import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getVideoProcessingStatus } from "@/lib/services/jobs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing video identifier" }, { status: 400 });
  }

  try {
    const status = await getVideoProcessingStatus(session.user.id, id);
    if (!status) {
      return NextResponse.json(
        { error: "Video not found or you lack permission to view its status" },
        { status: 404 }
      );
    }

    return NextResponse.json(status, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("GET video processing status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve video processing status" },
      { status: 500 }
    );
  }
}
