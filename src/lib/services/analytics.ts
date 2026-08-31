import { prisma } from "@/lib/db";

export async function getDashboardAnalytics() {
  const [
    total,
    resolvedTotal,
    resolvedWithoutHuman,
    everEscalated,
    severityCounts,
    refundGroups,
    resolvedForDuration,
    volumeRows,
    fraudFlaggedPhotos,
    fraudFlaggedConversations,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: "resolved" } }),
    prisma.conversation.count({
      where: { status: "resolved", assignedAgentId: null },
    }),
    prisma.conversation.count({
      where: { OR: [{ assignedAgentId: { not: null } }, { status: "escalated" }] },
    }),
    prisma.conversation.groupBy({ by: ["severity"], _count: { severity: true } }),
    prisma.refundDecision.groupBy({
      by: ["decision"],
      _count: { decision: true },
      _sum: { amountCents: true },
    }),
    prisma.conversation.findMany({
      where: { status: "resolved" },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.$queryRaw<{ hour: Date; count: bigint }[]>`
      SELECT date_trunc('hour', "createdAt") as hour, COUNT(*) as count
      FROM "Conversation"
      GROUP BY hour
      ORDER BY hour ASC
      LIMIT 24
    `,
    prisma.message.count({ where: { photoLooksFake: true } }),
    prisma.conversation.findMany({
      where: { messages: { some: { photoLooksFake: true } } },
      select: { refundDecisions: { select: { amountCents: true } } },
    }),
  ]);

  const avgResolutionMinutes =
    resolvedForDuration.length > 0
      ? resolvedForDuration.reduce(
          (sum, c) => sum + (c.updatedAt.getTime() - c.createdAt.getTime()) / 60000,
          0
        ) / resolvedForDuration.length
      : 0;

  const severityBreakdown = { green: 0, yellow: 0, orange: 0, red: 0 } as Record<
    string,
    number
  >;
  for (const row of severityCounts) {
    severityBreakdown[row.severity] = row._count.severity;
  }

  const refundSummary = { approved: 0, rejected: 0, escalated: 0 } as Record<
    string,
    number
  >;
  let approvedAmountCents = 0;
  for (const row of refundGroups) {
    refundSummary[row.decision] = row._count.decision;
    if (row.decision === "approved") {
      approvedAmountCents = row._sum.amountCents ?? 0;
    }
  }

  const fraudPreventedAmountCents = fraudFlaggedConversations.reduce(
    (sum, c) => sum + c.refundDecisions.reduce((s, r) => s + r.amountCents, 0),
    0
  );

  return {
    total,
    resolvedTotal,
    resolvedWithoutHuman,
    resolutionRate: total > 0 ? resolvedTotal / total : 0,
    autoResolvedRate: resolvedTotal > 0 ? resolvedWithoutHuman / resolvedTotal : 0,
    escalationRate: total > 0 ? everEscalated / total : 0,
    avgResolutionMinutes,
    severityBreakdown,
    refundSummary,
    approvedAmountCents,
    volume: volumeRows.map((r) => ({ hour: r.hour, count: Number(r.count) })),
    fraudFlaggedPhotos,
    fraudPreventedAmountCents,
  };
}
