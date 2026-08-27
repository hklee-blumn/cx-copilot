import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function getOrCreateAgentForCurrentUser() {
  const user = await currentUser();
  if (!user) return null;

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name = user.fullName ?? email;

  return prisma.agent.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
}
