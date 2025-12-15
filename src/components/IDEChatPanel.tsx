import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send,
    Dices,
    Sparkles,
    Loader2,
    Plus,
    FolderPlus,
    Paperclip,
    Image as ImageIcon,
    X,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    ArrowUp,
    Bug
} from 'lucide-react';
import { DebugPanel, DebugInfo } from './DebugPanel';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { templates } from '@/templates/projectTemplates';
import { generateVibe, generateRandomIdea } from '@/services/geminiService';
import { ConversationMessage } from '@/types/projectTypes';

interface Attachment {
    id: string;
    type: 'image' | 'file';
    name: string;
    preview?: string;
    file: File;
}

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
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isGenerating) return;

        const userInput = input.trim();
        setInput('');
        setAttachments([]);

        addMessage({
            role: 'user',
            content: userInput,
        });

        setGenerating(true);

        try {
            const history = messages.map((m: ConversationMessage) => ({
                role: m.role,
                content: m.content,
            }));

            const projectFiles = Array.from(files.values());
            const startTime = Date.now();
            const result = await generateVibe(userInput, history, projectFiles);
            const duration = Date.now() - startTime;

            // Capture debug info
            setDebugInfo({
                userPrompt: userInput,
                rawResponse: result.debugInfo?.rawResponse,
                parsedResponse: {
                    thought: result.thought,
                    message: result.message,
                    files: result.files?.map(f => ({ path: f.path, action: f.action })),
                    html: result.html ? 'HTML content present' : undefined,
                },
                timestamp: new Date().toISOString(),
                duration,
            });

            addMessage({
                role: 'assistant',
                content: result.message || `I've made changes to the project. Check the preview!`,
                thought: result.thought,
                fileOperations: result.files,
            });

            if (result.files && result.files.length > 0) {
                applyFileOperations(result.files);
            }
        } catch (error) {
            console.error('Error generating:', error);
            setDebugInfo(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
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

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        const newAttachments: Attachment[] = [];
        Array.from(selectedFiles).forEach(file => {
            const isImage = file.type.startsWith('image/');
            const attachment: Attachment = {
                id: `${Date.now()}-${file.name}`,
                type: isImage ? 'image' : 'file',
                name: file.name,
                file,
            };

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setAttachments(prev => prev.map(a =>
                        a.id === attachment.id
                            ? { ...a, preview: event.target?.result as string }
                            : a
                    ));
                };
                reader.readAsDataURL(file);
            }

            newAttachments.push(attachment);
        });

        setAttachments(prev => [...prev, ...newAttachments]);
        e.target.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const toggleThought = (messageId: string) => {
        setExpandedThoughts(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
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
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <h1 className="font-semibold text-white">Adorable</h1>
                    </div>
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        AI IDE
                    </span>
                </div>

                {/* Template Selection */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                        <FolderPlus className="w-8 h-8 text-yellow-400" />
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
                           hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all text-left"
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <h1 className="font-semibold text-white">Adorable</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {project.name}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-red-500/10 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-base font-medium text-white">Ready to build</h2>
                            <p className="text-sm text-gray-500 max-w-[220px] leading-relaxed">
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
                                    <div className="max-w-[85%] bg-gradient-to-r from-yellow-600/90 to-red-600/90 rounded-2xl rounded-br-md px-4 py-2.5 shadow-lg">
                                        <p className="text-sm text-white leading-relaxed">{message.content}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Thought Block - Collapsible */}
                                        {message.thought && (
                                            <div className="bg-[#13131a] border border-white/5 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleThought(message.id)}
                                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                                        <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                                                            Thinking
                                                        </span>
                                                    </div>
                                                    {expandedThoughts.has(message.id) ? (
                                                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                    )}
                                                </button>
                                                {expandedThoughts.has(message.id) && (
                                                    <div className="px-3 pb-3">
                                                        <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
                                                            {message.thought}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Main Message */}
                                        <div className="bg-[#16161e] border border-white/5 rounded-2xl rounded-tl-md px-4 py-3">
                                            <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                                                {message.content}
                                            </p>
                                        </div>

                                        {/* File Operations */}
                                        {message.fileOperations && message.fileOperations.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {message.fileOperations.map((op, i) => (
                                                    <span
                                                        key={i}
                                                        className={cn(
                                                            'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium',
                                                            op.action === 'create' && 'bg-green-500/15 text-green-400 border border-green-500/20',
                                                            op.action === 'modify' && 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
                                                            op.action === 'delete' && 'bg-red-500/15 text-red-400 border border-red-500/20'
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

                        {/* Generating Indicator */}
                        {isGenerating && (
                            <div className="flex items-center gap-3 animate-fade-in">
                                <div className="flex items-center gap-2 px-3 py-2 bg-[#16161e] rounded-xl border border-white/5">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-sm text-gray-400">Generating...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area - Modern Design */}
            <div className="p-3 border-t border-white/5">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.txt,.json,.md"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Attachment Previews */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachments.map((att) => (
                            <div
                                key={att.id}
                                className="relative group"
                            >
                                {att.type === 'image' && att.preview ? (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                        <img
                                            src={att.preview}
                                            alt={att.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeAttachment(att.id)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24] rounded-lg border border-white/10">
                                        <Paperclip className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-300 max-w-[100px] truncate">{att.name}</span>
                                        <button
                                            onClick={() => removeAttachment(att.id)}
                                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                        >
                                            <X className="w-3 h-3 text-gray-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Input Container */}
                <div className="relative rounded-2xl bg-[#16161e] border border-white/10 focus-within:border-yellow-500/40 focus-within:shadow-[0_0_20px_rgba(234,179,8,0.1)] transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Killable..."
                        className="w-full bg-transparent px-4 py-3 pr-24 text-sm text-white placeholder:text-gray-500 
                       resize-none focus:outline-none min-h-[48px] max-h-[200px] leading-relaxed scrollbar-hide"
                        rows={1}
                        disabled={isGenerating}
                    />

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-between px-2 pb-2">
                        {/* Left side actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleAttachmentClick}
                                disabled={isGenerating}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                title="Add attachment"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleDiceClick}
                                disabled={isLoadingIdea || isGenerating}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                title="Random idea"
                            >
                                {isLoadingIdea ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Dices className="w-4 h-4" />
                                )}
                            </button>
                            {/* Debug toggle */}
                            <button
                                onClick={() => setShowDebug(!showDebug)}
                                className={cn(
                                    'p-2 rounded-lg transition-colors',
                                    showDebug
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                )}
                                title="Toggle Debug Panel"
                            >
                                <Bug className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2">
                            {/* Chat mode indicator */}
                            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-yellow-600/20 rounded-full">
                                <MessageSquare className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs font-medium text-yellow-400">Chat</span>
                            </div>

                            {/* Send button */}
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isGenerating}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    input.trim() && !isGenerating
                                        ? "bg-gradient-to-r from-yellow-500 to-red-500 text-white hover:from-yellow-400 hover:to-red-400 shadow-lg shadow-yellow-500/25"
                                        : "bg-white/5 text-gray-500 cursor-not-allowed"
                                )}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Debug Panel */}
                {showDebug && (
                    <DebugPanel
                        debugInfo={debugInfo}
                        isVisible={showDebug}
                        onToggle={() => setShowDebug(false)}
                    />
                )}
            </div>
        </div>
    );
}
