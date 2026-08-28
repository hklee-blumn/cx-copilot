import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { deleteArticle, updateArticle } from "@/lib/services/kb";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, slug, body, tags } = await request.json();
  if (!title || !slug || !body) {
    return NextResponse.json(
      { error: "title, slug, and body are required" },
      { status: 400 }
    );
  }

  try {
    const article = await updateArticle(id, { title, slug, body, tags: tags ?? "" });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteArticle(id);
  return NextResponse.json({ ok: true });
}
