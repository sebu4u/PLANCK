"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import { BookOpen, FileText, FlaskConical, Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodingProblem, CodingProblemExample } from "./types"
import type { InformaticsContentDraft } from "@/lib/informatics-problem-content"
import { InformaticsBoilerplateEditor } from "./informatics-boilerplate-editor"
import { InformaticsTestsEditor } from "./informatics-tests-editor"
import { cn } from "@/lib/utils"

type ProblemContentTab = "enunt" | "hint1" | "hint2" | "solutie"

export type { ProblemContentTab }

interface ProblemStatementTabsListProps {
  showPremiumContent: boolean
  theme?: "dark" | "light"
  variant?: "inline" | "panel-header"
}

function ProblemTabTrigger({
  value,
  label,
  icon,
  iconClassName,
  showLock = false,
  triggerClass,
}: {
  value: ProblemContentTab
  label: string
  icon: ReactNode
  iconClassName?: string
  showLock?: boolean
  triggerClass: string
}) {
  return (
    <TabsTrigger value={value} className={triggerClass}>
      <span className={cn("shrink-0", iconClassName)}>{icon}</span>
      <span className="flex items-center gap-1.5">
        {label}
        {showLock ? <Lock className="h-3 w-3 shrink-0 opacity-55" aria-hidden /> : null}
      </span>
    </TabsTrigger>
  )
}

export function ProblemStatementTabsList({
  showPremiumContent,
  theme = "dark",
  variant = "inline",
}: ProblemStatementTabsListProps) {
  const isLight = theme === "light"
  const isPanelHeader = variant === "panel-header"

  const tabsListClass = isPanelHeader
    ? isLight
      ? "h-12 w-full justify-stretch gap-0 rounded-none border-0 border-b border-[#ece7f2] bg-[#ffffff] p-0"
      : "h-12 w-full justify-stretch gap-0 rounded-none border-0 border-b border-[#3a3a3a] bg-[#282828] p-0"
    : isLight
      ? "h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-[#ece7f2] bg-[#ffffff] p-1"
      : "h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-white/12 bg-[#161616] p-1"

  const tabsTriggerClass = isPanelHeader
    ? isLight
      ? "relative flex h-12 flex-1 items-center justify-center gap-2 rounded-none border-0 border-r border-[#ece7f2] bg-transparent px-3 text-sm font-normal text-[#8a8194] shadow-none last:border-r-0 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#111111] data-[state=active]:shadow-none"
      : "relative flex h-12 flex-1 items-center justify-center gap-2 rounded-none border-0 border-r border-[#3a3a3a] bg-transparent px-3 text-sm font-normal text-[#a3a3a3] shadow-none last:border-r-0 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-none"
    : isLight
      ? "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-normal text-[#8a8194] data-[state=active]:bg-[#f3eef8] data-[state=active]:font-semibold data-[state=active]:text-[#111111] data-[state=active]:shadow-none"
      : "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-normal text-white/55 data-[state=active]:bg-white/10 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-none"

  const iconSize = isPanelHeader ? "h-[18px] w-[18px]" : "h-4 w-4"
  const docIconClass = isLight ? "text-sky-500" : "text-sky-400"
  const bookIconClass = isLight ? "text-amber-600" : "text-amber-400/90"
  const flaskIconClass = isLight ? "text-sky-500" : "text-sky-400"

  return (
    <TabsList className={tabsListClass}>
      <ProblemTabTrigger
        value="enunt"
        label="Enunț"
        icon={<FileText className={iconSize} strokeWidth={2} />}
        iconClassName={docIconClass}
        triggerClass={tabsTriggerClass}
      />
      <ProblemTabTrigger
        value="hint1"
        label="Hint 1"
        icon={<BookOpen className={iconSize} strokeWidth={2} />}
        iconClassName={bookIconClass}
        triggerClass={tabsTriggerClass}
      />
      <ProblemTabTrigger
        value="hint2"
        label="Hint 2"
        icon={<BookOpen className={iconSize} strokeWidth={2} />}
        iconClassName={bookIconClass}
        showLock={!showPremiumContent}
        triggerClass={tabsTriggerClass}
      />
      <ProblemTabTrigger
        value="solutie"
        label="Soluție"
        icon={<FlaskConical className={iconSize} strokeWidth={2} />}
        iconClassName={flaskIconClass}
        showLock={!showPremiumContent}
        triggerClass={tabsTriggerClass}
      />
    </TabsList>
  )
}

interface ProblemStatementSectionProps {
  problem: CodingProblem
  examples: CodingProblemExample[]
  theme?: "dark" | "light"
  mode?: "view" | "edit"
  draft?: InformaticsContentDraft
  onDraftChange?: (patch: Partial<InformaticsContentDraft>) => void
  editDisabled?: boolean
  activeTab?: ProblemContentTab
  onActiveTabChange?: (tab: ProblemContentTab) => void
  /** `external` = tab bar is rendered by parent; this component outputs only tab panels. */
  tabsRootPlacement?: "internal" | "external"
}

function MarkdownBlock({
  content,
  className,
  textClass,
}: {
  content: string
  className: string
  textClass: string
}) {
  return (
    <ReactMarkdown
      className={cn("text-base leading-relaxed", textClass)}
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  )
}

function PremiumLockedPanel({ isLight }: { isLight: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-14 text-center",
        isLight ? "border-[#e7dff0] bg-[#faf8fc]" : "border-white/10 bg-white/[0.03]"
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full border",
          isLight ? "border-[#ded6e8] bg-white" : "border-white/15 bg-white/5"
        )}
      >
        <Lock className={cn("h-6 w-6", isLight ? "text-[#6f657b]" : "text-white/70")} />
      </div>
      <div className="space-y-2">
        <p className={cn("text-lg font-semibold", isLight ? "text-[#111111]" : "text-white")}>
          Conținut disponibil cu PLUS+ sau Premium
        </p>
        <p className={cn("max-w-sm text-sm", isLight ? "text-[#6f657b]" : "text-white/60")}>
          Fă upgrade la un plan plătit pentru a vedea acest hint sau soluția completă.
        </p>
      </div>
      <Button
        asChild
        className={cn(
          "rounded-full",
          isLight ? "bg-[#111111] text-white hover:bg-[#111111]/90" : "bg-white text-black hover:bg-white/90"
        )}
      >
        <Link href="/insight">Vezi PLANCK PLUS+</Link>
      </Button>
    </div>
  )
}

function EmptyTabPanel({ message, isLight }: { message: string; isLight: boolean }) {
  return (
    <p className={cn("text-sm", isLight ? "text-[#6f657b]" : "text-white/50")}>{message}</p>
  )
}

export function ProblemStatementSection({
  problem,
  examples,
  theme = "dark",
  mode = "view",
  draft,
  onDraftChange,
  editDisabled = false,
  activeTab: activeTabProp,
  onActiveTabChange,
  tabsRootPlacement = "internal",
}: ProblemStatementSectionProps) {
  const isLight = theme === "light"
  const isEdit = mode === "edit" && draft && onDraftChange
  const [internalActiveTab, setInternalActiveTab] = useState<ProblemContentTab>("enunt")
  const activeTab = activeTabProp ?? internalActiveTab
  const setActiveTab = onActiveTabChange ?? setInternalActiveTab
  const canAccessPremiumHints = problem.canAccessPremiumHints ?? false
  const showPremiumContent = Boolean(isEdit || canAccessPremiumHints)

  const textClass = isLight ? "text-[#2b2433]" : "text-white/80"
  const headingClass = isLight ? "text-[#111111]" : "text-white"
  const eyebrowClass = isLight ? "text-[#6f657b]" : "text-white/50"
  const sectionLabelClass = isLight
    ? "text-sm font-semibold text-[#111111]"
    : "text-sm font-semibold text-white"
  const sectionCardClass = isLight
    ? "rounded-2xl border border-[#ece7f2] bg-[#ffffff] px-4 py-3"
    : "rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
  const preClass = isLight
    ? "rounded-xl border border-[#ded6e8] bg-[#171421] p-4 font-mono text-sm text-[#f8f5ff] whitespace-pre-wrap"
    : "rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white/90 whitespace-pre-wrap"
  const editTextareaClass = isLight
    ? "min-h-[120px] border-gray-300 bg-white text-gray-900"
    : "min-h-[120px] border-white/20 bg-black/40 text-white/90"
  const editMonoTextareaClass = cn(editTextareaClass, "font-mono text-xs")

  const viewStatement = problem.statement_markdown
  const viewRequirement = problem.requirement_markdown
  const viewInputFormat = problem.input_format
  const viewOutputFormat = problem.output_format
  const viewConstraints = problem.constraints_markdown
  const viewSampleInput = problem.sample_input
  const viewSampleOutput = problem.sample_output
  const viewHint1 = isEdit ? draft!.hint_1_markdown : problem.hint_1_markdown
  const viewHint2 = isEdit ? draft!.hint_2_markdown : problem.hint_2_markdown
  const viewSolution = isEdit ? draft!.solution_markdown : problem.solution_markdown

  const showStatement = isEdit || Boolean(viewStatement?.trim())
  const showRequirement = isEdit || Boolean(viewRequirement)
  const showInputSection = isEdit || Boolean(viewInputFormat) || Boolean(viewSampleInput?.trim())
  const showOutputSection = isEdit || Boolean(viewOutputFormat) || Boolean(viewSampleOutput?.trim())
  const showConstraints = isEdit || Boolean(viewConstraints)

  const patchDraft = (patch: Partial<InformaticsContentDraft>) => {
    if (onDraftChange) onDraftChange(patch)
  }

  const renderMarkdownTab = (
    content: string | null | undefined,
    emptyMessage: string,
    editField?: keyof Pick<
      InformaticsContentDraft,
      "hint_1_markdown" | "hint_2_markdown" | "solution_markdown"
    >
  ) => {
    if (isEdit && editField) {
      return (
        <Textarea
          rows={10}
          disabled={editDisabled}
          className={editTextareaClass}
          value={draft![editField]}
          onChange={(e) => patchDraft({ [editField]: e.target.value })}
        />
      )
    }

    if (!content?.trim()) {
      return <EmptyTabPanel isLight={isLight} message={emptyMessage} />
    }

    return (
      <div className={sectionCardClass}>
        <MarkdownBlock content={content} className={sectionCardClass} textClass={textClass} />
      </div>
    )
  }

  const titleHeading = (
    <h1
      className={cn(
        "flex flex-wrap items-baseline gap-3 text-2xl font-bold leading-tight sm:text-3xl",
        headingClass
      )}
    >
      {typeof problem.numeric_id === "number" && (
        <span
          className={cn(
            "font-mono text-sm uppercase tracking-[0.3em]",
            isLight ? "text-[#8d7b9f]" : "text-white/50"
          )}
        >
          #{problem.numeric_id}
        </span>
      )}
      <span>{problem.title}</span>
    </h1>
  )

  const tabPanels = (
    <>
        <TabsContent value="enunt" className="mt-0 space-y-8">
          {showStatement && (
            <section className="space-y-2">
              <h2 className={cn(sectionLabelClass, headingClass)}>Enunț</h2>
              {isEdit ? (
                <Textarea
                  rows={6}
                  disabled={editDisabled}
                  className={editTextareaClass}
                  value={draft!.statement_markdown}
                  onChange={(e) => patchDraft({ statement_markdown: e.target.value })}
                />
              ) : (
                <div className={sectionCardClass}>
                  <MarkdownBlock content={viewStatement ?? ""} className={sectionCardClass} textClass={textClass} />
                </div>
              )}
            </section>
          )}

          {showRequirement && (
            <section className="space-y-2">
              <h2 className={cn(sectionLabelClass, headingClass)}>Cerință</h2>
              {isEdit ? (
                <Textarea
                  rows={4}
                  disabled={editDisabled}
                  className={editTextareaClass}
                  value={draft!.requirement_markdown}
                  onChange={(e) => patchDraft({ requirement_markdown: e.target.value })}
                />
              ) : (
                <div className={sectionCardClass}>
                  <MarkdownBlock content={viewRequirement ?? ""} className={sectionCardClass} textClass={textClass} />
                </div>
              )}
            </section>
          )}

          {showInputSection && (
            <section className="space-y-2">
              <h2 className={cn(sectionLabelClass, headingClass)}>Date de intrare</h2>
              {isEdit ? (
                <div className="space-y-3">
                  <Textarea
                    rows={4}
                    disabled={editDisabled}
                    className={editTextareaClass}
                    placeholder="Format intrare (markdown)"
                    value={draft!.input_format}
                    onChange={(e) => patchDraft({ input_format: e.target.value })}
                  />
                  <div>
                    <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Exemplu de intrare</div>
                    <Textarea
                      rows={4}
                      disabled={editDisabled}
                      className={editMonoTextareaClass}
                      value={draft!.sample_input}
                      onChange={(e) => patchDraft({ sample_input: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className={sectionCardClass}>
                  {viewInputFormat ? (
                    <MarkdownBlock content={viewInputFormat} className={sectionCardClass} textClass={textClass} />
                  ) : null}
                  {viewSampleInput?.trim() ? (
                    <div className={viewInputFormat ? "mt-4" : undefined}>
                      <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Exemplu de intrare</div>
                      <pre className={preClass}>{viewSampleInput}</pre>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {showOutputSection && (
            <section className="space-y-2">
              <h2 className={cn(sectionLabelClass, headingClass)}>Date de ieșire</h2>
              {isEdit ? (
                <div className="space-y-3">
                  <Textarea
                    rows={4}
                    disabled={editDisabled}
                    className={editTextareaClass}
                    placeholder="Format ieșire (markdown)"
                    value={draft!.output_format}
                    onChange={(e) => patchDraft({ output_format: e.target.value })}
                  />
                  <div>
                    <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Exemplu de ieșire</div>
                    <Textarea
                      rows={4}
                      disabled={editDisabled}
                      className={editMonoTextareaClass}
                      value={draft!.sample_output}
                      onChange={(e) => patchDraft({ sample_output: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className={sectionCardClass}>
                  {viewOutputFormat ? (
                    <MarkdownBlock content={viewOutputFormat} className={sectionCardClass} textClass={textClass} />
                  ) : null}
                  {viewSampleOutput?.trim() ? (
                    <div className={viewOutputFormat ? "mt-4" : undefined}>
                      <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Exemplu de ieșire</div>
                      <pre className={preClass}>{viewSampleOutput}</pre>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {showConstraints && (
            <section className="space-y-2">
              <h2 className={cn(sectionLabelClass, headingClass)}>Restricții</h2>
              {isEdit ? (
                <Textarea
                  rows={4}
                  disabled={editDisabled}
                  className={editTextareaClass}
                  value={draft!.constraints_markdown}
                  onChange={(e) => patchDraft({ constraints_markdown: e.target.value })}
                />
              ) : (
                <div className={sectionCardClass}>
                  <MarkdownBlock
                    content={viewConstraints ?? ""}
                    className={sectionCardClass}
                    textClass={textClass}
                  />
                </div>
              )}
            </section>
          )}

          {!isEdit && examples.length > 0 && (
            <Card
              className={cn(
                "rounded-2xl p-6",
                isLight
                  ? "border-[#e7dff0] bg-[#ffffff] shadow-[0_16px_40px_rgba(76,44,114,0.08)]"
                  : "border-white/10 bg-white/[0.03]"
              )}
            >
              <h2 className={cn("mb-4 text-lg font-semibold", headingClass)}>Exemple</h2>
              <div className="space-y-6">
                {examples.map((example, idx) => (
                  <div key={example.id} className="space-y-3">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        isLight ? "text-[#6f657b]" : "text-white/60"
                      )}
                    >
                      Exemplu {idx + 1}
                    </div>
                    {example.sample_input && (
                      <div>
                        <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Intrare</div>
                        <pre className={preClass}>{example.sample_input}</pre>
                      </div>
                    )}
                    {example.sample_output && (
                      <div>
                        <div className={cn("mb-2 text-xs font-semibold", eyebrowClass)}>Ieșire</div>
                        <pre className={preClass}>{example.sample_output}</pre>
                      </div>
                    )}
                    {example.explanation && (
                      <div
                        className={cn(
                          "rounded-lg border p-4",
                          isLight ? "border-[#cbd5ff] bg-[#eef2ff]" : "border-blue-500/20 bg-blue-500/10"
                        )}
                      >
                        <div
                          className={cn(
                            "mb-2 text-xs font-semibold",
                            isLight ? "text-[#4251b5]" : "text-blue-200"
                          )}
                        >
                          Explicație
                        </div>
                        <p className={cn("text-sm", isLight ? "text-[#293178]" : "text-blue-100/90")}>
                          {example.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {isEdit && (
            <>
              <InformaticsBoilerplateEditor
                theme={theme}
                disabled={editDisabled}
                boilerplateCpp={draft!.boilerplate_cpp}
                boilerplatePython={draft!.boilerplate_python}
                onChange={(patch) => patchDraft(patch)}
              />
              <InformaticsTestsEditor
                theme={theme}
                disabled={editDisabled}
                tests={draft!.tests}
                onChange={(tests) => patchDraft({ tests })}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="hint1" className="mt-0">
          {renderMarkdownTab(viewHint1, "Nu există încă un prim hint pentru această problemă.", "hint_1_markdown")}
        </TabsContent>

        <TabsContent value="hint2" className="mt-0">
          {showPremiumContent
            ? renderMarkdownTab(viewHint2, "Nu există încă un al doilea hint pentru această problemă.", "hint_2_markdown")
            : <PremiumLockedPanel isLight={isLight} />}
        </TabsContent>

        <TabsContent value="solutie" className="mt-0">
          {showPremiumContent
            ? renderMarkdownTab(viewSolution, "Nu există încă o soluție publicată pentru această problemă.", "solution_markdown")
            : <PremiumLockedPanel isLight={isLight} />}
        </TabsContent>
    </>
  )

  return (
    <div className="space-y-8">
      {titleHeading}
      {tabsRootPlacement === "internal" ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProblemContentTab)}
          className="space-y-6"
        >
          <ProblemStatementTabsList
            showPremiumContent={showPremiumContent}
            theme={theme}
            variant="inline"
          />
          {tabPanels}
        </Tabs>
      ) : (
        tabPanels
      )}
    </div>
  )
}
