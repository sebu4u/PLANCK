import { Metadata } from "next"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('privacy')

export default function ConfidentialitatePage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                        Privacy Policy – Planck
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Ultima actualizare: 18.01.2026
                    </p>

                    <div className="space-y-6 text-gray-700 dark:text-gray-300">
                        <p className="mb-4">
                            Planck („noi", „platforma", „serviciul") respectă confidențialitatea utilizatorilor săi și se angajează să protejeze datele cu caracter personal în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația aplicabilă din România.
                        </p>
                        <p className="mb-4">
                            Prin utilizarea platformei Planck, ești de acord cu practicile descrise în această Politică de Confidențialitate.
                        </p>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                1. Cine suntem
                            </h2>
                            <p className="mb-4">
                                Planck este o platformă educațională dedicată elevilor de liceu, cu accent pe fizică și discipline STEM.
                            </p>
                            <p className="mb-2 font-semibold">Operator de date:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Denumire:</strong> Planck</li>
                                <li><strong>Email de contact:</strong> <a href="mailto:contact@planck.academy" className="text-[hsl(348,83%,47%)] hover:underline">contact@planck.academy</a></li>
                                <li><strong>Țara:</strong> România</li>
                            </ul>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                2. Ce date colectăm
                            </h2>
                            <p className="mb-4">Putem colecta următoarele categorii de date:</p>

                            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">
                                2.1 Date furnizate direct de tine
                            </h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Nume și prenume</li>
                                <li>Adresă de email</li>
                                <li>Informații de profil educațional (clasă, interese academice)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">
                                2.2 Date colectate automat
                            </h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Adresă IP</li>
                                <li>Tipul dispozitivului și al browserului</li>
                                <li>Pagini accesate și acțiuni pe platformă</li>
                                <li>Cookie-uri și tehnologii similare</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">
                                2.3 Date de plată
                            </h3>
                            <p className="mb-4">
                                Planck <strong>nu stochează direct datele cardului</strong>. Plățile sunt procesate prin furnizori terți securizați (ex: Stripe). Aceștia pot colecta date necesare procesării plății.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                3. Scopul colectării datelor
                            </h2>
                            <p className="mb-4">Folosim datele tale pentru:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Crearea și administrarea contului</li>
                                <li>Oferirea accesului la cursuri și conținut educațional</li>
                                <li>Procesarea plăților și a abonamentelor</li>
                                <li>Comunicări legate de cont, funcționalități sau actualizări</li>
                                <li>Îmbunătățirea platformei și a experienței utilizatorilor</li>
                                <li>Respectarea obligațiilor legale</li>
                            </ul>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                4. Temeiul legal
                            </h2>
                            <p className="mb-4">Prelucrăm datele tale în baza:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Consimțământului tău</li>
                                <li>Executării unui contract (crearea și utilizarea contului)</li>
                                <li>Obligațiilor legale</li>
                                <li>Interesului legitim (securitate, prevenirea fraudei, analiză internă)</li>
                            </ul>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                5. Stocarea și securitatea datelor
                            </h2>
                            <p className="mb-4">
                                Datele sunt stocate pe servere securizate și sunt protejate prin măsuri tehnice și organizatorice adecvate (criptare, acces limitat, monitorizare).
                            </p>
                            <p>
                                Păstrăm datele doar atât timp cât este necesar scopurilor pentru care au fost colectate sau conform cerințelor legale.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                6. Partajarea datelor
                            </h2>
                            <p className="mb-4">
                                Nu vindem și nu închiriem datele tale personale.
                            </p>
                            <p className="mb-4">Putem partaja date doar cu:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Furnizori de servicii (hosting, plăți, analytics)</li>
                                <li>Autorități publice, dacă acest lucru este impus de lege</li>
                            </ul>
                            <p className="mt-4">
                                Toți partenerii respectă cerințe stricte de confidențialitate.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                7. Drepturile tale
                            </h2>
                            <p className="mb-4">Conform GDPR, ai următoarele drepturi:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Dreptul de acces la date</li>
                                <li>Dreptul la rectificare</li>
                                <li>Dreptul la ștergere („dreptul de a fi uitat")</li>
                                <li>Dreptul la restricționarea prelucrării</li>
                                <li>Dreptul la portabilitatea datelor</li>
                                <li>Dreptul de opoziție</li>
                                <li>Dreptul de a retrage consimțământul</li>
                                <li>Dreptul de a depune o plângere la ANSPDCP</li>
                            </ul>
                            <p className="mt-4">
                                Pentru exercitarea drepturilor, ne poți contacta la: <a href="mailto:contact@planck.academy" className="text-[hsl(348,83%,47%)] hover:underline">contact@planck.academy</a>
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                8. Cookie-uri
                            </h2>
                            <p className="mb-4">Planck folosește cookie-uri pentru:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Funcționarea corectă a platformei</li>
                                <li>Analiză și statistici</li>
                                <li>Îmbunătățirea experienței utilizatorului</li>
                            </ul>
                            <p className="mt-4">
                                Poți controla cookie-urile din setările browserului tău.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                9. Minori
                            </h2>
                            <p>
                                Platforma Planck este destinată elevilor. Dacă ai sub 14 ani, este recomandat acordul unui părinte sau tutore legal pentru crearea contului și utilizarea serviciilor.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                10. Modificări ale politicii
                            </h2>
                            <p>
                                Ne rezervăm dreptul de a actualiza această Politică de Confidențialitate. Orice modificare va fi afișată pe această pagină, cu actualizarea datei de revizie.
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <section>
                            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                                11. Contact
                            </h2>
                            <p className="mb-2">
                                Pentru întrebări sau solicitări legate de confidențialitate:
                            </p>
                            <p className="text-lg font-medium text-[hsl(348,83%,47%)]">
                                📧 Email: <a href="mailto:contact@planck.academy" className="hover:underline">contact@planck.academy</a>
                            </p>
                        </section>

                        <hr className="border-gray-200 dark:border-gray-700 my-8" />

                        <p className="text-center text-gray-600 dark:text-gray-400 italic">
                            Această Politică de Confidențialitate este valabilă pentru toate serviciile oferite prin platforma Planck.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
