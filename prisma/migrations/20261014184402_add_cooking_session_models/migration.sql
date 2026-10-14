-- CreateEnum
CREATE TYPE "CookingSessionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "cooking_sessions" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kitchenId" UUID NOT NULL,
    "status" "CookingSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStepId" UUID,
    "currentStepPosition" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_steps" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cooking_session_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_ingredients" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cooking_session_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cooking_sessions_recipeId_idx" ON "cooking_sessions"("recipeId");

-- CreateIndex
CREATE INDEX "cooking_sessions_userId_idx" ON "cooking_sessions"("userId");

-- CreateIndex
CREATE INDEX "cooking_sessions_kitchenId_idx" ON "cooking_sessions"("kitchenId");

-- CreateIndex
CREATE INDEX "cooking_sessions_status_idx" ON "cooking_sessions"("status");

-- CreateIndex
CREATE INDEX "cooking_session_steps_sessionId_idx" ON "cooking_session_steps"("sessionId");

-- CreateIndex
CREATE INDEX "cooking_session_steps_stepId_idx" ON "cooking_session_steps"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "cooking_session_steps_sessionId_stepId_key" ON "cooking_session_steps"("sessionId", "stepId");

-- CreateIndex
CREATE INDEX "cooking_session_ingredients_sessionId_idx" ON "cooking_session_ingredients"("sessionId");

-- CreateIndex
CREATE INDEX "cooking_session_ingredients_ingredientId_idx" ON "cooking_session_ingredients"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "cooking_session_ingredients_sessionId_ingredientId_key" ON "cooking_session_ingredients"("sessionId", "ingredientId");

-- AddForeignKey
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "kitchens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_steps" ADD CONSTRAINT "cooking_session_steps_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_steps" ADD CONSTRAINT "cooking_session_steps_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_ingredients" ADD CONSTRAINT "cooking_session_ingredients_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_ingredients" ADD CONSTRAINT "cooking_session_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "recipe_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
