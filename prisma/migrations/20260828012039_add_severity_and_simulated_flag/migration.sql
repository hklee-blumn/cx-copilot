-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "isSimulated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'green';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isSimulated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Conversation_status_severity_updatedAt_idx" ON "Conversation"("status", "severity", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_isSimulated_status_idx" ON "Conversation"("isSimulated", "status");
