-- CreateTable
CREATE TABLE "AuthMagicLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "redirectTo" TEXT NOT NULL DEFAULT '/dashboard',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthMagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthMagicLink_tokenHash_key" ON "AuthMagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthMagicLink_userId_idx" ON "AuthMagicLink"("userId");

-- CreateIndex
CREATE INDEX "AuthMagicLink_email_idx" ON "AuthMagicLink"("email");

-- CreateIndex
CREATE INDEX "AuthMagicLink_expiresAt_idx" ON "AuthMagicLink"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthMagicLink_usedAt_idx" ON "AuthMagicLink"("usedAt");

-- AddForeignKey
ALTER TABLE "AuthMagicLink" ADD CONSTRAINT "AuthMagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
