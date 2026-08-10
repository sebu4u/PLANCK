'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LatexRichText } from '@/components/classrooms/latex-rich-text'
import { FillSlotFormula, FillSlotLatex } from '@/components/invata/fill-slot-formula'
import {
  FILL_SLOT_CHIP_DRAG_MIME,
  FILL_SLOT_CHIP_SELECTED,
  buildFillSlotLatex,
} from '@/lib/fill-slot-latex'
import {
  evaluateInteractiveAnswer,
  formatInteractiveCorrectAnswer,
  type InsightInteractiveFormula,
  type InsightInteractivePayload,
  type InsightInteractiveResult,
} from '@/lib/insight-interactive'

const LATEX_INHERIT = 'break-words [&_.katex]:text-inherit'

type InsightInteractiveWidgetProps = {
  payload: InsightInteractivePayload
  light?: boolean
  disabled?: boolean
  initialResult?: InsightInteractiveResult | null
  onResolved: (result: InsightInteractiveResult) => void
}

const MCQ_LETTERS = ['A', 'B', 'C', 'D'] as const

function FormulaFillSlotWidget({
  payload,
  light,
  locked,
  result,
  onResolve,
}: {
  payload: InsightInteractiveFormula
  light: boolean
  locked: boolean
  result: InsightInteractiveResult | null
  onResolve: (assign: Record<string, string | null>) => void
}) {
  const slotIds = useMemo(() => payload.slots.map((slot) => slot.id), [payload.slots])
  const [assign, setAssign] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(slotIds.map((id) => [id, null]))
  )
  const [active, setActive] = useState<string | null>(slotIds[0] ?? null)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const chipSet = useMemo(() => new Set(payload.chips.map((chip) => chip.trim())), [payload.chips])
  const verifyResult: 'ok' | 'bad' | null = result
    ? result.correct
      ? 'ok'
      : 'bad'
    : null

  const renderedLatex = useMemo(
    () => buildFillSlotLatex(payload.latexTemplate, assign, active, verifyResult, payload.slots),
    [payload.latexTemplate, assign, active, verifyResult, payload.slots]
  )

  const used = new Set(Object.values(assign).filter(Boolean) as string[])
  const allFilled = slotIds.length > 0 && slotIds.every((id) => Boolean(assign[id]))

  const placeChipInSlot = (chip: string, slotId: string) => {
    const trimmed = chip.trim()
    if (!trimmed || !chipSet.has(trimmed) || locked) return
    setSelectedChip(trimmed)
    setAssign((prev) => {
      const next: Record<string, string | null> = { ...prev }
      for (const id of slotIds) {
        if (next[id] === trimmed) next[id] = null
      }
      next[slotId] = trimmed
      return next
    })
    setActive(slotId)
  }

  const chipCardBase = light
    ? 'rounded-lg border-[2.5px] bg-white px-2 py-1.5 text-center transition-[border-color,box-shadow,opacity] shadow-[0_3px_0_#9d8ab3] border-[#cfc3dc]'
    : 'rounded-lg border-[2.5px] bg-[#1f1f1f] px-2 py-1.5 text-center transition-[border-color,box-shadow,opacity] shadow-[0_3px_0_#3b3b3b] border-white/20'

  return (
    <div className="space-y-3">
      <FillSlotFormula
        latex={renderedLatex}
        slotIds={slotIds}
        autoResult={verifyResult}
        dragOverSlot={dragOverSlot}
        onSelectSlot={(slotId) => {
          if (locked) return
          setActive(slotId)
          setSelectedChip(assign[slotId] ?? null)
        }}
        onDropChip={placeChipInSlot}
        setDragOverSlot={setDragOverSlot}
        interactive={!locked}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {payload.chips.map((chip) => {
          const taken = used.has(chip)
          return (
            <button
              type="button"
              key={chip}
              draggable={!locked}
              disabled={locked}
              onDragStart={(e) => {
                setSelectedChip(chip.trim())
                e.dataTransfer.setData(FILL_SLOT_CHIP_DRAG_MIME, chip)
                e.dataTransfer.setData('text/plain', chip)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => setDragOverSlot(null)}
              onClick={() => {
                if (locked || !active) return
                setSelectedChip(chip)
                placeChipInSlot(chip, active)
              }}
              className={cn(
                chipCardBase,
                'min-w-[3.25rem] max-w-[7rem] shrink-0 touch-manipulation select-none',
                !locked && 'cursor-grab active:cursor-grabbing hover:border-[#a898bc]',
                locked && 'cursor-not-allowed opacity-60',
                taken && !selectedChip && 'opacity-90',
                selectedChip === chip && FILL_SLOT_CHIP_SELECTED
              )}
            >
              <FillSlotLatex content={chip} className={light ? 'text-[#1a1423]' : 'text-white'} />
            </button>
          )
        })}
      </div>

      {!result ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={locked || !allFilled}
            onClick={() => onResolve(assign)}
            className={cn(
              'h-10 rounded-xl px-4',
              light
                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            Verifică
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function InsightInteractiveWidget({
  payload,
  light = true,
  disabled = false,
  initialResult = null,
  onResolved,
}: InsightInteractiveWidgetProps) {
  const [result, setResult] = useState<InsightInteractiveResult | null>(initialResult)
  const [numericValue, setNumericValue] = useState('')

  const locked = Boolean(result) || disabled

  const resolve = (answer: unknown) => {
    if (locked) return
    const evaluated = evaluateInteractiveAnswer(payload, answer)
    if (!evaluated) return
    setResult(evaluated)
    onResolved(evaluated)
  }

  const shellClass = cn(
    'mt-3 rounded-2xl border p-3.5',
    light ? 'border-[#0b0d10]/12 bg-[#f8fafc]' : 'border-white/10 bg-white/5',
    result?.correct === true && (light ? 'border-emerald-400/60 bg-emerald-50/80' : 'border-emerald-400/40'),
    result?.correct === false && (light ? 'border-rose-300/70 bg-rose-50/70' : 'border-rose-400/40')
  )

  const promptClass = cn(
    'mb-3 text-sm font-medium leading-relaxed',
    light ? 'text-[#111827]' : 'text-white/90'
  )

  const mutedClass = cn('text-xs leading-relaxed', light ? 'text-[#4b5563]' : 'text-white/55')

  return (
    <div className={shellClass} role="group" aria-label="Verificare interactivă">
      <div className={promptClass}>
        <LatexRichText content={payload.prompt} className={LATEX_INHERIT} />
      </div>

      {payload.type === 'numeric' && (
        <div className="flex flex-col gap-2">
          <div className="relative min-w-0 w-full">
            <Input
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              disabled={locked}
              placeholder="Introdu valoarea"
              inputMode="decimal"
              className={cn(
                'h-10',
                light
                  ? 'border-[#0b0d10]/15 bg-white text-[#111827]'
                  : 'border-white/15 bg-[#1a1a1a] text-white'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  resolve(numericValue)
                }
              }}
            />
            {payload.unit?.trim() ? (
              <span
                className={cn(
                  'pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs',
                  light ? 'text-[#6b7280]' : 'text-white/45'
                )}
              >
                <LatexRichText content={payload.unit.trim()} className={LATEX_INHERIT} />
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={locked || !numericValue.trim()}
            onClick={() => resolve(numericValue)}
            className={cn(
              'h-10 w-full rounded-xl px-4',
              light
                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            Verifică
          </Button>
        </div>
      )}

      {payload.type === 'mcq' && (
        <div className="grid gap-2">
          {payload.options.map((option, index) => {
            const selected =
              result && result.userAnswerLabel.startsWith(`${MCQ_LETTERS[index]})`)
            const isCorrectOption = result && index === payload.correctIndex
            return (
              <button
                key={`${MCQ_LETTERS[index]}-${option}`}
                type="button"
                disabled={locked}
                onClick={() => resolve(index)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition active:scale-[0.99]',
                  light
                    ? 'border-[#0b0d10]/12 bg-white text-[#111827] hover:border-[#0b0d10]/25'
                    : 'border-white/10 bg-white/5 text-white/90 hover:border-white/25',
                  locked && 'cursor-default opacity-90',
                  selected &&
                    result?.correct &&
                    (light ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-400'),
                  selected &&
                    result &&
                    !result.correct &&
                    (light ? 'border-rose-400 bg-rose-50' : 'border-rose-400'),
                  isCorrectOption &&
                    result &&
                    !result.correct &&
                    (light ? 'border-emerald-400/70' : 'border-emerald-400/50')
                )}
              >
                <span className={cn('mr-2 font-semibold', light ? 'text-[#6b7280]' : 'text-white/50')}>
                  {MCQ_LETTERS[index]}.
                </span>
                <LatexRichText content={option} className={cn('inline', LATEX_INHERIT)} />
              </button>
            )
          })}
        </div>
      )}

      {payload.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((value) => {
            const label = value ? 'Adevărat' : 'Fals'
            const selected = result?.userAnswerLabel === label
            const isCorrectOption = result && value === payload.correct
            return (
              <button
                key={label}
                type="button"
                disabled={locked}
                onClick={() => resolve(value)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition active:scale-[0.99]',
                  light
                    ? 'border-[#0b0d10]/12 bg-white text-[#111827] hover:border-[#0b0d10]/25'
                    : 'border-white/10 bg-white/5 text-white/90 hover:border-white/25',
                  selected &&
                    result?.correct &&
                    (light ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-400'),
                  selected &&
                    result &&
                    !result.correct &&
                    (light ? 'border-rose-400 bg-rose-50' : 'border-rose-400'),
                  isCorrectOption &&
                    result &&
                    !result.correct &&
                    (light ? 'border-emerald-400/70' : 'border-emerald-400/50')
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {payload.type === 'formula' && (
        <FormulaFillSlotWidget
          payload={payload}
          light={light}
          locked={locked}
          result={result}
          onResolve={resolve}
        />
      )}

      {result ? (
        <div className="mt-3 space-y-1">
          <div
            className={cn(
              'text-sm font-medium',
              result.correct
                ? light
                  ? 'text-emerald-700'
                  : 'text-emerald-300'
                : light
                  ? 'text-rose-700'
                  : 'text-rose-300'
            )}
          >
            <LatexRichText
              content={result.correct ? payload.feedbackCorrect : payload.feedbackWrong}
              className={LATEX_INHERIT}
            />
          </div>
          {!result.correct ? (
            <div className={mutedClass}>
              Răspuns corect:{' '}
              {payload.type === 'formula' ? (
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {payload.slots.map((slot, i) => (
                    <span key={slot.id} className="inline-flex items-baseline gap-0.5">
                      {i > 0 ? <span aria-hidden>, </span> : null}
                      <span>{slot.id}=</span>
                      <FillSlotLatex content={slot.answer} className={LATEX_INHERIT} />
                    </span>
                  ))}
                </span>
              ) : (
                <LatexRichText
                  content={formatInteractiveCorrectAnswer(payload)}
                  className={cn('inline', LATEX_INHERIT)}
                />
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
