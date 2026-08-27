import ConversationThread from "@/components/dashboard/ConversationThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConversationThread conversationId={id} />;
}
