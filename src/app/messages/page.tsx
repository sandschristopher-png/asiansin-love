import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function MessagesInboxPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all conversations where current user is user1 or user2
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      updated_at,
      user1_id,
      user2_id,
      messages(content, created_at, sender_id)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error.message);
  }

  // Get recipient profile IDs
  const recipientIds = (conversations || []).map((c) =>
    c.user1_id === user.id ? c.user2_id : c.user1_id
  );

  // Fetch profiles for all recipients
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', recipientIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return (
    <main className="min-h-screen bg-[#17131F] text-[#E6D7FA] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#9A79BA]/20 pb-4">
          <h1 className="text-2xl font-bold text-[#E6D7FA]">Messages</h1>
          <span className="text-xs text-[#9A79BA] bg-[#241E2F] px-3 py-1.5 rounded-full border border-[#9A79BA]/20">
            {conversations?.length || 0} active
          </span>
        </div>

        {(!conversations || conversations.length === 0) ? (
          <div className="bg-[#241E2F] border border-[#9A79BA]/20 rounded-2xl p-8 text-center space-y-3">
            <p className="text-[#E6D7FA] font-medium">No conversations yet</p>
            <p className="text-sm text-[#9A79BA]">
              Match or connect with members to start sincere conversations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#9A79BA]/10 bg-[#241E2F] border border-[#9A79BA]/20 rounded-2xl overflow-hidden">
            {conversations.map((conv) => {
              const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
              const profile = profileMap.get(otherUserId);
              const displayName = profile?.full_name || profile?.username || 'Member';
              
              // Sort to get latest message snippet
              const sortedMsgs = (conv.messages || []).sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const latestMessage = sortedMsgs[0];

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="block p-4 hover:bg-[#653C87]/15 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-[#E6D7FA]">
                      {displayName}
                    </span>
                    {latestMessage && (
                      <span className="text-[11px] text-[#9A79BA]">
                        {new Date(latestMessage.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9A79BA] truncate">
                    {latestMessage ? latestMessage.content : 'No messages yet...'}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
