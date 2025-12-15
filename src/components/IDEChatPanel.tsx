import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Dices, Sparkles, Loader2, Plus, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { templates } from '@/templates/projectTemplates';
import { generateVibe, generateRandomIdea } from '@/services/geminiService';
import { ConversationMessage } from '@/types/projectTypes';

export function IDEChatPanel() {
    const {
        project,
        messages,
        files,
        isGenerating,
        addMessage,
        setGenerating,
        applyFileOperations,
        createProject,
    } = useProjectStore();

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

    const handleSend = useCallback(async () => {
        if (!input.trim() || isGenerating) return;

        const userInput = input.trim();
        setInput('');

        // Add user message
        addMessage({
            role: 'user',
            content: userInput,
        });

        setGenerating(true);

        try {
            // Build conversation history
            const history = messages.map((m: ConversationMessage) => ({
                role: m.role,
                content: m.content,
            }));

            // Get current project files for context
            const projectFiles = Array.from(files.values());

            const result = await generateVibe(userInput, history);

            // Add assistant message
            addMessage({
                role: 'assistant',
                content: result.message || `I've made changes to the project. Check the preview!`,
                thought: result.thought,
                fileOperations: result.files,
            });

            // Apply file operations
            if (result.files && result.files.length > 0) {
                applyFileOperations(result.files);
            }

        } catch (error) {
            console.error('Error generating:', error);
            addMessage({
                role: 'assistant',
                content: 'Sorry, there was an error generating your code. Please try again.',
            });
        } finally {
            setGenerating(false);
        }
    }, [input, isGenerating, messages, files, addMessage, setGenerating, applyFileOperations]);

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
            const idea = await generateRandomIdea();
            setInput(idea);
            textareaRef.current?.focus();
        } catch (error) {
            console.error('Error getting random idea:', error);
        } finally {
            setIsLoadingIdea(false);
        }
    };

    const handleCreateProject = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            createProject(template.name, template.files);
        }
    };

    // No project loaded - show template selection
    if (!project) {
        return (
            <div className="flex flex-col h-full bg-[#0d0d12]">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h1 className="font-semibold text-white">Hatable</h1>
                    </div>
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        AI IDE
                    </span>
                </div>

                {/* Template Selection */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <FolderPlus className="w-8 h-8 text-purple-400" />
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-lg font-medium text-white">Start a New Project</h2>
                        <p className="text-sm text-gray-400 max-w-[280px]">
                            Choose a template to get started or create from scratch.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleCreateProject(template.id)}
                                className="flex items-center gap-3 p-4 bg-[#111118] border border-white/5 rounded-xl 
                           hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left"
                            >
                                <span className="text-2xl">{template.icon}</span>
                                <div>
                                    <div className="font-medium text-white">{template.name}</div>
                                    <div className="text-xs text-gray-500">{template.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0d0d12]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h1 className="font-semibold text-white">Hatable</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {project.name}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <h2 className="text-sm font-medium text-white">Ready to build</h2>
                            <p className="text-xs text-gray-500 max-w-[200px]">
                                Describe what you want to create and I'll generate the code.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message: ConversationMessage) => (
                            <div
                                key={message.id}
                                className={cn(
                                    'animate-fade-in',
                                    message.role === 'user' ? 'flex justify-end' : ''
                                )}
                            >
                                {message.role === 'user' ? (
                                    <div className="max-w-[85%] bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-2">
                                        <p className="text-sm text-white">{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {message.thought && (
                                            <div className="bg-[#111118] border border-white/5 rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                                                        Thinking
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 whitespace-pre-wrap">{message.thought}</p>
                                            </div>
                                        )}
                                        <div className="bg-[#111118] border border-white/5 rounded-lg px-3 py-2">
                                            <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                        {message.fileOperations && message.fileOperations.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {message.fileOperations.map((op, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            'px-2 py-0.5 text-xs rounded',
                                                            op.action === 'create' && 'bg-green-500/20 text-green-400',
                                                            op.action === 'modify' && 'bg-blue-500/20 text-blue-400',
                                                            op.action === 'delete' && 'bg-red-500/20 text-red-400'
                                                        )}
                                                    >
                                                        {op.action}: {op.path.split('/').pop()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="flex items-center gap-2 text-gray-400 animate-fade-in">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Generating code...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/5">
                <div className="relative rounded-lg border border-white/10 bg-[#111118] focus-within:border-purple-500/50 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to build..."
                        className="w-full bg-transparent px-3 py-2.5 pr-20 text-sm text-white placeholder:text-gray-500 
                       resize-none focus:outline-none min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isGenerating}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <button
                            onClick={handleDiceClick}
                            disabled={isLoadingIdea || isGenerating}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors 
                         disabled:opacity-50"
                            title="Random Idea"
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
                            className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500 
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
