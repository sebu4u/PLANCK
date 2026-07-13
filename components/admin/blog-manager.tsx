"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import { Folder, FileText, Loader2, Megaphone, Plus, Save, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BlogAdCardDialog } from "@/components/admin/blog-ad-card-dialog"
import { createBlogEditorExtensions } from "@/components/blog/tiptap/blog-editor-extensions"
import { normalizeBlogAdCardAttrs, type BlogAdCardAttrs } from "@/components/blog/tiptap/blog-ad-card-types"
import { supabase } from "@/lib/supabaseClient"
import { slugify } from "@/lib/slug"
import type { BlogStatus } from "@/lib/blog"

type Category = { id: string; name: string; slug: string; description: string | null; meta_title: string | null; meta_description: string | null }
type Post = {
  id: string; slug: string; title: string; excerpt: string; content: Record<string, unknown>; faq_items: Array<{ question: string; answer: string }>
  cover_image_url: string | null; cover_image_alt: string | null; meta_title: string | null; meta_description: string | null
  canonical_path: string | null; status: BlogStatus; published_at: string | null; blog_post_categories: Array<{ category_id: string }>
}

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] }
const EMPTY_FORM = {
  id: "", title: "", slug: "", excerpt: "", content: EMPTY_DOC as Record<string, unknown>, faq_items: [] as Array<{ question: string; answer: string }>,
  cover_image_url: null as string | null, cover_image_alt: null as string | null, meta_title: null as string | null,
  meta_description: null as string | null, canonical_path: null as string | null, status: "draft" as BlogStatus, published_at: null as string | null, category_ids: [] as string[],
}

async function tokenHeaders() {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error("Sesiune expirată.")
  return { Authorization: `Bearer ${data.session.access_token}` }
}

function readError(data: unknown, fallback: string) {
  return data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : fallback
}

function getSelectedBlogAdCard(editor: Editor) {
  const { selection } = editor.state
  if (!("node" in selection)) return null

  const node = (selection as { node?: { type: { name: string }; attrs: Record<string, unknown> } }).node
  if (node?.type.name !== "blogAdCard") return null
  return node
}

export function BlogManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all")
  const [form, setForm] = useState(EMPTY_FORM)
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adCardDialogOpen, setAdCardDialogOpen] = useState(false)
  const [adCardDialogMode, setAdCardDialogMode] = useState<"insert" | "edit">("insert")
  const [adCardDialogInitial, setAdCardDialogInitial] = useState<BlogAdCardAttrs | undefined>()
  const [canEditAdCard, setCanEditAdCard] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createBlogEditorExtensions({
      imageClass: "my-5 h-auto max-w-full rounded-lg",
    }),
    content: form.content,
    editorProps: {
      attributes: {
        class:
          "blog-admin-editor min-h-64 rounded-b-md border border-white/15 bg-black/30 p-4 outline-none prose prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor }) => setForm((current) => ({ ...current, content: editor.getJSON() })),
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/blog", { headers: await tokenHeaders() })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut încărca blogul."))
      setCategories(data.categories ?? [])
      setPosts(data.posts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut încărca blogul.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (editor) editor.commands.setContent(form.content) }, [editor, form.id]) // only switch documents

  useEffect(() => {
    if (!editor) return

    const syncAdCardSelection = () => {
      setCanEditAdCard(Boolean(getSelectedBlogAdCard(editor)))
    }

    editor.on("selectionUpdate", syncAdCardSelection)
    editor.on("transaction", syncAdCardSelection)
    syncAdCardSelection()

    return () => {
      editor.off("selectionUpdate", syncAdCardSelection)
      editor.off("transaction", syncAdCardSelection)
    }
  }, [editor])

  const visiblePosts = useMemo(
    () => selectedCategoryId === "all" ? posts : posts.filter((post) => post.blog_post_categories.some((entry) => entry.category_id === selectedCategoryId)),
    [posts, selectedCategoryId],
  )

  const selectPost = (post: Post) => {
    setForm({
      id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content || EMPTY_DOC, faq_items: post.faq_items || [],
      cover_image_url: post.cover_image_url, cover_image_alt: post.cover_image_alt, meta_title: post.meta_title, meta_description: post.meta_description,
      canonical_path: post.canonical_path, status: post.status, published_at: post.published_at,
      category_ids: post.blog_post_categories.map((entry) => entry.category_id),
    })
    setError(null)
  }

  const createCategory = async () => {
    if (!categoryName.trim()) return
    try {
      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { ...(await tokenHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", name: categoryName, slug: slugify(categoryName) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut crea categoria."))
      setCategoryName("")
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut crea categoria.") }
  }

  const editSelectedCategory = async () => {
    const category = categories.find((item) => item.id === selectedCategoryId)
    if (!category) return
    const name = window.prompt("Numele categoriei", category.name)
    if (!name?.trim()) return
    const description = window.prompt("Descrierea categoriei", category.description ?? "")
    try {
      const response = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { ...(await tokenHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", ...category, name, slug: slugify(name), description: description || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut actualiza categoria."))
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut actualiza categoria.") }
  }

  const deleteSelectedCategory = async () => {
    const category = categories.find((item) => item.id === selectedCategoryId)
    if (!category || !window.confirm(`Ștergi categoria „${category.name}”?`)) return
    try {
      const response = await fetch(`/api/admin/blog?type=category&id=${category.id}`, { method: "DELETE", headers: await tokenHeaders() })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut șterge categoria."))
      setSelectedCategoryId("all")
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut șterge categoria.") }
  }

  const deletePost = async () => {
    if (!form.id) return
    const message =
      form.status === "published"
        ? `Ștergi articolul publicat „${form.title}”? Acțiunea este ireversibilă și articolul va dispărea de pe site.`
        : `Ștergi articolul „${form.title}”? Acțiunea este ireversibilă.`
    if (!window.confirm(message)) return
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/blog?type=post&id=${form.id}`, { method: "DELETE", headers: await tokenHeaders() })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut șterge articolul."))
      setForm(EMPTY_FORM)
      if (editor) editor.commands.setContent(EMPTY_DOC)
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut șterge articolul.") }
    finally { setDeleting(false) }
  }

  const save = async () => {
    if (!form.category_ids.length) { setError("Alege cel puțin o categorie."); return }
    setSaving(true)
    setError(null)
    try {
      const method = form.id ? "PUT" : "POST"
      const { id, ...postFields } = form
      const response = await fetch("/api/admin/blog", {
        method,
        headers: { ...(await tokenHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "post",
          ...postFields,
          ...(id ? { id } : {}),
          slug: form.slug || slugify(form.title),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut salva articolul."))
      if (!form.id) selectPost({ ...data.post, blog_post_categories: form.category_ids.map((category_id) => ({ category_id })) })
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut salva articolul.") }
    finally { setSaving(false) }
  }

  const uploadCover = async (file: File) => {
    setSaving(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const response = await fetch("/api/admin/blog/upload", { method: "POST", headers: await tokenHeaders(), body })
      const data = await response.json()
      if (!response.ok) throw new Error(readError(data, "Nu am putut încărca imaginea."))
      setForm((current) => ({ ...current, cover_image_url: data.url }))
    } catch (err) { setError(err instanceof Error ? err.message : "Nu am putut încărca imaginea.") }
    finally { setSaving(false); if (uploadRef.current) uploadRef.current.value = "" }
  }

  const addInlineImage = () => {
    const src = window.prompt("URL-ul imaginii")
    const alt = window.prompt("Text alternativ descriptiv")
    if (src && alt) editor?.chain().focus().setImage({ src, alt }).run()
  }

  const openInsertAdCard = () => {
    setAdCardDialogMode("insert")
    setAdCardDialogInitial(undefined)
    setAdCardDialogOpen(true)
  }

  const openEditAdCard = () => {
    if (!editor) return
    const selectedNode = getSelectedBlogAdCard(editor)
    if (!selectedNode) return
    setAdCardDialogMode("edit")
    setAdCardDialogInitial(normalizeBlogAdCardAttrs(selectedNode.attrs))
    setAdCardDialogOpen(true)
  }

  const saveAdCard = (attrs: BlogAdCardAttrs) => {
    if (adCardDialogMode === "insert") {
      editor?.chain().focus().insertBlogAdCard(attrs).run()
      return
    }
    editor?.chain().focus().updateAttributes("blogAdCard", attrs).run()
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Categorii</h2><Button size="sm" variant="ghost" onClick={() => setForm(EMPTY_FORM)}><Plus className="mr-1 h-4 w-4" />Articol</Button></div>
        <button onClick={() => setSelectedCategoryId("all")} className={`mt-4 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${selectedCategoryId === "all" ? "bg-cyan-500/20 text-cyan-200" : "text-gray-300 hover:bg-white/10"}`}><Folder className="h-4 w-4" /> Toate articolele</button>
        {categories.map((category) => <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${selectedCategoryId === category.id ? "bg-cyan-500/20 text-cyan-200" : "text-gray-300 hover:bg-white/10"}`}><Folder className="h-4 w-4" />{category.name}</button>)}
        <div className="mt-4 flex gap-2"><Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void createCategory()} placeholder="Categorie nouă" className="border-white/15 bg-black/30 text-sm" /><Button size="icon" onClick={() => void createCategory()}><Plus className="h-4 w-4" /></Button></div>
        {selectedCategoryId !== "all" ? <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => void editSelectedCategory()}>Editează categoria</Button><Button size="sm" variant="ghost" className="text-red-300" onClick={() => void deleteSelectedCategory()}>Șterge</Button></div> : null}
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Articole</p>
          {visiblePosts.map((post) => <button key={post.id} onClick={() => selectPost(post)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white/10 ${form.id === post.id ? "bg-white/10" : ""}`}><FileText className="h-4 w-4 shrink-0 text-gray-400" /><span className="truncate">{post.title}</span></button>)}
        </div>
      </aside>
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{form.id ? "Editează articolul" : "Articol nou"}</h2>
          <div className="flex flex-wrap gap-2">
            {form.id ? (
              <Button variant="ghost" className="text-red-300 hover:text-red-200" disabled={saving || deleting} onClick={() => void deletePost()}>
                <Trash2 className="mr-2 h-4 w-4" />{deleting ? "Se șterge…" : "Șterge"}
              </Button>
            ) : null}
            <Button disabled={saving || deleting} onClick={() => void save()}><Save className="mr-2 h-4 w-4" />{saving ? "Se salvează…" : "Salvează"}</Button>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Titlu<Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, slug: form.slug || slugify(event.target.value) })} className="mt-1 border-white/15 bg-black/30" /></label>
          <label className="text-sm">Slug<Input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} className="mt-1 border-white/15 bg-black/30" /></label>
          <label className="text-sm md:col-span-2">Rezumat / meta description<textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border border-white/15 bg-black/30 p-2 text-sm" /></label>
          <label className="text-sm">Meta title (max. 60)<Input value={form.meta_title ?? ""} onChange={(event) => setForm({ ...form, meta_title: event.target.value || null })} className="mt-1 border-white/15 bg-black/30" /></label>
          <label className="text-sm">Stare<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogStatus })} className="mt-1 h-10 w-full rounded-md border border-white/15 bg-black/30 px-2 text-sm"><option value="draft">Ciornă</option><option value="review">În revizuire</option><option value="scheduled">Programat</option><option value="published">Publicat</option></select></label>
          {(form.status === "scheduled" || form.status === "published") ? <label className="text-sm">Data publicării<input type="datetime-local" value={form.published_at ? form.published_at.slice(0, 16) : ""} onChange={(event) => setForm({ ...form, published_at: event.target.value ? new Date(event.target.value).toISOString() : null })} className="mt-1 h-10 w-full rounded-md border border-white/15 bg-black/30 px-2 text-sm" /></label> : null}
        </div>
        <fieldset className="mt-5"><legend className="text-sm">Categorii</legend><div className="mt-2 flex flex-wrap gap-3">{categories.map((category) => <label key={category.id} className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.category_ids.includes(category.id)} onChange={(event) => setForm({ ...form, category_ids: event.target.checked ? [...form.category_ids, category.id] : form.category_ids.filter((id) => id !== category.id) })} />{category.name}</label>)}</div></fieldset>
        <div className="mt-5"><p className="text-sm">Imagine copertă</p><div className="mt-2 flex items-center gap-3"><input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => event.target.files?.[0] && void uploadCover(event.target.files[0])} /><Button variant="outline" onClick={() => uploadRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Încarcă</Button>{form.cover_image_url ? <span className="text-xs text-emerald-300">Imagine încărcată</span> : null}</div><Input value={form.cover_image_alt ?? ""} onChange={(event) => setForm({ ...form, cover_image_alt: event.target.value || null })} placeholder="Alt text descriptiv (obligatoriu dacă există copertă)" className="mt-2 border-white/15 bg-black/30" /></div>
        <div className="mt-6"><p className="mb-2 text-sm">Conținut</p><div className="flex flex-wrap gap-1 rounded-t-md border border-white/15 border-b-0 bg-black/40 p-2"><Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</Button><Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button><Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleBulletList().run()}>Listă</Button><Button size="sm" variant="ghost" onClick={addInlineImage}>Imagine</Button><Button size="sm" variant="ghost" onClick={openInsertAdCard}><Megaphone className="mr-1.5 h-4 w-4" />Card promo</Button><Button size="sm" variant="ghost" disabled={!canEditAdCard} onClick={openEditAdCard}>Editează card</Button></div><EditorContent editor={editor} /></div>
        <BlogAdCardDialog
          open={adCardDialogOpen}
          mode={adCardDialogMode}
          initialValues={adCardDialogInitial}
          onOpenChange={setAdCardDialogOpen}
          onSave={saveAdCard}
        />
        <div className="mt-6 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><h3 className="font-semibold">Întrebări frecvente</h3><Button size="sm" variant="outline" onClick={() => setForm({ ...form, faq_items: [...form.faq_items, { question: "", answer: "" }] })}><Plus className="mr-1 h-4 w-4" />FAQ</Button></div>{form.faq_items.map((faq, index) => <div key={index} className="mt-3 grid gap-2"><Input value={faq.question} onChange={(event) => setForm({ ...form, faq_items: form.faq_items.map((item, i) => i === index ? { ...item, question: event.target.value } : item) })} placeholder="Întrebare" className="border-white/15 bg-black/30" /><textarea value={faq.answer} onChange={(event) => setForm({ ...form, faq_items: form.faq_items.map((item, i) => i === index ? { ...item, answer: event.target.value } : item) })} placeholder="Răspuns" className="min-h-20 rounded-md border border-white/15 bg-black/30 p-2 text-sm" /></div>)}</div>
      </section>
    </div>
  )
}
