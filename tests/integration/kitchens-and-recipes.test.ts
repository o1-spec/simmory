import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testDb, clearTestDatabase } from "../setup";
import { hashPassword } from "@/lib/auth/password";
import {
  createKitchen,
  updateKitchen,
  deleteKitchen,
  listUserKitchens,
} from "@/lib/services/kitchens";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeDetails,
  listUserRecipes,
} from "@/lib/services/recipes";

describe("Phase 3: Family Kitchen and Recipe Management Integration Tests", () => {
  let userA: { id: string; name: string; email: string };
  let userB: { id: string; name: string; email: string };
  let userViewer: { id: string; name: string; email: string };

  beforeEach(async () => {
    await clearTestDatabase();

    const passwordHash = await hashPassword("ValidPassword123!");

    userA = await testDb.user.create({
      data: {
        name: "Abuela Rosa",
        email: "rosa@garcia-family.com",
        passwordHash,
      },
    });

    userB = await testDb.user.create({
      data: {
        name: "Chef Marco",
        email: "marco@rossi-kitchen.it",
        passwordHash,
      },
    });

    userViewer = await testDb.user.create({
      data: {
        name: "Grandson Leo",
        email: "leo@garcia-family.com",
        passwordHash,
      },
    });
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  describe("Kitchen Lifecycle and Membership", () => {
    it("should atomically create kitchen and assign owner role to creator", async () => {
      const { kitchen, member } = await createKitchen(userA.id, {
        name: "Garcia Family Hearth",
        description: "Generations of Oaxaca recipes",
      });

      expect(kitchen.id).toBeDefined();
      expect(kitchen.name).toBe("Garcia Family Hearth");
      expect(kitchen.ownerId).toBe(userA.id);

      expect(member.kitchenId).toBe(kitchen.id);
      expect(member.userId).toBe(userA.id);
      expect(member.role).toBe("OWNER");
    });

    it("should allow a user to belong to multiple kitchens", async () => {
      await createKitchen(userA.id, { name: "Oaxaca Archive" });
      await createKitchen(userA.id, { name: "Sunday Dinners" });

      const kitchens = await listUserKitchens(userA.id);
      expect(kitchens.length).toBe(2);
      expect(kitchens.map((k) => k.name)).toContain("Oaxaca Archive");
      expect(kitchens.map((k) => k.name)).toContain("Sunday Dinners");
    });

    it("should isolate kitchens across unrelated users (multi-tenant boundary)", async () => {
      await createKitchen(userA.id, { name: "Rosa's Private Hearth" });
      await createKitchen(userB.id, { name: "Marco's Trattoria Archive" });

      const kitchensA = await listUserKitchens(userA.id);
      expect(kitchensA.length).toBe(1);
      expect(kitchensA[0].name).toBe("Rosa's Private Hearth");

      const kitchensB = await listUserKitchens(userB.id);
      expect(kitchensB.length).toBe(1);
      expect(kitchensB[0].name).toBe("Marco's Trattoria Archive");
    });

    it("should allow the owner to update kitchen name and description", async () => {
      const { kitchen } = await createKitchen(userA.id, {
        name: "Draft Kitchen",
        description: "Original description",
      });

      const updated = await updateKitchen(kitchen.id, userA.id, {
        name: "Rosa's Permanent Kitchen",
        description: "Updated heirloom memories",
      });

      expect(updated?.name).toBe("Rosa's Permanent Kitchen");
      expect(updated?.description).toBe("Updated heirloom memories");
    });

    it("should reject kitchen update from non-owner", async () => {
      const { kitchen } = await createKitchen(userA.id, {
        name: "Rosa's Kitchen",
      });

      // User B attempts to rename User A's kitchen
      const result = await updateKitchen(kitchen.id, userB.id, {
        name: "Hacked Kitchen",
      });

      expect(result).toBeNull();

      // Verify name was not modified
      const current = await testDb.kitchen.findUnique({ where: { id: kitchen.id } });
      expect(current?.name).toBe("Rosa's Kitchen");
    });

    it("should reject kitchen deletion from non-owner and succeed for owner with cascading", async () => {
      const { kitchen } = await createKitchen(userA.id, {
        name: "Kitchen To Delete",
      });

      // User B cannot delete
      const unauthorizedDelete = await deleteKitchen(kitchen.id, userB.id);
      expect(unauthorizedDelete).toBe(false);

      // Owner can delete
      const ownerDelete = await deleteKitchen(kitchen.id, userA.id);
      expect(ownerDelete).toBe(true);

      const check = await testDb.kitchen.findUnique({ where: { id: kitchen.id } });
      expect(check).toBeNull();
    });
  });

  describe("Recipe Persistence and Sensory Cues", () => {
    it("should create recipe with ordered ingredients, steps, and authentic sensory cues", async () => {
      const { kitchen } = await createKitchen(userA.id, { name: "Rosa's Kitchen" });

      const recipe = await createRecipe(userA.id, {
        kitchenId: kitchen.id,
        title: "Mole Negro Oaxaqueño",
        cookName: "Abuela Rosa",
        description: "Complex celebratory black mole passed down three generations",
        story: "Grandmother made this for every wedding in the village.",
        origin: "Oaxaca, Mexico",
        notes: "Requires whole Mexican cinnamon and charred chilhuacle chiles.",
        ingredients: [
          { name: "Chilhuacle negro chiles", quantity: "6 dried pods", notes: "seeded and veined", position: 0 },
          { name: "Mexican chocolate", quantity: "2 rounds", notes: "stone-ground Ibarra", position: 1 },
          { name: "Lard or pork fat", quantity: "A generous ladle", notes: "fresh from the carnicería", position: 2 },
        ],
        steps: [
          {
            instruction: "Toast chiles on the dry comal until thoroughly blackened and smoking.",
            sensoryCue: "When the smoke smells acrid and the pods crackle when pressed",
            duration: "8-10 minutes",
            position: 0,
          },
          {
            instruction: "Fry the pureed paste in hot lard until the color deepens.",
            sensoryCue: "Cook until the oil rises and creates a glossy sheen over the dark paste",
            duration: "25 minutes",
            position: 1,
          },
        ],
      });

      expect(recipe).toBeDefined();
      expect(recipe?.title).toBe("Mole Negro Oaxaqueño");
      expect(recipe?.status).toBe("DRAFT");
      expect(recipe?.ingredients.length).toBe(3);
      expect(recipe?.steps.length).toBe(2);

      expect(recipe?.ingredients[0].name).toBe("Chilhuacle negro chiles");
      expect(recipe?.ingredients[2].quantity).toBe("A generous ladle");

      expect(recipe?.steps[1].sensoryCue).toBe(
        "Cook until the oil rises and creates a glossy sheen over the dark paste"
      );
    });

    it("should retrieve full recipe details with authorization checks (prevent IDOR)", async () => {
      const { kitchen } = await createKitchen(userA.id, { name: "Rosa's Kitchen" });

      const created = await createRecipe(userA.id, {
        kitchenId: kitchen.id,
        title: "Frijoles de la Olla",
        cookName: "Abuela Rosa",
        ingredients: [{ name: "Black beans", quantity: "2 cups" }],
        steps: [{ instruction: "Simmer with epazote until tender.", sensoryCue: "When beans crush easily between thumb and finger" }],
      });

      // Member (User A) can view recipe
      const recipeDetailsA = await getRecipeDetails(created!.id, userA.id);
      expect(recipeDetailsA).not.toBeNull();
      expect(recipeDetailsA?.title).toBe("Frijoles de la Olla");
      expect(recipeDetailsA?.canEdit).toBe(true);

      // Non-member (User B) cannot view recipe (IDOR protection)
      const recipeDetailsB = await getRecipeDetails(created!.id, userB.id);
      expect(recipeDetailsB).toBeNull();
    });

    it("should prevent viewers from creating or updating recipes", async () => {
      const { kitchen } = await createKitchen(userA.id, { name: "Rosa's Kitchen" });

      // Add userViewer as VIEWER
      await testDb.kitchenMember.create({
        data: {
          kitchenId: kitchen.id,
          userId: userViewer.id,
          role: "VIEWER",
        },
      });

      // Viewer cannot create recipes
      const unauthorizedCreate = await createRecipe(userViewer.id, {
        kitchenId: kitchen.id,
        title: "Unauthorized Recipe",
        cookName: "Leo",
      });
      expect(unauthorizedCreate).toBeNull();

      // Owner creates a recipe
      const ownerRecipe = await createRecipe(userA.id, {
        kitchenId: kitchen.id,
        title: "Caldo de Pollo",
        cookName: "Rosa",
      });

      // Viewer can view recipe
      const viewerDetails = await getRecipeDetails(ownerRecipe!.id, userViewer.id);
      expect(viewerDetails).not.toBeNull();
      expect(viewerDetails?.canEdit).toBe(false);

      // Viewer cannot update recipe
      const unauthorizedUpdate = await updateRecipe(ownerRecipe!.id, userViewer.id, {
        title: "Vandalized Title",
      });
      expect(unauthorizedUpdate).toBeNull();

      // Viewer cannot delete recipe
      const unauthorizedDelete = await deleteRecipe(ownerRecipe!.id, userViewer.id);
      expect(unauthorizedDelete).toBe(false);
    });

    it("should allow editor or owner to update recipe, ingredients, and steps atomically", async () => {
      const { kitchen } = await createKitchen(userA.id, { name: "Rosa's Kitchen" });

      const recipe = await createRecipe(userA.id, {
        kitchenId: kitchen.id,
        title: "Enmoladas",
        cookName: "Rosa",
        ingredients: [{ name: "Tortillas", quantity: "12" }],
        steps: [{ instruction: "Dip tortillas in hot mole." }],
      });

      const updated = await updateRecipe(recipe!.id, userA.id, {
        title: "Enmoladas Oaxaqueñas",
        cookName: "Abuela Rosa & Mom",
        description: "Folded corn tortillas saturated in warm mole negro",
        ingredients: [
          { name: "Heirloom corn tortillas", quantity: "12", notes: "warm from comal" },
          { name: "Queso fresco", quantity: "1 cup", notes: "crumbled" },
        ],
        steps: [
          {
            instruction: "Lightly pass tortillas through hot oil then dredge in simmering mole.",
            sensoryCue: "Until tortilla is supple but does not tear",
            duration: "10 seconds each",
          },
          {
            instruction: "Fold into quarters and scatter with crumbled queso fresco.",
          },
        ],
      });

      expect(updated?.title).toBe("Enmoladas Oaxaqueñas");
      expect(updated?.cookName).toBe("Abuela Rosa & Mom");
      expect(updated?.ingredients.length).toBe(2);
      expect(updated?.ingredients[0].name).toBe("Heirloom corn tortillas");
      expect(updated?.steps.length).toBe(2);
      expect(updated?.steps[0].sensoryCue).toBe("Until tortilla is supple but does not tear");
    });

    it("should delete recipe and cascade delete ingredients and steps", async () => {
      const { kitchen } = await createKitchen(userA.id, { name: "Rosa's Kitchen" });

      const recipe = await createRecipe(userA.id, {
        kitchenId: kitchen.id,
        title: "Temporary Recipe",
        cookName: "Rosa",
        ingredients: [{ name: "Salt", quantity: "1 pinch" }],
        steps: [{ instruction: "Stir" }],
      });

      const recipeId = recipe!.id;

      const deleted = await deleteRecipe(recipeId, userA.id);
      expect(deleted).toBe(true);

      const checkRecipe = await testDb.recipe.findUnique({ where: { id: recipeId } });
      expect(checkRecipe).toBeNull();

      const remainingIngredients = await testDb.recipeIngredient.findMany({ where: { recipeId } });
      expect(remainingIngredients.length).toBe(0);

      const remainingSteps = await testDb.recipeStep.findMany({ where: { recipeId } });
      expect(remainingSteps.length).toBe(0);
    });

    it("should search recipes by keyword and filter by kitchen and status", async () => {
      const { kitchen: k1 } = await createKitchen(userA.id, { name: "Rosa's Main Kitchen" });
      const { kitchen: k2 } = await createKitchen(userA.id, { name: "Holiday Baking" });

      await createRecipe(userA.id, {
        kitchenId: k1.id,
        title: "Tamales de Mole",
        cookName: "Abuela Rosa",
        description: "Steamed in banana leaves",
      });

      await createRecipe(userA.id, {
        kitchenId: k1.id,
        title: "Pozole Rojo",
        cookName: "Tia Maria",
        description: "Hominy pork stew",
      });

      await createRecipe(userA.id, {
        kitchenId: k2.id,
        title: "Pan de Muerto",
        cookName: "Abuela Rosa",
        description: "Orange blossom brioche",
      });

      // Search by keyword "Tamales"
      const searchResult = await listUserRecipes(userA.id, { query: "Tamales" });
      expect(searchResult.recipes.length).toBe(1);
      expect(searchResult.recipes[0].title).toBe("Tamales de Mole");

      // Search by cook name "Tia Maria"
      const cookResult = await listUserRecipes(userA.id, { query: "Maria" });
      expect(cookResult.recipes.length).toBe(1);
      expect(cookResult.recipes[0].title).toBe("Pozole Rojo");

      // Filter by kitchen "Holiday Baking"
      const kitchenResult = await listUserRecipes(userA.id, { kitchenId: k2.id });
      expect(kitchenResult.recipes.length).toBe(1);
      expect(kitchenResult.recipes[0].title).toBe("Pan de Muerto");
    });
  });
});
