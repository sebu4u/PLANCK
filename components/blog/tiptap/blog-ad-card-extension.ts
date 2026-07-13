import { Node, mergeAttributes } from "@tiptap/core"
import {
  DEFAULT_BLOG_AD_CARD_ATTRS,
  normalizeBlogAdCardAttrs,
  renderBlogAdCardHtml,
} from "@/components/blog/tiptap/blog-ad-card-types"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogAdCard: {
      insertBlogAdCard: (attrs?: Partial<typeof DEFAULT_BLOG_AD_CARD_ATTRS>) => ReturnType
    }
  }
}

export const BlogAdCardExtension = Node.create({
  name: "blogAdCard",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      title: { default: DEFAULT_BLOG_AD_CARD_ATTRS.title },
      text: { default: DEFAULT_BLOG_AD_CARD_ATTRS.text },
      ctaLabel: { default: DEFAULT_BLOG_AD_CARD_ATTRS.ctaLabel },
      ctaHref: { default: DEFAULT_BLOG_AD_CARD_ATTRS.ctaHref },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-blog-ad-card=""]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false

          const title =
            element.getAttribute("data-title") ??
            element.querySelector("h3")?.textContent ??
            DEFAULT_BLOG_AD_CARD_ATTRS.title
          const text =
            element.getAttribute("data-text") ??
            element.querySelector("p")?.textContent ??
            DEFAULT_BLOG_AD_CARD_ATTRS.text
          const ctaLabel =
            element.getAttribute("data-cta-label") ??
            element.querySelector("a")?.textContent ??
            DEFAULT_BLOG_AD_CARD_ATTRS.ctaLabel
          const ctaHref =
            element.getAttribute("data-cta-href") ??
            element.querySelector("a")?.getAttribute("href") ??
            DEFAULT_BLOG_AD_CARD_ATTRS.ctaHref

          return normalizeBlogAdCardAttrs({ title, text, ctaLabel, ctaHref })
        },
      },
    ]
  },

  renderHTML({ node }) {
    return renderBlogAdCardHtml(normalizeBlogAdCardAttrs(node.attrs))
  },

  addCommands() {
    return {
      insertBlogAdCard:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: normalizeBlogAdCardAttrs(attrs),
          }),
    }
  },
})
