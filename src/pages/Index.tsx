import { useState, useCallback } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { PreviewArea } from '@/components/PreviewArea';
import { Message, Page } from '@/types';
import { generateVibe, generateRandomIdea } from '@/services/geminiService';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      // Build history for context - convert to ConversationMessage format
      const history = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      const result = await generateVibe(content, history);

      // Create page from result
      const pageId = `page-${Date.now()}`;
      const newPage = {
        id: pageId,
        title: result.title,
        html: result.html,
      };

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Generated: ${result.title}`,
        thought: result.thought,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Smart merge pages
      setPages((prevPages) => {
        const existingIndex = prevPages.findIndex((p) => p.title === newPage.title);
        if (existingIndex >= 0) {
          const updated = [...prevPages];
          updated[existingIndex] = newPage;
          return updated;
        }
        return [...prevPages, newPage];
      });

      // Set active page
      setActivePageId(pageId);
    } catch (error) {
      console.error('Error generating:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, there was an error generating your design. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [messages]);

  const handleRandomIdea = useCallback(async () => {
    return await generateRandomIdea();
  }, []);

  const handlePageChange = useCallback((pageId: string) => {
    setActivePageId(pageId);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Chat Panel - 35% */}
      <div className="w-[35%] min-w-[320px] max-w-[480px] flex-shrink-0">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          onRandomIdea={handleRandomIdea}
          isGenerating={isGenerating}
        />
      </div>

      {/* Preview Area - 65% */}
      <div className="flex-1">
        <PreviewArea
          pages={pages}
          activePageId={activePageId}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Index;
