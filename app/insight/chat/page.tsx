'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  MoreVertical,
  Pencil,
  Pin,
  Trash2,
  Paperclip,
  Send,
  Plus,
  Home,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InsightActionButtons from '@/components/insight-action-buttons';
import InsightProblemsDialog from '@/components/insight-problems-dialog';
import { BlockMath, InlineMath } from 'react-katex';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type Session = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

// Parse inline Markdown (bold, italic) - without affecting LaTeX
const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Try to find **bold** first (must come before * for italic)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Try to find *italic*
    const italicMatch = remaining.match(/\*([^*\n]+?)\*/);

    let nextFormat = null;
    let type: 'bold' | 'italic' = 'bold';

    // Determine which comes first
    if (boldMatch && italicMatch) {
      if (boldMatch.index! < italicMatch.index!) {
        nextFormat = boldMatch;
        type = 'bold';
      } else {
        nextFormat = italicMatch;
        type = 'italic';
      }
    } else if (boldMatch) {
      nextFormat = boldMatch;
      type = 'bold';
    } else if (italicMatch) {
      nextFormat = italicMatch;
      type = 'italic';
    }

    if (!nextFormat) {
      // No more formatting, add remaining text
      if (remaining) {
        parts.push(<span key={`${keyPrefix}-text-${keyCounter++}`}>{remaining}</span>);
      }
      break;
    }

    // Add text before formatting
    if (nextFormat.index! > 0) {
      const textBefore = remaining.slice(0, nextFormat.index);
      parts.push(<span key={`${keyPrefix}-text-${keyCounter++}`}>{textBefore}</span>);
    }

    // Add formatted text
    const formattedText = nextFormat[1];
    if (type === 'bold') {
      parts.push(
        <strong key={`${keyPrefix}-bold-${keyCounter++}`} className="font-semibold">
          {formattedText}
        </strong>
      );
    } else {
      parts.push(
        <em key={`${keyPrefix}-italic-${keyCounter++}`} className="italic">
          {formattedText}
        </em>
      );
    }

    // Move past this match
    remaining = remaining.slice(nextFormat.index! + nextFormat[0].length);
  }

  return parts;
};

// Process a segment of text for inline LaTeX and Markdown
const processTextSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Try to find $ (inline math)
    const inlineMatch = remaining.match(/\$([^\$\n]+?)\$/);

    if (!inlineMatch) {
      // No more inline math, process for Markdown
      if (remaining) {
        parts.push(...parseInlineMarkdown(remaining, `${keyPrefix}-${keyCounter++}`));
      }
      break;
    }

    // Add text before math (process for Markdown)
    if (inlineMatch.index! > 0) {
      const textBefore = remaining.slice(0, inlineMatch.index);
      parts.push(...parseInlineMarkdown(textBefore, `${keyPrefix}-${keyCounter++}`));
    }

    // Add inline math
    const latex = inlineMatch[1].trim();
    try {
      if (latex) {
        parts.push(
          <span key={`${keyPrefix}-inline-${keyCounter++}`}>
            <InlineMath math={latex} />
          </span>
        );
      }
    } catch (e) {
      // If LaTeX fails to render, show original
      parts.push(<span key={`${keyPrefix}-error-${keyCounter++}`}>{inlineMatch[0]}</span>);
    }

    // Move past this match
    remaining = remaining.slice(inlineMatch.index! + inlineMatch[0].length);
  }

  return parts;
};

// Parse LaTeX expressions and Markdown - Static function outside component
const parseLatexContent = (content: string): React.ReactNode => {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  let keyCounter = 0;

  // First, extract all block math ($$...$$) which can span multiple lines
  const blockMathPattern = /\$\$([\s\S]*?)\$\$/g;
  const segments: Array<{ type: 'text' | 'blockMath'; content: string; index: number }> = [];
  let lastIndex = 0;
  let match;

  while ((match = blockMathPattern.exec(content)) !== null) {
    // Add text before this block math
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        index: lastIndex,
      });
    }
    // Add block math
    segments.push({
      type: 'blockMath',
      content: match[1].trim(),
      index: match.index,
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
      index: lastIndex,
    });
  }

  // Process each segment
  segments.forEach((segment, segmentIndex) => {
    if (segment.type === 'blockMath') {
      // Render block math
      try {
        elements.push(
          <div key={`block-${keyCounter++}`} className="my-3">
            <BlockMath math={segment.content} />
          </div>
        );
      } catch (e) {
        // If LaTeX fails to render, show original
        elements.push(
          <span key={`block-error-${keyCounter++}`}>{`$$${segment.content}$$`}</span>
        );
      }
    } else {
      // Process text segment line by line for headings, inline math, and markdown
      const lines = segment.content.split('\n');

      lines.forEach((line, lineIndex) => {
        // Check for headings (### must come before ##, which must come before #)
        const h3Match = line.match(/^###\s+(.+)$/);
        const h2Match = line.match(/^##\s+(.+)$/);
        const h1Match = line.match(/^#\s+(.+)$/);

        if (h3Match) {
          elements.push(
            <h3 key={`h3-${keyCounter++}`} className="text-lg font-bold text-gray-100 mt-4 mb-2">
              {processTextSegment(h3Match[1], `h3-${keyCounter}`)}
            </h3>
          );
        } else if (h2Match) {
          elements.push(
            <h2 key={`h2-${keyCounter++}`} className="text-xl font-bold text-gray-100 mt-4 mb-2">
              {processTextSegment(h2Match[1], `h2-${keyCounter}`)}
            </h2>
          );
        } else if (h1Match) {
          elements.push(
            <h1 key={`h1-${keyCounter++}`} className="text-2xl font-bold text-gray-100 mt-4 mb-2">
              {processTextSegment(h1Match[1], `h1-${keyCounter}`)}
            </h1>
          );
        } else {
          // Regular line - process for inline math and markdown
          const lineParts = processTextSegment(line, `line-${segmentIndex}-${lineIndex}`);
          
          if (lineParts.length > 0) {
            elements.push(
              <span key={`line-${keyCounter++}`}>
                {lineParts}
                {lineIndex < lines.length - 1 && '\n'}
              </span>
            );
          } else if (lineIndex < lines.length - 1) {
            // Empty line
            elements.push(<br key={`br-${keyCounter++}`} />);
          }
        }
      });
    }
  });

  return elements.length > 0 ? <>{elements}</> : <span>{content}</span>;
};

// Memoized message content component
const MessageContent = React.memo(({ content }: { content: string }) => {
  return (
    <div className="whitespace-pre-wrap break-words text-gray-200 leading-relaxed">
      {parseLatexContent(content)}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

const PREFILL_STORAGE_PREFIX = 'insight-prefill-';

const consumeHeroPrefillPrompt = (token: string): string | null => {
  if (typeof window === 'undefined') return null;
  const storageKey = `${PREFILL_STORAGE_PREFIX}${token}`;
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored) {
      window.sessionStorage.removeItem(storageKey);
      const trimmed = stored.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  } catch {
    // Ignore storage access issues
  }
  return null;
};

function InsightChatPageContent() {
  const { user, loading: authLoading, logout, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [plusPlanPopupOpen, setPlusPlanPopupOpen] = useState(false);
  const [plusPlanPopupType, setPlusPlanPopupType] = useState<'think' | 'teach' | null>(null);
  const [problemsDialogOpen, setProblemsDialogOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendRef = useRef<((messageOverride?: string) => Promise<void>) | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(24); // Initial height in pixels
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingPrefill, setPendingPrefill] = useState<string | null>(null);
  useEffect(() => {
    const prefillParam = searchParams.get('prefill');
    const prefillTokenParam = searchParams.get('prefillToken');

    if (!prefillParam && !prefillTokenParam) return;

    let resolvedPrompt: string | null = null;

    if (prefillTokenParam) {
      resolvedPrompt = consumeHeroPrefillPrompt(prefillTokenParam);
    }

    if ((!resolvedPrompt || resolvedPrompt.trim().length === 0) && prefillParam) {
      resolvedPrompt = prefillParam;
    }

    if (resolvedPrompt?.trim()) {
      setPendingPrefill(resolvedPrompt.trim());
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('prefill');
    params.delete('prefillToken');
    const query = params.toString();
    const nextUrl = query ? `/insight/chat?${query}` : '/insight/chat';
    router.replace(nextUrl, { scroll: false });
  }, [searchParams, router]);


  // Track viewport width for mobile behaviour
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  // Load sidebar collapse state from localStorage (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return;

    const saved = localStorage.getItem('insight-sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, [isMobile]);

  // Save sidebar collapse state to localStorage (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return;
    localStorage.setItem('insight-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed, isMobile]);

  // Reset sidebar state when switching to mobile/desktop layouts
  useEffect(() => {
    setMobileSidebarOpen(false);
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (!isMobile || !mobileSidebarOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, mobileSidebarOpen]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/insight/unauthorized');
    }
  }, [user, authLoading, router]);

  // Load sessions
  const loadSessions = async (accessToken: string) => {
    try {
      const res = await fetch('/api/insight/sessions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        return data.sessions || [];
      }
      return [];
    } catch (e: any) {
      console.error('Failed to load sessions:', e);
      return [];
    }
  };

  // Load session messages
  const loadSessionMessages = async (sessionIdToLoad: string, accessToken: string) => {
    try {
      const res = await fetch(`/api/insight/messages?sessionId=${sessionIdToLoad}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Nu am putut încărca mesajele.');
      }

      const data = await res.json();
      const loadedMessages = (data.messages || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      setMessages([
        {
          role: 'system',
          content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
        },
        ...loadedMessages,
      ]);
    } catch (e: any) {
      console.error('Failed to load session messages:', e);
    }
  };

  // Save sessionId to sessionStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('insight-current-session', sessionId);
    }
  }, [sessionId]);

  // Initialize: load sessions and restore or create session
  useEffect(() => {
    if (!user || authLoading) return;

    const initializeSession = async () => {
      try {
        // Check if user is refreshing (was already on chat page) BEFORE setting the flag
        const wasOnChatPage = sessionStorage.getItem('insight-chat-active') === 'true';
        
        // Mark that user is now on chat page (for future refresh detection)
        sessionStorage.setItem('insight-chat-active', 'true');
        
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          router.replace('/insight/unauthorized');
          return;
        }

        const loadedSessions = await loadSessions(accessToken);

        // Check if there's a session ID in query params (from landing page redirect)
        const sessionIdFromQuery = searchParams.get('session');
        
        if (sessionIdFromQuery) {
          // Verify session exists in loaded sessions
          const foundSession = loadedSessions.find(s => s.id === sessionIdFromQuery);
          if (foundSession) {
            setSessionId(sessionIdFromQuery);
            await loadSessionMessages(sessionIdFromQuery, accessToken);
            // Remove query param from URL
            router.replace('/insight/chat', { scroll: false });
          } else {
            // Session not found yet, wait a bit and try loading again
            setTimeout(async () => {
              const refreshedSessions = await loadSessions(accessToken);
              const foundSession = refreshedSessions.find(s => s.id === sessionIdFromQuery);
              if (foundSession) {
                setSessionId(sessionIdFromQuery);
                await loadSessionMessages(sessionIdFromQuery, accessToken);
                router.replace('/insight/chat', { scroll: false });
              } else if (loadedSessions.length > 0) {
                // Fallback to last session if query session not found
                const lastSession = loadedSessions[0];
                setSessionId(lastSession.id);
                await loadSessionMessages(lastSession.id, accessToken);
                router.replace('/insight/chat', { scroll: false });
              }
            }, 500);
          }
        } else {
          // Check if there's a saved session in sessionStorage
          const savedSessionId = sessionStorage.getItem('insight-current-session');
          
          if (wasOnChatPage && savedSessionId && loadedSessions.length > 0) {
            // User is refreshing the page, restore current session
            const savedSession = loadedSessions.find(s => s.id === savedSessionId);
            if (savedSession) {
              // Session exists, restore it (refresh)
              setSessionId(savedSessionId);
              await loadSessionMessages(savedSessionId, accessToken);
            } else {
              // Saved session doesn't exist anymore, open new chat
              setSessionId(null);
              setMessages([
                {
                  role: 'system',
                  content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
                },
              ]);
              sessionStorage.removeItem('insight-current-session');
            }
          } else {
            // User is coming from another page, open new chat automatically
            setSessionId(null);
            setMessages([
              {
                role: 'system',
                content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
              },
            ]);
            sessionStorage.removeItem('insight-current-session');
          }
        }
      } catch (e: any) {
        console.error('Failed to initialize session:', e);
      } finally {
        setLoadingSession(false);
      }
    };

    initializeSession();
    
    // Cleanup: remove flag when user navigates away
    return () => {
      sessionStorage.removeItem('insight-chat-active');
    };
  }, [user, authLoading, router, searchParams]);

  // Check if chat has messages (excluding system message)
  const hasMessages = messages.filter((m) => m.role !== 'system').length > 0;

  // Welcome texts for new chats
  const welcomeTexts = [
    "Let's make learning simpler today.",
    "Ready when you are.",
    "What's your next idea?",
    "How can I help today?",
    "Got a question on your mind?",
    "Throw me your toughest question.",
    "Let's spark some curiosity.",
  ];

  // Select a random welcome text (consistent for the session)
  const welcomeText = useMemo(() => {
    return welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
  }, []); // Empty deps - only select once per component mount

  // Format text with last word italic
  const formatWelcomeText = (text: string) => {
    const words = text.split(' ');
    if (words.length === 0) return text;
    
    const lastWord = words[words.length - 1];
    const restWords = words.slice(0, -1).join(' ');
    
    return (
      <>
        {restWords && `${restWords} `}
        <span className="italic">{lastWord}</span>
      </>
    );
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  // Function to adjust textarea height
  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const baseLineHeight = 20; // Base line height in pixels (matching style)
    const paddingVertical = 16; // Top + bottom padding when there's content (8px * 2)
    const lineHeightWithPadding = baseLineHeight + paddingVertical; // Total height per line
    const maxHeight = (baseLineHeight * 12) + paddingVertical; // 12 rows maximum
    const minHeight = 28; // Fixed minimum height for one line (when empty: 20px line-height + 8px padding)
    
    // If textarea is empty, set fixed height and return early
    if (!textarea.value.trim()) {
      setTextareaHeight(minHeight);
      textarea.style.height = `${minHeight}px`;
      textarea.style.minHeight = `${minHeight}px`;
      textarea.style.maxHeight = `${minHeight}px`;
      textarea.style.overflowY = 'hidden';
      textarea.style.overflowX = 'hidden';
      textarea.style.paddingTop = '4px';
      textarea.style.paddingBottom = '4px';
      return;
    }
    
    // Save current styles
    const originalMinHeight = textarea.style.minHeight;
    const originalHeight = textarea.style.height;
    const originalMaxHeight = textarea.style.maxHeight;
    
    // Force recalculation by temporarily resetting height constraints
    textarea.style.minHeight = '0';
    textarea.style.maxHeight = 'none';
    textarea.style.height = 'auto';
    
    // Get scroll height
    const scrollHeight = textarea.scrollHeight;
    
    // Restore original constraints temporarily
    textarea.style.minHeight = originalMinHeight;
    textarea.style.maxHeight = originalMaxHeight;
    textarea.style.height = originalHeight;
    
    // If content fits within 12 rows, grow textarea
    if (scrollHeight <= maxHeight) {
      const newHeight = Math.max(minHeight, scrollHeight);
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.maxHeight = `${maxHeight}px`;
      textarea.style.overflowY = 'hidden';
      textarea.style.overflowX = 'hidden';
      textarea.style.paddingTop = '8px';
      textarea.style.paddingBottom = '8px';
    } else {
      // Show scrollbar after 12 rows
      setTextareaHeight(maxHeight);
      textarea.style.height = `${maxHeight}px`;
      textarea.style.maxHeight = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
      textarea.style.overflowX = 'hidden';
      textarea.style.paddingTop = '8px';
      textarea.style.paddingBottom = '8px';
    }
  }, []);

  // Adjust textarea height based on content
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Initialize textarea height on mount and when chat state changes
  useEffect(() => {
    // Use a small delay to ensure textarea is fully rendered
    const timer = setTimeout(() => {
      adjustTextareaHeight();
    }, 0);

    return () => clearTimeout(timer);
  }, [hasMessages, loadingSession, adjustTextareaHeight]); // Re-run when hasMessages or loadingSession changes

  // Handle new chat
  const handleNewChat = () => {
    // Don't create session immediately - it will be created when user sends first message
    setSessionId(null);
    setMessages([
      {
        role: 'system',
        content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
      },
    ]);
    setInput('');
    // Clear sessionStorage for new chat
    sessionStorage.removeItem('insight-current-session');
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  // Handle session click
  const handleSessionClick = async (clickedSessionId: string) => {
    if (clickedSessionId === sessionId) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;

      setSessionId(clickedSessionId);
      await loadSessionMessages(clickedSessionId, accessToken);
      // Save to sessionStorage so refresh will restore this session
      sessionStorage.setItem('insight-current-session', clickedSessionId);
      if (isMobile) {
        setMobileSidebarOpen(false);
      }
    } catch (e: any) {
      console.error('Failed to load session:', e);
    }
  };

  // Handle rename session
  const handleRenameSession = async (sessionIdToRename: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;

      const res = await fetch('/api/insight/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId: sessionIdToRename,
          title: newTitle.trim(),
        }),
      });

      if (res.ok) {
        await loadSessions(accessToken);
        setRenameSessionId(null);
        setRenameValue('');
        toast({ title: 'Sesiune redenumită cu succes!' });
      } else {
        throw new Error('Nu am putut redenumi sesiunea.');
      }
    } catch (e: any) {
      toast({
        title: 'Eroare',
        description: e.message || 'Nu am putut redenumi sesiunea.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (sessionIdToDelete: string) => {
    setSessionToDelete(sessionIdToDelete);
    setDeleteConfirmOpen(true);
    setSessionMenuOpen(null);
  };

  // Handle delete session (called after confirmation)
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;

      const res = await fetch(`/api/insight/sessions?sessionId=${sessionToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        await loadSessions(accessToken);
        if (sessionToDelete === sessionId) {
          // If deleting current chat, redirect to new chat
          setSessionId(null);
          setMessages([
            {
              role: 'system',
              content: 'Ești Insight, un asistent inteligent pentru fizică pe planck.academy. Ajută utilizatorii să înțeleagă concepte de fizică și să rezolve probleme.\n\nIMPORTANT:\n- Pentru formule matematice, folosește DOAR marcatori LaTeX de tipul $ pentru formule inline (de exemplu: $E=mc^2$) și $$ pentru formule pe bloc (de exemplu: $$\\int_0^1 x dx$$). NU folosi marcatori standard LaTeX precum \\(, \\), \\[, \\].\n- Răspunde DOAR la întrebări care țin de fizică, informatică sau matematică. Dacă utilizatorul întreabă despre altceva (istorie, literatură, sport, etc.), refuză politicos explicând că ești specializat doar în domeniile științifice menționate.',
            },
          ]);
          setInput('');
          // Clear sessionStorage since current session was deleted
          sessionStorage.removeItem('insight-current-session');
        }
        // If deleting a different chat, user stays on current chat (no action needed)
        toast({ title: 'Sesiune ștearsă cu succes!' });
        setDeleteConfirmOpen(false);
        setSessionToDelete(null);
      } else {
        throw new Error('Nu am putut șterge sesiunea.');
      }
    } catch (e: any) {
      toast({
        title: 'Eroare',
        description: e.message || 'Nu am putut șterge sesiunea.',
        variant: 'destructive',
      });
      setDeleteConfirmOpen(false);
      setSessionToDelete(null);
    }
  };

  // Handle pin session (placeholder for future functionality)
  const handlePinSession = async (sessionIdToPin: string) => {
    // TODO: Implement pin functionality when DB field is added
    toast({ title: 'Funcționalitatea Pin va fi disponibilă în curând!' });
  };

  // Handle action buttons
  const handleThinkDeeper = () => {
    setPlusPlanPopupType('think');
    setPlusPlanPopupOpen(true);
  };

  const handleTeachMe = () => {
    setPlusPlanPopupType('teach');
    setPlusPlanPopupOpen(true);
  };

  const handleSolveProblem = () => {
    setProblemsDialogOpen(true);
  };

  const handleSelectProblem = (problemText: string) => {
    setInput(problemText);
    // Focus on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      // Scroll textarea to end
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 100);
  };

  // Loading messages pool
  const loadingMessages = [
    'Îmi pun neuronii artificiali la treabă…',
    'Un moment, conectez toate ideile…',
    'Procesez informațiile… logic, desigur.',
    'Să vedem ce spune fizica despre asta…',
    'Conectez teoria cu practica…',
    'Să vedem dacă pot face fizica să sune simplu.',
  ];

  const getRandomLoadingMessage = () => {
    return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  };

  const stopGeneration = useCallback(async () => {
    if (!isStreaming) return;

    const controller = abortControllerRef.current;
    abortControllerRef.current = null;

    try {
      controller?.abort();
    } catch (err) {
      console.error('Failed to abort streaming response:', err);
    }

    setIsStreaming(false);
    setBusy(false);
    setLoadingMessage(null);

    if (!user) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) return;

      await fetch('/api/insight/increment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      await loadSessions(accessToken);
    } catch (err) {
      console.error('Failed to increment usage after manual stop:', err);
    }
  }, [isStreaming, supabase, user, loadSessions]);

  const send = async (overrideMessage?: string) => {
    const messageSource = typeof overrideMessage === 'string' ? overrideMessage : input;
    const trimmedMessage = messageSource.trim();
    if (!user || !trimmedMessage || busy) return;

    setBusy(true);
    setError(null);

    let controller: AbortController | null = null;
    let currentSessionId = sessionId;
    let sessionInitialized = Boolean(sessionId);

    try {
      abortControllerRef.current?.abort();
      controller = new AbortController();
      abortControllerRef.current = controller;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace('/insight/unauthorized');
        return;
      }

      const newUserMsg: ChatMessage = {
        role: 'user',
        content: trimmedMessage,
      };

      setMessages((prev) => [...prev, newUserMsg]);
      setInput('');

      // Add empty assistant message that will be updated incrementally
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      
      // Set random loading message
      setLoadingMessage(getRandomLoadingMessage());

      if (!currentSessionId) {
        const autoTitle = newUserMsg.content.slice(0, 60) || 'New Chat';
        const createRes = await fetch('/api/insight/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: autoTitle,
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || 'Nu am putut crea sesiunea.');
        }

        const createdData = await createRes.json();
        currentSessionId = createdData.sessionId;
        if (!currentSessionId) {
          throw new Error('Sesiune invalidă creată.');
        }
        setSessionId(currentSessionId);
        sessionStorage.setItem('insight-current-session', currentSessionId);
        await loadSessions(accessToken);
        sessionInitialized = true;
      }

      setIsStreaming(true);

      const res = await fetch('/api/insight/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          input: newUserMsg.content,
        }),
        signal: controller.signal,
      });

      // Check for non-streaming errors (429, etc.)
      if (res.status === 429) {
        const data = await res.json();
        setLoadingMessage(null);
        setError(data.error || 'Limită zilnică atinsă.');
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = {
              role: 'assistant',
              content: data.error || 'Ai atins limita zilnică pentru planul Free (3 solicitări/zi).',
            };
          }
          return newMessages;
        });
        setBusy(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Eroare la Insight.');
      }

      // Check if response is streaming (text/event-stream)
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Process streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (!reader) {
          throw new Error('Nu s-a putut citi răspunsul.');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'session' && data.sessionId) {
                  currentSessionId = data.sessionId;
                  setSessionId(data.sessionId);
                  sessionStorage.setItem('insight-current-session', data.sessionId);
                  if (!sessionInitialized) {
                    await loadSessions(accessToken);
                    sessionInitialized = true;
                  }
                } else if (data.type === 'text' && data.content) {
                  // Clear loading message when first content arrives
                  setLoadingMessage(null);
                  
                  // Update assistant message incrementally (always the last assistant message)
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    // Find the last assistant message
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i]?.role === 'assistant') {
                        newMessages[i] = {
                          role: 'assistant',
                          content: (newMessages[i].content || '') + data.content,
                        };
                        break;
                      }
                    }
                    return newMessages;
                  });
                } else if (data.type === 'done') {
                  // Handle final metadata
                  if (data.sessionId) {
                    currentSessionId = data.sessionId;
                    setSessionId(data.sessionId);
                    sessionStorage.setItem('insight-current-session', data.sessionId);
                  }
                  await loadSessions(accessToken);
                  sessionInitialized = true;
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Eroare la procesarea răspunsului.');
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming responses (shouldn't happen, but handle gracefully)
        const data = await res.json();
        setLoadingMessage(null);
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex]?.role === 'assistant') {
            newMessages[lastIndex] = {
              role: 'assistant',
              content: data.output || 'Nu am primit răspuns.',
            };
          }
          return newMessages;
        });
        
        await loadSessions(accessToken);
        if (data.sessionId) {
          currentSessionId = data.sessionId;
          setSessionId(data.sessionId);
          sessionStorage.setItem('insight-current-session', data.sessionId);
        }
        sessionInitialized = true;
      }
    } catch (e: any) {
      if (controller?.signal.aborted || e?.name === 'AbortError') {
        return;
      }

      const errorMsg = e.message || 'Eroare la comunicarea cu Insight.';
      setLoadingMessage(null);
      setError(errorMsg);
      setMessages((prev) => {
        const newMessages = [...prev];
        // Update the last assistant message with error
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex]?.role === 'assistant') {
          newMessages[lastIndex] = {
            role: 'assistant',
            content: `Eroare: ${errorMsg}`,
          };
        } else {
          newMessages.push({ role: 'assistant', content: `Eroare: ${errorMsg}` });
        }
        return newMessages;
      });
    } finally {
      abortControllerRef.current = null;
      setBusy(false);
      setLoadingMessage(null);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (!pendingPrefill || loadingSession || busy || !sendRef.current || !user) return;
    const message = pendingPrefill;
    setPendingPrefill(null);
    void sendRef.current?.(message);
  }, [pendingPrefill, loadingSession, busy, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery
  );

  if (authLoading || !user || loadingSession) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <div>Se încarcă...</div>
      </div>
    );
  }

  const sidebarBaseClasses = 'bg-[#141414] border-r border-gray-800 flex flex-col';
  const sidebarClassName = isMobile
    ? `${sidebarBaseClasses} fixed inset-y-0 left-0 z-50 h-full w-[85vw] max-w-xs transform transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `${sidebarBaseClasses} ${sidebarCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 flex-shrink-0 h-full`;
  const showCollapsedUI = !isMobile;

  return (
    <div className="h-screen bg-[#141414] text-white flex overflow-hidden">
      {/* Sidebar */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={sidebarClassName}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-start">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">I</span>
          </div>
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (!isMobile || mobileSidebarOpen) && (
          <div className="p-3 border-b border-gray-800 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ctrl+K"
                className="pl-9 pr-3 h-8 bg-[#212121] border-gray-600 text-white placeholder:text-gray-400 text-sm"
              />
            </div>
            <button
              onClick={handleNewChat}
              className="w-full px-3 py-2 bg-[#212121] hover:bg-[#2a3038] border border-gray-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 justify-center"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        )}
        {showCollapsedUI && sidebarCollapsed && (
          <div className="p-3 border-b border-gray-800 space-y-2">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full p-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
              title="Search"
            >
              <Search className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={handleNewChat}
              className="w-full p-2 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sidebarCollapsed ? (
            <div className="py-2 space-y-1">
              {filteredSessions.slice(0, 10).map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`w-full p-2 flex items-center justify-center ${
                    sessionId === session.id ? 'bg-[#212121]' : ''
                  } hover:bg-gray-800 transition-colors`}
                  title={session.title || 'Nou chat'}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => {
                    // Only hide if menu is not open
                    if (sessionMenuOpen !== session.id) {
                      setHoveredSessionId(null);
                    }
                  }}
                >
                  {renameSessionId === session.id ? (
                    <div className="px-3 py-2">
                      <Input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (renameValue.trim()) {
                              handleRenameSession(session.id, renameValue);
                            } else {
                              setRenameSessionId(null);
                              setRenameValue('');
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setRenameSessionId(null);
                            setRenameValue('');
                          }
                        }}
                        onBlur={() => {
                          if (renameValue.trim()) {
                            handleRenameSession(session.id, renameValue);
                          } else {
                            setRenameSessionId(null);
                            setRenameValue('');
                          }
                        }}
                        className="h-8 bg-[#212121] border-gray-600 text-white text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSessionClick(session.id)}
                      className={`w-full px-3 py-2 pr-10 text-left text-sm truncate transition-colors ${
                        sessionId === session.id
                          ? 'bg-[#212121] text-white'
                          : 'text-gray-300 hover:bg-gray-800/50'
                      }`}
                    >
                      {session.title || 'Nou chat'}
                    </button>
                  )}
                  {renameSessionId !== session.id && (
                    <div
                      className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${
                        hoveredSessionId === session.id || sessionMenuOpen === session.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                      onMouseEnter={() => setHoveredSessionId(session.id)}
                      onMouseLeave={() => {
                        if (sessionMenuOpen !== session.id) {
                          setHoveredSessionId(null);
                        }
                      }}
                    >
                      <DropdownMenu
                        open={sessionMenuOpen === session.id}
                        onOpenChange={(open) => {
                          setSessionMenuOpen(open ? session.id : null);
                          if (open) {
                            setHoveredSessionId(session.id);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#212121] border-gray-700"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameSessionId(session.id);
                              setRenameValue(session.title || '');
                              setSessionMenuOpen(null);
                              setTimeout(() => renameInputRef.current?.focus(), 0);
                            }}
                            className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinSession(session.id);
                              setSessionMenuOpen(null);
                            }}
                            className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          >
                            <Pin className="w-4 h-4 mr-2" />
                            Pin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(session.id);
                            }}
                            className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar & Toggle Sidebar */}
        <div className={`p-3 border-t border-gray-800 flex items-center gap-2 transition-all duration-300 ${
          sidebarCollapsed ? 'flex-col' : 'flex-row'
        }`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-2 min-w-0 transition-all duration-300 flex-shrink-0 ${
                sidebarCollapsed 
                  ? 'w-full justify-center mb-2 transform translate-y-0' 
                  : ''
              }`}>
                <Avatar className={`w-8 h-8 flex-shrink-0 transition-all duration-300 ${
                  sidebarCollapsed ? 'scale-100' : 'scale-100'
                }`}>
                  {profile?.user_icon ? (
                    <AvatarImage
                      src={profile.user_icon}
                      alt={profile?.nickname || profile?.name || user.email || 'U'}
                    />
                  ) : null}
                  <AvatarFallback>
                    {(profile?.nickname ||
                      profile?.name ||
                      user.user_metadata?.name ||
                      user.email ||
                      'U')
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {showCollapsedUI && !sidebarCollapsed && (
                  <span className="font-medium text-white text-sm truncate transition-opacity duration-300">
                    {profile?.nickname ||
                      profile?.name ||
                      user.user_metadata?.name ||
                      user.email}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#212121] border-gray-700">
              <DropdownMenuItem asChild>
                <a href="/profil" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                  Profil
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="block px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                disabled
              >
                Clasa mea
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem asChild>
                <button
                  onClick={async () => {
                    await logout();
                    toast({ title: 'Te-ai delogat cu succes!' });
                    router.push('/');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                >
                  Logout
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {showCollapsedUI && !sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex-1 p-2 rounded transition-all duration-300 flex items-center justify-end flex-shrink-0 group"
              title="Minimizează sidebar"
            >
              <ChevronsLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors duration-300" />
            </button>
          )}
          {showCollapsedUI && sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full p-2 rounded transition-all duration-300 flex items-center justify-center flex-shrink-0 group"
              title="Extinde sidebar"
            >
              <ChevronsRight className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors duration-300" />
            </button>
          )}
          {isMobile && mobileSidebarOpen && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex-1 h-12 rounded transition-all duration-300 flex items-center justify-end pr-3 flex-shrink-0 text-gray-300 hover:text-gray-100"
              title="Închide sidebar-ul"
            >
              <ChevronsLeft className="w-5 h-5 transition-colors duration-300" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#141414] overflow-hidden relative" style={{ position: 'relative', height: '100%' }}>
        {isMobile && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#1b1b1b] border border-gray-700 text-gray-300 hover:text-white hover:bg-[#242424] transition-colors"
            title="Deschide meniul"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Back Home Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 right-8 max-[600px]:right-4 z-10 flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
          title="Înapoi acasă"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Înapoi acasă</span>
        </button>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto ${hasMessages ? 'px-8 py-6' : 'px-8'}`} style={{ minHeight: 0 }}>
          {hasMessages ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages
                .filter((m) => m.role !== 'system')
                .map((m, i) => {
                  const isAssistant = m.role === 'assistant';
                  const filteredMessages = messages.filter((m) => m.role !== 'system');
                  const isLastMessage = i === filteredMessages.length - 1;
                  const isLastAssistantMessage = isAssistant && isLastMessage;
                  
                  return (
                    <div
                      key={i}
                      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                      style={isLastAssistantMessage ? { paddingBottom: '70px' } : undefined}
                    >
                      {isAssistant ? (
                        <div className="w-full py-2">
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            {m.content === '' && loadingMessage ? (
                              <span className="flex items-center gap-2">
                                <span>{loadingMessage}</span>
                                <span className="flex gap-1">
                                  <span className="animate-pulse">●</span>
                                  <span className="animate-pulse delay-75">●</span>
                                  <span className="animate-pulse delay-150">●</span>
                                </span>
                              </span>
                            ) : (
                              'Insight'
                            )}
                          </div>
                          {m.content && <MessageContent content={m.content} />}
                        </div>
                      ) : (
                        <div className="max-w-[70%] rounded-3xl bg-[#212121] text-white px-4 py-3 shadow-sm">
                          <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 opacity-70">
                            Tu
                          </div>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {m.content}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              <div ref={endRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-3xl w-full">
                {/* Empty state - chatbar will be centered here */}
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-8 pb-2">
            <div className="max-w-3xl mx-auto">
              <div className="bg-red-900/20 border border-red-800 text-red-300 rounded p-2 text-sm">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Chatbar */}
        {hasMessages ? (
          // Floating chatbar when messages exist
          <div className="absolute bottom-0 left-0 right-0 px-8 py-4 pointer-events-none">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 bg-[#212121] border border-gray-600 rounded-3xl p-3 shadow-lg backdrop-blur-sm pointer-events-auto hover:shadow-xl hover:border-gray-500 transition-all duration-200 drop-shadow-lg max-[600px]:mt-4">
                <button
                  className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 self-end mb-0.5"
                  disabled
                  title="Atașează fișier (în curând)"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </button>
                <Textarea
                  ref={textareaRef}
                  placeholder="What do you want to know?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={busy}
                  style={{ 
                    minHeight: '28px', 
                    height: input.trim() ? `${textareaHeight}px` : '28px',
                    maxHeight: input.trim() ? '288px' : '28px',
                    overflowY: input.trim() && textareaHeight > 24 * 12 ? 'auto' : 'hidden',
                    overflowX: 'hidden',
                    fontSize: '14px',
                    lineHeight: '20px',
                    paddingTop: input.trim() ? '8px' : '4px',
                    paddingBottom: input.trim() ? '8px' : '4px',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    display: 'block'
                  }}
                />
                {busy && isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    className="p-2 rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                    title="Oprește răspunsul"
                  >
                    <span className="flex items-center justify-center w-5 h-5">
                      <span className="flex items-center justify-center w-4 h-4 bg-white rounded-full">
                        <span className="w-2 h-2 bg-black" />
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => send()}
                    disabled={busy || !input.trim()}
                    className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                  >
                    <Send className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center pointer-events-auto max-[600px]:hidden">
                Plan Free: limită 3 mesaje/zi. Apasă Enter pentru a trimite, Shift+Enter pentru
                linie nouă.
              </div>
            </div>
          </div>
        ) : (
          // Centered chatbar when no messages
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="max-w-3xl w-full flex flex-col items-center">
              {/* Welcome Text */}
              <div className="text-white text-2xl md:text-[2.8rem] mb-6 text-center leading-tight">
                {formatWelcomeText(welcomeText)}
              </div>
              <div className="w-full">
                <div className="relative flex items-end gap-2 bg-[#212121] border border-gray-600 rounded-3xl p-3 shadow-lg backdrop-blur-sm pointer-events-auto hover:shadow-xl hover:border-gray-500 transition-all duration-200">
                  <button
                    className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 self-end mb-0.5"
                    disabled
                    title="Atașează fișier (în curând)"
                  >
                    <Paperclip className="w-4 h-4 text-gray-400" />
                  </button>
                  <Textarea
                    ref={textareaRef}
                    placeholder="What do you want to know?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={busy}
                    style={{ 
                      minHeight: '28px', 
                      height: input.trim() ? `${textareaHeight}px` : '28px',
                      maxHeight: input.trim() ? '288px' : '28px',
                      overflowY: input.trim() && textareaHeight > 24 * 12 ? 'auto' : 'hidden',
                      overflowX: 'hidden',
                      fontSize: '14px',
                      lineHeight: '20px',
                      paddingTop: input.trim() ? '8px' : '4px',
                      paddingBottom: input.trim() ? '8px' : '4px',
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      display: 'block'
                    }}
                  />
                  {busy && isStreaming ? (
                    <button
                      onClick={stopGeneration}
                      className="p-2 rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                      title="Oprește răspunsul"
                    >
                      <span className="flex items-center justify-center w-5 h-5">
                        <span className="flex items-center justify-center w-4 h-4 bg-white rounded-full">
                          <span className="w-2 h-2 bg-black" />
                        </span>
                      </span>
                    </button>
                  ) : (
                  <button
                    onClick={() => send()}
                      disabled={busy || !input.trim()}
                      className="p-2 rounded hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
                    >
                      <Send className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {/* Action Buttons */}
                <InsightActionButtons
                  onThinkDeeper={handleThinkDeeper}
                  onTeachMe={handleTeachMe}
                  onSolveProblem={handleSolveProblem}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Text at bottom for new chats only */}
        {!hasMessages && (
          <div className="absolute bottom-4 left-0 right-0 px-8 pointer-events-none">
            <div className="max-w-3xl mx-auto">
              <div className="text-xs text-gray-500 text-center pointer-events-auto">
                Plan Free: limită 3 mesaje/zi. Apasă Enter pentru a trimite, Shift+Enter pentru
                linie nouă.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-black border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ștergere chat</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Ești sigur că vrei să ștergi acest chat? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plus Plan Popup */}
      <AlertDialog open={plusPlanPopupOpen} onOpenChange={setPlusPlanPopupOpen}>
        <AlertDialogContent className="bg-black border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {plusPlanPopupType === 'think' ? 'Think Deeper' : 'Teach me'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Această funcționalitate necesită planul Plus sau superior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              Închide
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/insight')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Vezi planurile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Problems Dialog */}
      <InsightProblemsDialog
        open={problemsDialogOpen}
        onOpenChange={setProblemsDialogOpen}
        onSelectProblem={handleSelectProblem}
      />
    </div>
  );
}

export default function InsightChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
          <div>Se încarcă...</div>
        </div>
      }
    >
      <InsightChatPageContent />
    </Suspense>
  );
}
