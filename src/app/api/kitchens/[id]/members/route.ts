import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { listKitchenMembers } from "@/lib/services/kitchens";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const members = await listKitchenMembers(id, session.user.id);
    if (!members) {
      return NextResponse.json(
        { error: "Kitchen not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error("List kitchen members error:", error);
    return NextResponse.json(
      { error: "Failed to list kitchen members" },
      { status: 500 }
    );
  }
}
