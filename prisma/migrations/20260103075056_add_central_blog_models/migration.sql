-- CreateTable
CREATE TABLE "CentralArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(6),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featuredImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentralArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonArticle" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "centralArticleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customCtaLabel" TEXT,
    "customCtaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CentralArticle_slug_key" ON "CentralArticle"("slug");

-- CreateIndex
CREATE INDEX "CentralArticle_status_publishedAt_idx" ON "CentralArticle"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "SalonArticle_salonId_isActive_idx" ON "SalonArticle"("salonId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SalonArticle_salonId_centralArticleId_key" ON "SalonArticle"("salonId", "centralArticleId");

-- AddForeignKey
ALTER TABLE "SalonArticle" ADD CONSTRAINT "SalonArticle_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonArticle" ADD CONSTRAINT "SalonArticle_centralArticleId_fkey" FOREIGN KEY ("centralArticleId") REFERENCES "CentralArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
