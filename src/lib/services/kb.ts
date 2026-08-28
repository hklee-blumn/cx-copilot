import { prisma } from "@/lib/db";

export async function listArticles() {
  return prisma.kbArticle.findMany({ orderBy: { title: "asc" } });
}

export async function createArticle(data: {
  title: string;
  slug: string;
  body: string;
  tags: string;
}) {
  return prisma.kbArticle.create({ data });
}

export async function updateArticle(
  id: string,
  data: { title: string; slug: string; body: string; tags: string }
) {
  return prisma.kbArticle.update({ where: { id }, data });
}

export async function deleteArticle(id: string) {
  return prisma.kbArticle.delete({ where: { id } });
}
