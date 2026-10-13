import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Fetch kitchen count and recipe count for user
  const [kitchenCount, recipeCount] = await Promise.all([
    db.kitchenMember.count({
      where: { userId: session.user.id },
    }),
    db.recipe.count({
      where: { createdById: session.user.id },
    }),
  ]);

  return NextResponse.json(
    {
      user: {
        ...session.user,
        kitchenCount,
        recipeCount,
      },
    },
    { status: 200 }
  );
}
