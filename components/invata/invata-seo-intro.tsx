import {
  LEARNING_PATHS_DESCRIPTION,
  LEARNING_PATHS_GRADES_LABEL,
  LEARNING_PATHS_SUBJECTS_LABEL,
  QUIZ_COUNT_LABEL,
  VIDEO_SOLUTIONS_LABEL,
  TEACHER_VERIFICATION,
  TESTIMONIALS_LABEL,
} from "@/lib/platform-marketing"

export function InvataSeoIntro() {
  return (
    <section
      className="mt-10 rounded-2xl border border-[#e8e8e8] bg-[#fafafa] px-5 py-6 sm:px-8 sm:py-8"
      aria-label="Despre traseele de învățare Planck"
    >
      <h2 className="text-lg font-semibold text-[#111111] sm:text-xl">
        Trasee de învățare pentru nota dorită la clasă, BAC sau admitere
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#555555] sm:text-base">
        <p>{LEARNING_PATHS_DESCRIPTION}</p>
        <p>
          Acoperim {LEARNING_PATHS_GRADES_LABEL} la {LEARNING_PATHS_SUBJECTS_LABEL}. Fiecare traseu
          combină lecții video, {QUIZ_COUNT_LABEL.toLowerCase()}, {VIDEO_SOLUTIONS_LABEL.toLowerCase()}{" "}
          și teste — tot ce ai nevoie pentru a-ți atinge obiectivul, fie că e vorba de o notă mai
          bună la clasă, de BAC sau de admitere.
        </p>
        <p>
          {TEACHER_VERIFICATION}. {TESTIMONIALS_LABEL} confirmă progresul real al elevilor pe
          platformă.
        </p>
      </div>
    </section>
  )
}
