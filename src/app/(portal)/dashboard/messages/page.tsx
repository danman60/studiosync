'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Send, MessageCircle } from 'lucide-react';

export default function ParentMessagesPage() {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const messages = trpc.messaging.myMessages.useQuery();
  const sendMutation = trpc.messaging.parentSend.useMutation({
    onSuccess: () => {
      setText('');
      utils.messaging.myMessages.invalidate();
      utils.messaging.unreadCount.invalidate();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate({ body: text.trim() });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Messages</h1>
        <p className="mt-1 text-sm text-stone-500">Send messages to your studio.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
        {messages.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-2/3 rounded-xl" />
            ))}
          </div>
        )}
        {!messages.isLoading && (messages.data?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <MessageCircle size={24} className="text-primary-light" />
            </div>
            <p className="text-sm font-medium text-stone-600">No messages yet</p>
            <p className="mt-1 text-xs text-stone-400">Send a message to start a conversation with your studio.</p>
          </div>
        )}
        {(messages.data ?? []).map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === 'parent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.sender_type === 'parent'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-stone-200 text-stone-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              <p className={`mt-1 text-[10px] ${msg.sender_type === 'parent' ? 'text-primary-200' : 'text-stone-400'}`}>
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-4 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="h-11 flex-1 rounded-xl border border-stone-200 bg-white px-4 text-sm input-glow"
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMutation.isPending}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
        >
          <Send size={16} /> Send
        </button>
      </form>
      {sendMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{sendMutation.error.message}</p>
      )}
    </div>
  );
}
