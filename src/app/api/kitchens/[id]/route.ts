import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { validateSameOrigin } from "@/lib/auth/origin";
import { updateKitchenSchema } from "@/lib/validations/kitchen";
import {
  getKitchenDetails,
  updateKitchen,
  deleteKitchen,
} from "@/lib/services/kitchens";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const kitchen = await getKitchenDetails(id, session.user.id);
    if (!kitchen) {
      return NextResponse.json(
        { error: "Kitchen not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ kitchen }, { status: 200 });
  } catch (error) {
    console.error("Get kitchen error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve kitchen details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parseResult = updateKitchenSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await updateKitchen(id, session.user.id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { error: "Kitchen not found or you lack permission to update it" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        kitchen: updated,
        message: "Kitchen updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update kitchen error:", error);
    return NextResponse.json(
      { error: "Failed to update kitchen" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 }
    );
  }

  const session = await getCurrentUser(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await deleteKitchen(id, session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Kitchen not found or you lack permission to delete it" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "Kitchen deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete kitchen error:", error);
    return NextResponse.json(
      { error: "Failed to delete kitchen" },
      { status: 500 }
    );
  }
}
