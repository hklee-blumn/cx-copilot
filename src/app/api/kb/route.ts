import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createArticle, listArticles } from "@/lib/services/kb";

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const { title, slug, body, tags } = await request.json();
  if (!title || !slug || !body) {
    return NextResponse.json(
      { error: "title, slug, and body are required" },
      { status: 400 }
    );
  }

  try {
    const article = await createArticle({ title, slug, body, tags: tags ?? "" });
    return NextResponse.json({ article });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "An article with that slug already exists." },
        { status: 409 }
      );
    }
    throw e;
  }
}
