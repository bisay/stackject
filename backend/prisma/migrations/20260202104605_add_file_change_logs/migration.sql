-- CreateTable
CREATE TABLE "file_change_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "description" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_change_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_change_logs" ADD CONSTRAINT "file_change_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
