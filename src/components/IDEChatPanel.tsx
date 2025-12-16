import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Dices,
    Sparkles,
    Loader2,
    Plus,
    FolderPlus,
    Paperclip,
    X,
    ChevronDown,
    ChevronUp,
    ArrowUp,
    AlertTriangle,
    Wrench,
    BookOpen
} from 'lucide-react';
import { useActivityStore } from '@/stores/useActivityStore';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { useConsoleStore } from '@/stores/useConsoleStore';
import { templates } from '@/templates/projectTemplates';
import { generateVibe, generateVibeStream, generateRandomIdea } from '@/services/geminiService';
import { ConversationMessage } from '@/types/projectTypes';
import { ConfirmChangesPanel } from './ConfirmChangesPanel';

interface Attachment {
    id: string;
    type: 'image' | 'file';
    name: string;
    preview?: string;
    file: File;
}

const MAX_AUTO_RETRIES = 2;
const RETRY_COOLDOWN_MS = 30000; // 30 second cooldown after max retries

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
        sandpackError,
        clearSandpackError,
        pendingChanges,
        setPendingChanges,
        confirmPendingChanges,
        rejectPendingChanges,
    } = useProjectStore();

    const { logSystem, logError, logFileWrite } = useConsoleStore();

    const {
        startSession,
        endSession,
        startThinking,
        stopThinking,
        addReading,
        addEditing,
        addExplaining,
        addError,
        isActive,
    } = useActivityStore();

    const [input, setInput] = useState('');
    const [isLoadingIdea, setIsLoadingIdea] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());
    const [showKnowledge, setShowKnowledge] = useState(false);
    const [knowledgeInput, setKnowledgeInput] = useState('');
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const [lastErrorHash, setLastErrorHash] = useState<string | null>(null);
    const [retryCooldownUntil, setRetryCooldownUntil] = useState<number>(0);
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

    

    const handleSend = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault(); // Prevent default form submission if called from form

        if (!input.trim() || isGenerating) return;

        const userInput = input.trim();
        setInput('');
        setAttachments([]);

        logSystem(`User prompt: "${userInput.slice(0, 50)}${userInput.length > 50 ? '...' : ''}"`);

        addMessage({
            role: 'user',
            content: userInput,
        });

        setGenerating(true);

        // Start activity session
        startSession();

        // Show reading activities for files being sent
        const projectFiles = Array.from(files.values());
        logSystem(`Sending ${projectFiles.length} project files to AI`);
        projectFiles.forEach(file => {
            addReading(file.path.split('/').pop() || file.path);
        });

        // Prepare history
        const history = messages.map((m: ConversationMessage) => ({
            role: m.role,
            content: m.content,
        }));

        let thinkingId: string | null = null;
        let thought = '';
        let message = '';
        let resultFiles: any[] = [];

        try {
            // Read attachment contents
            let attachmentContext = '';
            for (const att of attachments) {
                if (att.type === 'file') {
                    try {
                        const text = await att.file.text();
                        attachmentContext += `\n--- FILE: ${att.name} ---\n${text}\n`;
                    } catch (e) {
                        console.error('Error reading file:', att.name, e);
                    }
                }
            }

            // Combine with manual knowledge input
            const fullContext = (knowledgeInput ? `MANUAL KNOWLEDGE:\n${knowledgeInput}\n` : '') + attachmentContext;

            // Use streaming generator
            for await (const event of generateVibeStream(userInput, history, projectFiles, fullContext)) {
                switch (event.type) {
                    case 'thinking':
                        thinkingId = startThinking();
                        break;

                    case 'token':
                        // Token received - update activity with progress
                        if (event.total && event.total % 500 === 0) {
                            // Update thinking activity periodically to show progress
                            console.log(`Streaming: ${event.total} chars received`);
                        }
                        break;

                    case 'done':
                        // Stream complete - process final result
                        if (thinkingId) {
                            stopThinking(thinkingId);
                        }

                        thought = event.thought || '';
                        message = event.message || 'Generated successfully';
                        resultFiles = event.files || [];

                        // Add AI's explanation
                        if (thought) {
                            addExplaining(thought.slice(0, 100) + (thought.length > 100 ? '...' : ''));
                        }

                        // Add file operations to activity stream
                        if (resultFiles.length > 0) {
                            resultFiles.forEach(file => {
                                const fileName = file.path.split('/').pop() || file.path;
                                addEditing(fileName, file.action);
                            });
                        }

                        addMessage({
                            role: 'assistant',
                            content: message,
                            thought: thought,
                            fileOperations: resultFiles,
                        });

                        // Use confirmation flow instead of direct apply
                        if (resultFiles.length > 0) {
                            logSystem(`AI proposes ${resultFiles.length} file changes - awaiting confirmation`);
                            setPendingChanges({
                                thought: thought,
                                message: message,
                                operations: resultFiles,
                            });
                        }
                        break;

                    case 'error':
                        if (thinkingId) {
                            stopThinking(thinkingId);
                        }
                        addError(event.error || 'Unknown error');
                        throw new Error(event.error || 'Streaming error');
                }
            }
        } catch (error) {
            console.error('Error generating:', error);
            logError('Generation failed', error instanceof Error ? error : undefined);
            if (thinkingId) {
                stopThinking(thinkingId);
            }
            addError(error instanceof Error ? error.message : 'Unknown error');
            addMessage({
                role: 'assistant',
                content: 'Sorry, there was an error generating your code. Please try again.',
            });
        } finally {
            setGenerating(false);
            endSession();
        }
    }, [input, isGenerating, messages, files, addMessage, setGenerating, setPendingChanges, startSession, endSession, startThinking, stopThinking, addReading, addEditing, addExplaining, addError, attachments, knowledgeInput, logSystem, logError]);

    // Handle Fix error button click
    const handleFixError = useCallback(async () => {
        if (!sandpackError || isGenerating) return;

        // Build a fix prompt with error context
        const fixPrompt = `Fix this error:\n\n${sandpackError}\n\nPlease analyze the error and fix the code.`;

        addMessage({
            role: 'user',
            content: fixPrompt,
        });

        clearSandpackError();
        setGenerating(true);

        try {
            const history = messages.map((m: ConversationMessage) => ({
                role: m.role,
                content: m.content,
            }));

            const projectFiles = Array.from(files.values());
            const result = await generateVibe(fixPrompt, history, projectFiles);

            addMessage({
                role: 'assistant',
                content: result.message || `I've fixed the error. Check the preview!`,
                thought: result.thought,
                fileOperations: result.files,
            });

            if (result.files && result.files.length > 0) {
                applyFileOperations(result.files);
            }
        } catch (error) {
            console.error('Error fixing:', error);
            addMessage({
                role: 'assistant',
                content: 'Sorry, there was an error trying to fix the code. Please try again.',
            });
        } finally {
            setGenerating(false);
        }
    }, [sandpackError, isGenerating, messages, files, addMessage, setGenerating, applyFileOperations, clearSandpackError]);

    // Auto error recovery loop - with improved loop prevention
    useEffect(() => {
        // Don't retry if currently generating or in cooldown
        const now = Date.now();
        if (!sandpackError || isGenerating || now < retryCooldownUntil) {
            return;
        }

        // Create a hash of the error to detect if it's the same error repeating
        const errorHash = sandpackError.slice(0, 100);

        // If it's a different error, reset the counter
        if (errorHash !== lastErrorHash) {
            setLastErrorHash(errorHash);
            setAutoRetryCount(0);
        }

        // Check if we can retry
        if (autoRetryCount < MAX_AUTO_RETRIES) {
            const timer = setTimeout(() => {
                setAutoRetryCount(prev => prev + 1);
                handleFixError();
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            // Max retries reached, enter cooldown
            setRetryCooldownUntil(Date.now() + RETRY_COOLDOWN_MS);
        }
        // Reset when error is cleared
        if (!sandpackError) {
            setAutoRetryCount(0);
            setLastErrorHash(null);
        }
    }, [sandpackError, isGenerating, autoRetryCount, lastErrorHash, retryCooldownUntil, handleFixError]);

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
                {messages.length === 0 && !isActive ? (
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
                                    "mb-3",
                                    message.role === 'user' ? "flex justify-end" : "flex justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                                    message.role === 'user'
                                        ? "bg-blue-600/20 text-blue-100 border border-blue-500/20"
                                        : "bg-white/5 text-gray-200 border border-white/5"
                                )}>
                                    <div className="whitespace-pre-wrap">{message.content}</div>

                                    {/* Thought Block - Compact */}
                                    {message.thought && (
                                        <button
                                            onClick={() => toggleThought(message.id)}
                                            className="mt-2 w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {expandedThoughts.has(message.id) ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                            <span>Reasoning</span>
                                        </button>
                                    )}
                                    {message.thought && expandedThoughts.has(message.id) && (
                                        <p className="mt-2 text-xs text-gray-500 bg-black/20 p-2 rounded-lg whitespace-pre-wrap">
                                            {message.thought}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Inline Activity - Minimal */}
                        {isActive && (
                            <div className="mb-3 animate-fade-in">
                                <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Working...</span>
                                </div>
                            </div>
                        )}

                        {/* Generating Indicator - Simple Fallback */}
                        {isGenerating && !isActive && (
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

                        {/* Error Fix Button with Auto-Retry */}
                        {sandpackError && !isGenerating && (
                            <div className="animate-fade-in space-y-2">
                                <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-red-400 mb-1">Error in preview</p>
                                        <p className="text-xs text-red-300/80 font-mono break-all">
                                            {sandpackError.slice(0, 200)}{sandpackError.length > 200 ? '...' : ''}
                                        </p>
                                    </div>
                                </div>
                                {autoRetryCount < MAX_AUTO_RETRIES ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                                        <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                                        <span className="text-sm text-orange-300">
                                            Auto-fixing... (attempt {autoRetryCount + 1}/{MAX_AUTO_RETRIES})
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setAutoRetryCount(0);
                                            handleFixError();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-xl transition-all shadow-lg text-sm font-medium"
                                    >
                                        <Wrench className="w-4 h-4" />
                                        Try to Fix Again
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pending Changes Confirmation */}
                        {pendingChanges && (
                            <ConfirmChangesPanel
                                thought={pendingChanges.thought}
                                message={pendingChanges.message}
                                operations={pendingChanges.operations}
                                onConfirm={() => {
                                    logSystem('User confirmed changes - applying file operations');
                                    pendingChanges.operations.forEach(op => {
                                        logFileWrite(op.path.split('/').pop() || op.path, op.action);
                                    });
                                    confirmPendingChanges();
                                }}
                                onReject={() => {
                                    logSystem('User rejected changes');
                                    rejectPendingChanges();
                                }}
                            />
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

                    {/* Knowledge Input Area */}
                    {showKnowledge && (
                        <div className="px-4 pb-3 animate-slide-in">
                            <div className="bg-[#1a1a24] rounded-xl border border-yellow-500/20 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-xs font-medium">Training Data / Context</span>
                                    </div>
                                    <button
                                        onClick={() => setKnowledgeInput('')}
                                        className="text-xs text-gray-500 hover:text-white"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <textarea
                                    value={knowledgeInput}
                                    onChange={(e) => setKnowledgeInput(e.target.value)}
                                    placeholder="Paste documentation, requirements, or context here..."
                                    className="w-full bg-[#13131a] text-xs text-gray-300 p-3 rounded-lg border border-white/5 focus:border-yellow-500/30 focus:outline-none min-h-[80px] scrollbar-hide resize-y"
                                />
                            </div>
                        </div>
                    )}

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
                            {/* Knowledge toggle */}
                            <button
                                onClick={() => setShowKnowledge(!showKnowledge)}
                                className={cn(
                                    'p-2 rounded-lg transition-colors',
                                    showKnowledge || knowledgeInput
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                )}
                                title="Add Knowledge/Context"
                            >
                                <BookOpen className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2">
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


            </div>
        </div>
    );
}
