import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('terms')

export default function TermeniPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-8">
            Termeni și Condiții – Planck
          </h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                1. Informații generale
              </h2>
              <p className="mb-4">
                Site-ul Planck (denumit în continuare „Platforma") este deținut și administrat de Miturca Sebastian-Valentin. Prin accesarea și utilizarea Platformei, orice persoană care vizitează sau își creează cont (denumită în continuare „Utilizator") acceptă în mod expres acești Termeni și Condiții.
              </p>
              <p>
                Dacă nu ești de acord cu acești termeni, te rugăm să nu folosești Platforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                2. Definiții
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Platformă / Site</strong> – website-ul Planck și toate serviciile digitale aferente.</li>
                <li><strong>Utilizator</strong> – orice persoană care accesează sau își creează un cont pe Platformă.</li>
                <li><strong>Cont</strong> – profilul personal creat de Utilizator pentru accesarea resurselor Platformei.</li>
                <li><strong>Conținut educațional</strong> – materiale video, cursuri, probleme rezolvate, articole și alte resurse puse la dispoziție prin Planck.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                3. Scopul Platformei
              </h2>
              <p className="mb-4">
                Planck are scop exclusiv educațional și oferă resurse menite să sprijine procesul de învățare al elevilor și profesorilor în domeniul fizicii.
              </p>
              <p>
                Platforma nu garantează obținerea unor rezultate școlare sau academice specifice (de exemplu: promovarea unui examen sau calificarea la o competiție), ci reprezintă un instrument de învățare suplimentar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                4. Crearea și utilizarea contului
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pentru a beneficia de toate funcționalitățile, Utilizatorul trebuie să creeze un cont, furnizând date reale și complete.</li>
                <li>Utilizatorul este responsabil pentru păstrarea confidențialității datelor de autentificare și pentru activitățile desfășurate prin contul său.</li>
                <li>Administratorii Platformei au dreptul de a suspenda sau șterge conturile care încalcă acești Termeni, utilizează abuziv serviciile sau aduc prejudicii Platformei ori altor Utilizatori.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                5. Drepturi de proprietate intelectuală
              </h2>
              <p className="mb-4">
                Toate materialele publicate pe Platformă – inclusiv, dar fără a se limita la: texte, probleme, rezolvări, materiale video, logo, elemente grafice și software – sunt proprietatea exclusivă a deținătorului Platformei și sunt protejate de legislația privind drepturile de autor.
              </p>
              <p>
                Este interzisă copierea, distribuirea, reproducerea sau folosirea conținutului în alte scopuri decât cele personale și educaționale, fără acordul scris al administratorului Planck.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                6. Plăți și abonamente
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Accesul la anumite materiale sau funcționalități poate necesita plata unui abonament sau a unei taxe.</li>
                <li>Plata se face prin metodele disponibile pe Platformă.</li>
                <li>În cazul în care nu este achitată taxa de abonament, accesul la resursele premium va fi suspendat.</li>
                <li>Politica de rambursare, dacă este disponibilă, va fi specificată clar în secțiunea corespunzătoare de pe site.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                7. Limitarea răspunderii
              </h2>
              <p className="mb-4">
                Platforma este furnizată „ca atare", fără garanții de funcționare neîntreruptă sau lipsă totală de erori.
              </p>
              <p className="mb-2">Administratorii Planck nu răspund pentru:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>utilizarea incorectă a materialelor;</li>
                <li>erori tehnice sau întreruperi independente de voința lor;</li>
                <li>pierderi de date sau rezultate obținute ca urmare a interpretării greșite a informațiilor.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                8. Confidențialitate și protecția datelor
              </h2>
              <p className="mb-4">
                Planck respectă confidențialitatea și protejează datele personale ale Utilizatorilor conform legislației în vigoare (Regulamentul GDPR).
              </p>
              <p>
                Pentru detalii complete, te rugăm să consulți Politica de Confidențialitate, disponibilă pe Platformă.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                9. Modificări ale termenilor
              </h2>
              <p>
                Administratorii Planck își rezervă dreptul de a modifica oricând acești Termeni și Condiții. Versiunea actualizată va fi publicată pe site și va intra în vigoare de la data publicării. Continuarea utilizării Platformei după modificări implică acceptarea noilor termeni.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                10. Legea aplicabilă și jurisdicția
              </h2>
              <p>
                Acești Termeni și Condiții sunt guvernați de legislația română. Orice dispută va fi soluționată de instanțele competente din România.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                11. Contact
              </h2>
              <p className="mb-2">
                Pentru întrebări, sesizări sau solicitări legate de Platformă, ne poți contacta la:
              </p>
              <p className="text-lg font-medium text-[hsl(348,83%,47%)]">
                📧 contact@planck.academy
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
