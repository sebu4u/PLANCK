'use client';

import { InvataAskThinkingDots } from '@/components/invata/invata-ask-thinking';

type InsightChatThinkingProps = {
  message: string;
};

export function InsightChatThinking({ message }: InsightChatThinkingProps) {
  return (
    <div
      className="flex items-center gap-3 py-2"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <InvataAskThinkingDots />
      <span className="text-sm font-normal normal-case tracking-normal text-[#9ca3af]">
        {message}
      </span>
    </div>
  );
}
