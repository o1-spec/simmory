import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { testDb, clearTestDatabase } from "../setup";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { GET as listKitchensHandler, POST as createKitchenHandler } from "@/app/api/kitchens/route";
import { GET as getKitchenHandler } from "@/app/api/kitchens/[id]/route";
import { POST as createRecipeHandler } from "@/app/api/recipes/route";
import { GET as getRecipeHandler, PATCH as patchRecipeHandler, DELETE as deleteRecipeHandler } from "@/app/api/recipes/[id]/route";

describe("Kitchens & Recipes API Endpoints Integration", () => {
  let cookieHeader: string;

  beforeEach(async () => {
    await clearTestDatabase();

    // Register a user to obtain valid authenticated session cookies
    const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Chef Maya",
        email: "maya@spice-kitchen.com",
        password: "MayaPassword2026!",
        confirmPassword: "MayaPassword2026!",
      }),
    });

    const regRes = await registerHandler(regReq);
    expect(regRes.status).toBe(201);

    const setCookies = regRes.headers.getSetCookie();
    cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("POST /api/kitchens should create a new kitchen and GET /api/kitchens should list it", async () => {
    // 1. Create kitchen
    const createReq = new NextRequest("http://localhost:3000/api/kitchens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: "Maya's Curry Laboratory",
        description: "Specialized South Asian heirloom recipes",
      }),
    });

    const createRes = await createKitchenHandler(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.kitchen.name).toBe("Maya's Curry Laboratory");

    // 2. List kitchens
    const listReq = new NextRequest("http://localhost:3000/api/kitchens", {
      headers: { host: "localhost:3000", cookie: cookieHeader },
    });
    const listRes = await listKitchensHandler(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();

    // Default kitchen + newly created kitchen
    expect(listData.kitchens.length).toBe(2);
    expect(listData.kitchens.some((k: { name: string }) => k.name === "Maya's Curry Laboratory")).toBe(true);
  });

  it("GET /api/kitchens/[id] should return kitchen details with members", async () => {
    // Get default kitchen
    const listReq = new NextRequest("http://localhost:3000/api/kitchens", {
      headers: { host: "localhost:3000", cookie: cookieHeader },
    });
    const listRes = await listKitchensHandler(listReq);
    const listData = await listRes.json();
    const defaultKitchen = listData.kitchens[0];

    const getReq = new NextRequest(`http://localhost:3000/api/kitchens/${defaultKitchen.id}`, {
      headers: {
        host: "localhost:3000",
        cookie: cookieHeader,
      },
    });

    const getRes = await getKitchenHandler(getReq, { params: Promise.resolve({ id: defaultKitchen.id }) });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.kitchen.name).toBe(defaultKitchen.name);
    expect(getData.kitchen.members.length).toBe(1);
  });

  it("POST /api/recipes, GET /api/recipes/[id], and DELETE /api/recipes/[id] lifecycle", async () => {
    const listReq = new NextRequest("http://localhost:3000/api/kitchens", {
      headers: { host: "localhost:3000", cookie: cookieHeader },
    });
    const listRes = await listKitchensHandler(listReq);
    const listData = await listRes.json();
    const kitchen = listData.kitchens[0];

    // 1. Create Recipe
    const postRecipeReq = new NextRequest("http://localhost:3000/api/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        kitchenId: kitchen.id,
        title: "Heirloom Biryani",
        cookName: "Dadi Maya",
        description: "Slow-cooked dum biryani",
        story: "Made on Eid for sixty relatives",
        ingredients: [
          { name: "Basmati rice", quantity: "4 cups", notes: "aged" },
          { name: "Saffron milk", quantity: "A pinch in warm milk" },
        ],
        steps: [
          {
            instruction: "Parboil rice with whole spices until 70% cooked.",
            sensoryCue: "When the grain breaks with a slight snap in the center",
          },
          {
            instruction: "Seal the heavy pot with dough and cook on low heat.",
            sensoryCue: "When the dough seal hardens and a fragrant steam escapes",
          },
        ],
      }),
    });

    const createRecipeRes = await createRecipeHandler(postRecipeReq);
    expect(createRecipeRes.status).toBe(201);
    const recipeData = await createRecipeRes.json();
    const recipeId = recipeData.recipe.id;

    expect(recipeData.recipe.title).toBe("Heirloom Biryani");
    expect(recipeData.recipe.ingredients.length).toBe(2);
    expect(recipeData.recipe.steps.length).toBe(2);

    // 2. GET recipe by id
    const getRecipeReq = new NextRequest(`http://localhost:3000/api/recipes/${recipeId}`, {
      headers: {
        host: "localhost:3000",
        cookie: cookieHeader,
      },
    });

    const getRes = await getRecipeHandler(getRecipeReq, { params: Promise.resolve({ id: recipeId }) });
    expect(getRes.status).toBe(200);
    const recipeDetail = await getRes.json();
    expect(recipeDetail.recipe.cookName).toBe("Dadi Maya");
    expect(recipeDetail.recipe.canEdit).toBe(true);

    // 3. PATCH recipe
    const patchReq = new NextRequest(`http://localhost:3000/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: "Dadi's Royal Dum Biryani",
      }),
    });

    const patchRes = await patchRecipeHandler(patchReq, { params: Promise.resolve({ id: recipeId }) });
    expect(patchRes.status).toBe(200);
    const patchedData = await patchRes.json();
    expect(patchedData.recipe.title).toBe("Dadi's Royal Dum Biryani");

    // 4. DELETE recipe
    const deleteReq = new NextRequest(`http://localhost:3000/api/recipes/${recipeId}`, {
      method: "DELETE",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie: cookieHeader,
      },
    });

    const deleteRes = await deleteRecipeHandler(deleteReq, { params: Promise.resolve({ id: recipeId }) });
    expect(deleteRes.status).toBe(200);

    // 5. Verify deletion
    const verifyGet = await getRecipeHandler(getRecipeReq, { params: Promise.resolve({ id: recipeId }) });
    expect(verifyGet.status).toBe(404);
  });
});
