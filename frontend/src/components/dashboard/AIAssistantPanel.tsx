import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, ArrowUp, Brain, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import useDashboardStore from '@/features/dashboard/store/dashboardStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantPanelProps {
  className?: string;
}

const quickActions = [
  'Show CPU issues',
  'Why did this incident happen?',
  'Explain RCA',
  'Predict failures',
  'Generate Postmortem',
];

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'How can I help you manage your infrastructure?',
};

export function AIAssistantPanel({ className }: AIAssistantPanelProps) {
  const assistantOpen = useDashboardStore((s) => s.assistantOpen);
  const setAssistantOpen = useDashboardStore((s) => s.setAssistantOpen);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Analyzing "${trimmed}"... I'll process your request and get back to you with insights.`,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  }

  function handleQuickAction(action: string) {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: action };
    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Processing request: "${action}"\n\nRunning diagnostic agents across your infrastructure. This may take a moment.`,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend();
  }

  return (
    <>
      <AnimatePresence>
        {!assistantOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
          >
            <Button
              onClick={() => setAssistantOpen(true)}
              className={cn(
                'h-32 w-10 rounded-l-lg rounded-r-none',
                'bg-gradient-to-b from-cyan-600 to-blue-700',
                'hover:from-cyan-500 hover:to-blue-600',
                'shadow-lg shadow-cyan-900/30',
                'flex flex-col items-center justify-center gap-2',
                'writing-mode-vertical',
              )}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="text-[10px] font-semibold tracking-wider whitespace-nowrap [writing-mode:vertical-rl] [text-orientation:mixed] rotate-180">
                AI ASSISTANT
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assistantOpen && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'w-80 h-full glass-strong border-l border-border/50 fixed right-0 top-14 z-40',
              'flex flex-col shadow-2xl shadow-black/20',
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Bot size={20} className="text-cyan-400" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Sentinel AI</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAssistantOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'ml-auto bg-primary/10 text-foreground'
                        : 'mr-auto glass text-foreground border border-border/30',
                    )}
                  >
                    {msg.content}
                  </motion.div>
                ))}

                {messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-1.5 pt-1"
                  >
                    {quickActions.map((action) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className={cn(
                          'cursor-pointer text-[11px] font-normal',
                          'border-border/40 hover:border-cyan-500/50',
                          'hover:bg-cyan-500/10 transition-colors',
                          'text-muted-foreground hover:text-cyan-400',
                        )}
                        onClick={() => handleQuickAction(action)}
                      >
                        {action}
                      </Badge>
                    ))}
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <Separator className="opacity-50" />

            {/* Input */}
            <div className="p-3 shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ask about your infrastructure..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9 text-sm bg-muted/50 border-border/50"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-9 w-9 shrink-0 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40"
                >
                  <ArrowUp size={16} />
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 shrink-0">
              <span className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60">
                <Brain size={10} />
                Powered by Mastra AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAssistantPanel;
