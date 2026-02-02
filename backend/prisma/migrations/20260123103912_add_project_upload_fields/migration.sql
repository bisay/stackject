-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "repoUrl" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'public';
