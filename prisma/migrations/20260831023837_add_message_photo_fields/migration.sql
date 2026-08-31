-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "photoAnalysisReasoning" TEXT,
ADD COLUMN     "photoFakeReason" TEXT,
ADD COLUMN     "photoLooksFake" BOOLEAN,
ADD COLUMN     "photoSupportsRefund" BOOLEAN;
