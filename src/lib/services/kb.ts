import { prisma } from "@/lib/db";

export async function listArticles() {
  return prisma.kbArticle.findMany({ orderBy: { title: "asc" } });
}
