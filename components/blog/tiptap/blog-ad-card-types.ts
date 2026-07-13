export type BlogAdCardAttrs = {
  title: string
  text: string
  ctaLabel: string
  ctaHref: string
}

export const DEFAULT_BLOG_AD_CARD_ATTRS: BlogAdCardAttrs = {
  title: "Titlul cardului",
  text: "Descriere scurtă pentru cardul promo.",
  ctaLabel: "Explorează Premium",
  ctaHref: "/pricing",
}

export const BLOG_INLINE_AD_CARD_CLASS =
  "blog-inline-ad-card my-8 rounded-2xl border-4 border-gray-200 bg-white px-6 py-6 text-center not-prose"

export const BLOG_PREMIUM_CTA_CLASS =
  "dashboard-start-glow inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-[#101117] shadow-[0_4px_0_var(--premium-accent-dark)] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:shadow-[0_2px_0_var(--premium-accent-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--premium-accent-dark)]"

export const BLOG_PREMIUM_CTA_STYLE =
  "background-image:linear-gradient(to right,#8f91f1,#cd83db,#f2b93d);--premium-accent-dark:#9a5aa8;--start-glow-tint:rgba(248,220,228,0.88)"

export function normalizeBlogAdCardAttrs(
  attrs: Partial<BlogAdCardAttrs> | Record<string, unknown> | undefined,
): BlogAdCardAttrs {
  return {
    title:
      typeof attrs?.title === "string" && attrs.title.trim()
        ? attrs.title.trim()
        : DEFAULT_BLOG_AD_CARD_ATTRS.title,
    text:
      typeof attrs?.text === "string" && attrs.text.trim()
        ? attrs.text.trim()
        : DEFAULT_BLOG_AD_CARD_ATTRS.text,
    ctaLabel:
      typeof attrs?.ctaLabel === "string" && attrs.ctaLabel.trim()
        ? attrs.ctaLabel.trim()
        : DEFAULT_BLOG_AD_CARD_ATTRS.ctaLabel,
    ctaHref:
      typeof attrs?.ctaHref === "string" && attrs.ctaHref.trim()
        ? attrs.ctaHref.trim()
        : DEFAULT_BLOG_AD_CARD_ATTRS.ctaHref,
  }
}

export function renderBlogAdCardHtml(attrs: BlogAdCardAttrs) {
  const { title, text, ctaLabel, ctaHref } = normalizeBlogAdCardAttrs(attrs)

  return [
    "div",
    {
      "data-blog-ad-card": "",
      class: BLOG_INLINE_AD_CARD_CLASS,
      "data-title": title,
      "data-text": text,
      "data-cta-label": ctaLabel,
      "data-cta-href": ctaHref,
    },
    ["h3", { class: "text-xl font-bold leading-tight text-gray-900" }, title],
    ["p", { class: "mx-auto mt-3 max-w-lg text-base leading-relaxed text-gray-600" }, text],
    [
      "div",
      { class: "mt-6 flex justify-center" },
      [
        "a",
        {
          href: ctaHref,
          class: BLOG_PREMIUM_CTA_CLASS,
          style: BLOG_PREMIUM_CTA_STYLE,
        },
        ["span", { class: "relative z-[1]" }, ctaLabel],
      ],
    ],
  ] as const
}
