import { useState, useRef, useEffect } from 'react';
import { Send, Dices, Sparkles, Monitor, Terminal, ShoppingCart, Briefcase, Loader2 } from 'lucide-react';
import { Message, Template } from '@/types';
import { cn } from '@/lib/utils';

const templates: Template[] = [
  { id: 'saas', title: 'SaaS Landing', icon: 'Monitor', prompt: 'Create a modern SaaS landing page with a hero section, feature grid, pricing cards, and a dark gradient background' },
  { id: 'dashboard', title: 'Dev Dashboard', icon: 'Terminal', prompt: 'Build a developer dashboard with a sidebar navigation, activity charts, and a metrics grid' },
  { id: 'ecommerce', title: 'E-commerce', icon: 'ShoppingCart', prompt: 'Design an e-commerce product page with image gallery, add to cart, and related products' },
  { id: 'portfolio', title: 'Portfolio', icon: 'Briefcase', prompt: 'Create a creative portfolio with a bento grid layout, project cards, and smooth animations' },
];

const iconMap: Record<string, React.ElementType> = {
  Monitor,
  Terminal,
  ShoppingCart,
  Briefcase,
};

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onRandomIdea: () => Promise<string>;
  isGenerating: boolean;
}

export function ChatPanel({ messages, onSendMessage, onRandomIdea, isGenerating }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDiceClick = async () => {
    if (isLoadingIdea) return;
    setIsLoadingIdea(true);
    try {
      const idea = await onRandomIdea();
      setInput(idea);
      textareaRef.current?.focus();
    } finally {
      setIsLoadingIdea(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    setInput(template.prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 border-r border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">Adorable</h1>
        </div>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          AI Prototype Engine
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-foreground">What are we building?</h2>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Describe your dream UI or choose a starter template below.
              </p>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
              {templates.map((template) => {
                const Icon = iconMap[template.icon];
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="template-card text-left"
                  >
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <span className="text-sm font-medium text-foreground">{template.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'animate-fade-in',
                  message.role === 'user' ? 'flex justify-end' : ''
                )}
              >
                {message.role === 'user' ? (
                  <div className="max-w-[85%] bg-primary/20 border border-primary/30 rounded-lg px-4 py-3">
                    <p className="text-sm text-foreground">{message.content}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {message.thought && (
                      <div className="thought-block">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
                          <span className="text-xs font-mono text-accent uppercase tracking-wider">
                            Thought Process
                          </span>
                        </div>
                        <p className="thought-text">{message.thought}</p>
                      </div>
                    )}
                    <div className="bg-surface-2 border border-border rounded-lg px-4 py-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-thin pb-2">
          {['DARK MODE', 'MOBILE FIRST', 'ANIMATED', 'MINIMAL'].map((tag) => (
            <button
              key={tag}
              onClick={() => setInput((prev) => `${prev} ${tag.toLowerCase()}`)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-surface-2 
                         border border-border rounded-full hover:text-foreground hover:border-primary/30 
                         transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              {tag}
            </button>
          ))}
        </div>

        <div className="relative input-glow rounded-lg border border-border bg-surface-2 focus-within:border-primary/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your UI idea..."
            className="w-full bg-transparent px-4 py-3 pr-24 text-sm text-foreground placeholder:text-muted-foreground 
                       resize-none focus:outline-none min-h-[48px] max-h-[120px]"
            rows={1}
            disabled={isGenerating}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              onClick={handleDiceClick}
              disabled={isLoadingIdea || isGenerating}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded-md 
                         transition-colors disabled:opacity-50"
              title="Feeling Lucky"
            >
              {isLoadingIdea ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Dices className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
