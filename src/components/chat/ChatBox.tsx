'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatBoxProps {
  conversationId: string;
  currentUserId: string;
  recipientName: string;
  initialMessages?: Message[];
}

export default function ChatBox({
  conversationId,
  currentUserId,
  recipientName,
  initialMessages = [],
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToLatest = () => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToLatest();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incomingMessage = payload.new as Message;
          setMessages((current) => {
            if (current.some((msg) => msg.id === incomingMessage.id)) {
              return current;
            }
            return [...current, incomingMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = inputText.trim();
    if (!cleanContent || isSubmitting) return;

    setIsSubmitting(true);
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: cleanContent,
    });

    if (error) {
      console.error('Failed to send message:', error.message);
      setInputText(cleanContent);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] bg-[#17131F] text-[#E6D7FA]">
      <div className="px-5 py-4 bg-[#241E2F] border-b border-[#9A79BA]/20 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#E6D7FA]">{recipientName}</h2>
          <span className="text-xs text-[#9A79BA]">Active Conversation</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-[#653C87] text-white rounded-br-sm shadow-sm'
                    : 'bg-[#241E2F] text-[#E6D7FA] border border-[#9A79BA]/20 rounded-bl-sm'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <span
                  className={`block text-[10px] mt-1 text-right ${
                    isMe ? 'text-[#E6D7FA]/70' : 'text-[#9A79BA]'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollAnchorRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#241E2F] border-t border-[#9A79BA]/20 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-[#17131F] text-[#E6D7FA] placeholder-[#9A79BA]/50 text-sm px-4 py-3 rounded-xl border border-[#9A79BA]/20 focus:outline-none focus:border-[#9A79BA]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSubmitting}
          className="bg-[#653C87] hover:bg-[#7a48a4] disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
