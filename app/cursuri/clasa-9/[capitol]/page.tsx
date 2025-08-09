import { clasa9ChaptersLessons } from "../clasa9-chapters-lessons";
import { Navigation } from "@/components/navigation";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Link from "next/link";

// Titlurile capitolelor, în ordinea corectă
const chapterTitles = [
  "Cinematica punctului material",
  "Dinamica punctului material",
  "Lucrul mecanic și energia",
  "Impulsul și legea conservării",
  "Optica geometrică",
  "Statica și echilibru",
];

export default async function CapitolPage({ params }: { params: { capitol: string } }) {
  const chapterIndex = parseInt(params.capitol) - 1;
  const lessons = clasa9ChaptersLessons[chapterIndex] || [];
  const chapterTitle = chapterTitles[chapterIndex] || `Capitolul ${params.capitol}`;
  // progres: 0% dacă nicio lecție, 100% dacă toate, altfel 0 (placeholder)
  const progress = lessons.length > 0 ? 0 : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-20 max-w-7xl mx-auto px-4">
        {/* Titlu și progres */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{chapterTitle}</h1>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="w-full max-w-md" />
            <span className="text-sm text-gray-500">{progress}% complet</span>
          </div>
        </div>
        {/* Layout principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar lecții */}
          <aside className="md:col-span-1">
            <Accordion type="single" defaultValue="lectii" collapsible>
              <AccordionItem value="lectii">
                <AccordionTrigger className="text-lg font-semibold">Lecțiile capitolului</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {lessons.map((lesson, idx) => (
                      <li key={idx}>
                        <button className="w-full text-left px-3 py-2 rounded hover:bg-purple-100 transition font-medium text-purple-800 flex items-center gap-2">
                          <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                            {params.capitol}.{idx + 1}
                          </span>
                          <span>{lesson}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>
          {/* Conținut video/lecție */}
          <main className="md:col-span-2 bg-purple-50 rounded-2xl p-8 min-h-[300px] flex flex-col items-center justify-center">
            <div className="text-gray-400 italic text-center">
              Selectează o lecție din stânga pentru a vedea conținutul video aici.<br />
              (Aici va apărea video-ul sau conținutul lecției selectate)
            </div>
          </main>
        </div>
        <div className="mt-8">
          <Link href="/cursuri/clasa-9" className="text-purple-600 hover:underline">&larr; Înapoi la capitole</Link>
        </div>
      </div>
    </div>
  );
}

export const dynamicParams = true; 