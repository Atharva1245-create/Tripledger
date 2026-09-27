import React, { useState } from 'react';
import { Bot, Send, Sparkles, User as UserIcon, MessageSquare } from 'lucide-react';

interface AIAssistantPageProps {
  tripId: string;
  digitalTwinScenario?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  references?: { title: string; amount: number; category?: string }[];
  timestamp: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ tripId, digitalTwinScenario }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      text: 'How much do I owe?',
      timestamp: '10:00 AM'
    },
    {
      id: '2',
      sender: 'ai',
      text: 'You owe ₹1,850 across trip expenses. See details below.',
      references: [
        { title: 'Rahul references', amount: 2400, category: 'Amit' },
        { title: 'Individual shares', amount: 1850, category: 'All' }
      ],
      timestamp: '10:01 AM'
    },
    {
      id: '3',
      sender: 'user',
      text: 'What happens if rainfall reaches 40 mm?',
      timestamp: '10:02 AM'
    },
    {
      id: '4',
      sender: 'ai',
      text: 'At 40mm heavy rain, River Rafting is CANCELLED due to river safety limits. A 75% vendor refund (₹2,250) is calculated, reducing net trip cost from ₹11,000 to ₹8,750.',
      references: [
        { title: 'River Rafting Refund', amount: 2250, category: 'Weather Impact' }
      ],
      timestamp: '10:02 AM'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "What happens if rainfall reaches 40 mm?",
    "Will rafting be cancelled?",
    "Who gets a refund if weather gets bad?",
    "Who should I pay?",
    "How much did we spend on food?",
    "How much do I owe?",
    "What was our biggest expense?"
  ];

  const handleSendQuery = async (queryText?: string) => {
    if (loading) return;
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const token = localStorage.getItem('tripledger_token');
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tripId, question: q, digitalTwinScenario })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.response) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.response.answer,
          references: data.response.references,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg = data.error || (res.status === 429
          ? "Nugen AI usage limit reached. Please try again later or verify model quota."
          : res.status === 401 || res.status === 403
          ? "Authentication error. Please log in again to use Nugen AI."
          : "Nugen AI is temporarily unavailable. Please try again later.");

        const aiErrMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiErrMsg]);
      }
    } catch (err: any) {
      console.error('Nugen AI query error:', err);
      const aiErrMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: err?.message || "Network error. Unable to connect to Nugen AI Assistant backend.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiErrMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Main AI Container matching Image 3 */}
      <div className="bg-white rounded-3xl shadow-card border border-amber-100/60 overflow-hidden flex flex-col min-h-[600px]">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3D1B5B] to-[#8E58A6] text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D1344]">TripLedger AI</h2>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Contextual Trip Assistant (Ledger Protected)
              </p>
            </div>
          </div>
        </div>

        {/* Message History Feed */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm ${
                  m.sender === 'user' ? 'bg-[#3D1B5B]' : 'bg-[#8E58A6]'
                }`}
              >
                {m.sender === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-lg p-4 rounded-3xl space-y-2 text-sm ${
                  m.sender === 'user'
                    ? 'bg-[#3D1B5B] text-white rounded-tr-none shadow-md'
                    : 'bg-[#F3EAF8] text-slate-900 rounded-tl-none border border-purple-100/80 shadow-sm'
                }`}
              >
                <p className="leading-relaxed font-medium">{m.text}</p>

                {/* References Badges matching Image 3 */}
                {m.references && m.references.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2 border-t border-purple-200/50">
                    {m.references.map((r, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white/80 rounded-xl text-[11px] font-bold text-[#3D1B5B] shadow-2xs border border-purple-100 flex items-center gap-1"
                      >
                        <span>{r.title}</span>
                        <span className="text-emerald-700">₹{r.amount.toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                )}

                <span className={`text-[10px] block text-right font-medium opacity-60 ${m.sender === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8E58A6] text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#F3EAF8] p-4 rounded-3xl rounded-tl-none text-xs font-semibold text-[#3D1B5B] animate-pulse">
                Analyzing authorized Goa Trip ledger...
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips matching Image 3 */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(prompt)}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[#F3EAF8] text-[#3D1B5B] text-xs font-semibold transition-all border border-slate-200 hover:border-purple-200 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#8E58A6]" />
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Ask anything about this trip..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              className="flex-1 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E58A6]"
            />
            <button
              onClick={() => handleSendQuery()}
              disabled={loading}
              className="p-3.5 rounded-2xl bg-[#3D1B5B] hover:bg-[#2D1344] text-white shadow-md transition-all flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
