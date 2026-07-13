import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Mathematics } from "@tiptap/extension-mathematics"
import { BlogAdCardExtension } from "@/components/blog/tiptap/blog-ad-card-extension"

type CreateBlogEditorExtensionsOptions = {
  imageClass: string
  linkOpenOnClick?: boolean
}

export function createBlogEditorExtensions({
  imageClass,
  linkOpenOnClick = false,
}: CreateBlogEditorExtensionsOptions) {
  const linkExtension = linkOpenOnClick
    ? Link.configure({
        openOnClick: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      })
    : Link.configure({ openOnClick: false })

  return [
    StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
    linkExtension,
    Image.configure({ HTMLAttributes: { class: imageClass } }),
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
      },
    }),
    BlogAdCardExtension,
  ]
}
