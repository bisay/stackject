-- CreateTable
CREATE TABLE "file_nodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT,
    "diskPath" TEXT,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_nodes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_nodes" ADD CONSTRAINT "file_nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_nodes" ADD CONSTRAINT "file_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "file_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
