import { db } from "@/lib/db";
import { CreateKitchenInput, UpdateKitchenInput } from "@/lib/validations/kitchen";
import { requireKitchenMember, requireKitchenOwner } from "@/lib/auth/permissions";

export async function listUserKitchens(userId: string) {
  const memberships = await db.kitchenMember.findMany({
    where: { userId },
    include: {
      kitchen: {
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              recipes: true,
              members: true,
              videos: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return memberships.map((m) => ({
    id: m.kitchen.id,
    name: m.kitchen.name,
    description: m.kitchen.description,
    coverImageUrl: m.kitchen.coverImageUrl,
    ownerId: m.kitchen.ownerId,
    ownerName: m.kitchen.owner.name,
    myRole: m.role,
    isOwner: m.kitchen.ownerId === userId,
    recipeCount: m.kitchen._count.recipes,
    memberCount: m.kitchen._count.members,
    videoCount: m.kitchen._count.videos,
    createdAt: m.kitchen.createdAt,
    updatedAt: m.kitchen.updatedAt,
  }));
}

export async function getKitchenDetails(kitchenId: string, userId: string) {
  const membership = await requireKitchenMember(userId, kitchenId);
  if (!membership) {
    return null;
  }

  const kitchen = await db.kitchen.findUnique({
    where: { id: kitchenId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      recipes: {
        select: {
          id: true,
          title: true,
          cookName: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ingredients: true,
              steps: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      videos: {
        select: {
          id: true,
          originalFilename: true,
          contentType: true,
          expectedSize: true,
          actualSize: true,
          uploadStatus: true,
          processingStatus: true,
          createdAt: true,
          recipe: {
            select: { id: true, title: true, cookName: true },
          },
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!kitchen) {
    return null;
  }

  return {
    ...kitchen,
    myRole: membership.role,
    isOwner: kitchen.ownerId === userId,
  };
}

export async function createKitchen(userId: string, input: CreateKitchenInput) {
  return db.$transaction(async (tx) => {
    const kitchen = await tx.kitchen.create({
      data: {
        name: input.name,
        description: input.description || null,
        ownerId: userId,
      },
    });

    const member = await tx.kitchenMember.create({
      data: {
        kitchenId: kitchen.id,
        userId,
        role: "OWNER",
      },
    });

    return { kitchen, member };
  });
}

export async function updateKitchen(
  kitchenId: string,
  userId: string,
  input: UpdateKitchenInput
) {
  const ownerCheck = await requireKitchenOwner(userId, kitchenId);
  if (!ownerCheck) {
    return null;
  }

  return db.kitchen.update({
    where: { id: kitchenId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
    },
  });
}

export async function deleteKitchen(kitchenId: string, userId: string) {
  const ownerCheck = await requireKitchenOwner(userId, kitchenId);
  if (!ownerCheck) {
    return false;
  }

  await db.kitchen.delete({
    where: { id: kitchenId },
  });

  return true;
}

export async function listKitchenMembers(kitchenId: string, userId: string) {
  const membership = await requireKitchenMember(userId, kitchenId);
  if (!membership) {
    return null;
  }

  const members = await db.kitchenMember.findMany({
    where: { kitchenId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}
