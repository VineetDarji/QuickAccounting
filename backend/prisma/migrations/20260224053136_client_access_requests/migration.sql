-- CreateTable
CREATE TABLE "ClientAccessRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestedName" TEXT NOT NULL,
    "requestedEmail" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientAccessRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClientAccessRequest_requestedEmail_status_createdAt_idx" ON "ClientAccessRequest"("requestedEmail", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ClientAccessRequest_status_createdAt_idx" ON "ClientAccessRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ClientAccessRequest_userId_createdAt_idx" ON "ClientAccessRequest"("userId", "createdAt");
