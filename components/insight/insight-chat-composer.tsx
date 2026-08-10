'use client';

import type { RefObject } from 'react';
import { Camera, Loader2, Paperclip, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  ChatMessageLimitHint,
  ChatMessageLimitLockButton,
  CHAT_MESSAGE_LIMIT_PLACEHOLDER,
} from '@/components/chat-message-limit-lock';
import { MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE } from '@/lib/insight-client-image';
import { cn } from '@/lib/utils';

export type InsightComposerAttachment = {
  id: string;
  preview: string;
};

type InsightChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  textareaHeight: number;
  pendingAttachments: InsightComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  onOpenAttachmentPicker: () => void;
  onOpenCamera?: () => void;
  onSend: () => void;
  onStop?: () => void;
  busy: boolean;
  isStreaming: boolean;
  uploadingAttachments: boolean;
  canSend: boolean;
  user: unknown;
  isMobile: boolean;
  placeholder?: string;
  className?: string;
  messageLimitReached?: boolean;
  onUpgradeClick?: () => void;
};

export function InsightChatComposer({
  input,
  onInputChange,
  onKeyDown,
  textareaRef,
  textareaHeight,
  pendingAttachments,
  onRemoveAttachment,
  onOpenAttachmentPicker,
  onOpenCamera,
  onSend,
  onStop,
  busy,
  isStreaming,
  uploadingAttachments,
  canSend,
  user,
  isMobile,
  placeholder = 'What do you want to know?',
  className,
  messageLimitReached = false,
  onUpgradeClick,
}: InsightChatComposerProps) {
  const iconBtnClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors duration-150 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.1] disabled:pointer-events-none disabled:opacity-35';
  const composerDisabled = busy || messageLimitReached;

  return (
    <div className="space-y-2">
      {messageLimitReached && onUpgradeClick ? (
        <ChatMessageLimitHint tone="dark" onUpgradeClick={onUpgradeClick} />
      ) : null}

      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1c1c1c]/95 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[border-color,box-shadow] duration-200 focus-within:border-white/[0.14] focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.45)]',
          messageLimitReached && 'focus-within:border-white/[0.08] focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
          className
        )}
      >
        {pendingAttachments.length > 0 && !messageLimitReached && (
          <div className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="group/att relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.preview}
                  alt="Previzualizare atașament"
                  className="h-[72px] w-[72px] rounded-xl border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#2a2a2a] text-white opacity-100 shadow-sm transition-opacity duration-150 sm:opacity-0 sm:group-hover/att:opacity-100 sm:focus:opacity-100 hover:bg-[#3a3a3a]"
                  title="Elimină imaginea"
                  aria-label="Elimină imaginea"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-0.5 px-2 py-2">
          <button
            type="button"
            className={iconBtnClass}
            disabled={composerDisabled || uploadingAttachments}
            title={
              messageLimitReached
                ? CHAT_MESSAGE_LIMIT_PLACEHOLDER
                : user
                  ? `Atașează imagini (max. ${MAX_INSIGHT_ATTACHMENTS_PER_MESSAGE})`
                  : 'Autentifică-te pentru a atașa imagini'
            }
            onClick={onOpenAttachmentPicker}
          >
            {uploadingAttachments ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {isMobile && onOpenCamera ? (
            <button
              type="button"
              className={iconBtnClass}
              disabled={!user || composerDisabled || uploadingAttachments}
              title={
                messageLimitReached
                  ? CHAT_MESSAGE_LIMIT_PLACEHOLDER
                  : user
                    ? 'Fă o poză la problemă'
                    : 'Autentifică-te pentru a atașa imagini'
              }
              onClick={onOpenCamera}
            >
              <Camera className="h-4 w-4" />
            </button>
          ) : null}

          <Textarea
            ref={textareaRef}
            placeholder={messageLimitReached ? CHAT_MESSAGE_LIMIT_PLACEHOLDER : placeholder}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={composerDisabled}
            readOnly={messageLimitReached}
            className="insight-composer-textarea min-h-0 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] leading-[22px] text-white placeholder:text-[#737373] focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              height: `${textareaHeight}px`,
              maxHeight: '200px',
              overflowY: textareaHeight >= 200 ? 'auto' : 'hidden',
            }}
          />

          {messageLimitReached ? (
            <ChatMessageLimitLockButton
              onClick={onUpgradeClick}
              tone="dark"
              iconSize={16}
              className="mb-0.5 h-9 w-9"
            />
          ) : busy && isStreaming && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className={cn(iconBtnClass, 'text-white')}
              title="Oprește răspunsul"
              aria-label="Oprește răspunsul"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white">
                <span className="h-2 w-2 bg-black" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={busy || !canSend}
              className={cn(
                iconBtnClass,
                canSend && !busy && 'text-white hover:bg-white/[0.1]'
              )}
              title="Trimite mesajul"
              aria-label="Trimite mesajul"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
