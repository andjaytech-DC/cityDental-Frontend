-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('QUEUED', 'SUCCESS', 'FAILED', 'NOT_CONFIGURED');

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_locationId_fkey";

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "template" TEXT,
    "message" TEXT,
    "status" "CommunicationStatus" NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "failureReason" TEXT,
    "initiatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communications_organizationId_createdAt_idx" ON "communications"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "communications_patientId_idx" ON "communications"("patientId");

-- CreateIndex
CREATE INDEX "communications_initiatedById_idx" ON "communications"("initiatedById");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
