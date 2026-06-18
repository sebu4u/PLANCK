/** Shared layout tokens for the desktop learning-path Insight panel. */

export const LP_AI_CHAT_PANEL_WIDTH_CLASS = "w-[25vw] min-w-[300px] max-w-[420px]"

export const LP_AI_CHAT_DESKTOP_RIGHT_INSET_CLASS = "lg:right-[25vw]"

export const LP_AI_CHAT_DESKTOP_MARGIN_CLASS = "lg:mr-[25vw]"

export const LP_AI_CHAT_INSET_TRANSITION_CLASS =
  "transition-[right,margin-right] duration-300 ease-out"

export function lpAiChatDesktopRightInset(active: boolean): string {
  return active
    ? `${LP_AI_CHAT_DESKTOP_RIGHT_INSET_CLASS} ${LP_AI_CHAT_INSET_TRANSITION_CLASS}`
    : LP_AI_CHAT_INSET_TRANSITION_CLASS
}

export function lpAiChatDesktopMargin(active: boolean): string {
  return active
    ? `${LP_AI_CHAT_DESKTOP_MARGIN_CLASS} ${LP_AI_CHAT_INSET_TRANSITION_CLASS}`
    : LP_AI_CHAT_INSET_TRANSITION_CLASS
}
