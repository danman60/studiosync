'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';

export default function AdminMessagesPage() {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  if (selectedFamily) {
    return <ConversationView familyId={selectedFamily} onBack={() => setSelectedFamily(null)} />;
  }

  return <ConversationList onSelect={setSelectedFamily} />;
}

function ConversationList({ onSelect }: { onSelect: (id: string) => void }) {
  const conversations = trpc.messaging.adminConversations.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Messages</h1>
        <p className="mt-1 text-sm text-stone-500">Direct conversations with families.</p>
      </div>

      {conversations.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="skeleton h-5 w-40 mb-2" />
              <div className="skeleton h-4 w-64" />
            </div>
          ))}
        </div>
      )}

      {!conversations.isLoading && (conversations.data?.length ?? 0) === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <MessageCircle size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No messages yet</p>
          <p className="mt-1 text-xs text-stone-400">When families send messages, they will appear here.</p>
        </div>
      )}

      {(conversations.data ?? []).length > 0 && (
        <div className="space-y-3">
          {(conversations.data ?? []).map((conv, idx) => (
            <button
              key={conv.familyId}
              onClick={() => onSelect(conv.familyId)}
              className={`glass-card flex w-full items-center justify-between rounded-2xl p-5 text-left animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-800">
                    {conv.family?.parent_first_name} {conv.family?.parent_last_name}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-stone-400">{conv.family?.email}</p>
                <p className="mt-1 truncate text-sm text-stone-500">
                  {conv.lastSenderType === 'admin' ? 'You: ' : ''}{conv.lastMessage}
                </p>
              </div>
              <span className="ml-4 text-xs text-stone-400 whitespace-nowrap">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationView({ familyId, onBack }: { familyId: string; onBack: () => void }) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const messages = trpc.messaging.adminMessages.useQuery({ familyId });
  const sendMutation = trpc.messaging.adminSend.useMutation({
    onSuccess: () => {
      setText('');
      utils.messaging.adminMessages.invalidate({ familyId });
      utils.messaging.adminConversations.invalidate();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate({ familyId, body: text.trim() });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <button onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Messages
        </button>
        <h1 className="text-lg font-bold text-stone-800">Conversation</h1>
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
        {(messages.data ?? []).map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.sender_type === 'admin'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-stone-200 text-stone-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              <p className={`mt-1 text-[10px] ${msg.sender_type === 'admin' ? 'text-primary-200' : 'text-stone-400'}`}>
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
