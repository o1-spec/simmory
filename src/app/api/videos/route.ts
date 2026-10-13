import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { listUserVideos } from "@/lib/services/videos";
import { VideoUploadStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kitchenId = searchParams.get("kitchenId") || undefined;
  const statusParam = searchParams.get("uploadStatus") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") || "12", 10) || 12;

  let uploadStatus: VideoUploadStatus | undefined;
  if (
    statusParam &&
    Object.values(VideoUploadStatus).includes(statusParam as VideoUploadStatus)
  ) {
    uploadStatus = statusParam as VideoUploadStatus;
  }

  try {
    const result = await listUserVideos(session.user.id, {
      kitchenId,
      uploadStatus,
      page,
      limit,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("List videos error:", error);
    return NextResponse.json(
      { error: "Failed to list cooking videos" },
      { status: 500 }
    );
  }
}
