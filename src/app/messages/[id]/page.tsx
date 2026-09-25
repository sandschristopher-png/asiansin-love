import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatBox from '@/components/chat/ChatBox';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id: conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch conversation metadata
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    redirect('/messages');
  }

  // Identify recipient
  const recipientId =
    conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;

  // Fetch recipient profile info
  const { data: recipientProfile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', recipientId)
    .single();

  const recipientName =
    recipientProfile?.full_name || recipientProfile?.username || 'Member';

  // Fetch initial message history
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return (
    <main className="min-h-screen bg-[#17131F]">
      <ChatBox
        conversationId={conversationId}
        currentUserId={user.id}
        recipientName={recipientName}
        initialMessages={initialMessages || []}
      />
    </main>
  );
}
