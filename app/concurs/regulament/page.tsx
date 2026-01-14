import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RegulamentPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <ConcursNavbar />

            <main className="pt-32 pb-16 px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
                    <div className="mb-8">
                        <Link href="/concurs">
                            <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                                <ArrowLeft className="w-4 h-4" />
                                Înapoi la concurs
                            </Button>
                        </Link>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Regulament oficial<br />
                        <span className="text-2xl sm:text-3xl font-medium text-gray-600">Concursul Național de Fizică PLANCK</span>
                    </h1>

                    <section className="mb-8">
                        <h2>1. Dispoziții generale</h2>
                        <p>Concursul Național de Fizică PLANCK este o competiție educațională organizată online, dedicată elevilor de liceu din România, desfășurată integral pe platforma PLANCK.</p>
                        <p>Scopul concursului este evaluarea și stimularea gândirii logice, a înțelegerii conceptelor fundamentale de fizică și a capacității de rezolvare a problemelor, de la nivel standard până la nivel competițional.</p>
                        <p>Concursul se desfășoară în conformitate cu prezentul regulament. Participarea implică acceptarea integrală și necondiționată a tuturor regulilor de mai jos.</p>
                    </section>

                    <section className="mb-8">
                        <h2>2. Eligibilitate</h2>
                        <p>Pot participa la Concursul Național de Fizică PLANCK:</p>
                        <ul>
                            <li>elevii înscriși în clasele IX – XII, indiferent de profil;</li>
                            <li>elevii care dețin un cont valid pe platforma PLANCK;</li>
                            <li>elevii care finalizează înscrierea până la 20 februarie, inclusiv.</li>
                        </ul>
                        <p>Nu există taxă de participare (dacă ulterior se va introduce, acest aspect va fi anunțat explicit pe pagina concursului).</p>
                    </section>

                    <section className="mb-8">
                        <h2>3. Înscrierea în concurs</h2>
                        <h3 className="text-xl font-semibold mt-4 mb-2">3.1 Modalitatea de înscriere</h3>
                        <p>Înscrierea se realizează exclusiv online, prin intermediul platformei PLANCK.</p>
                        <p>După finalizarea înscrierii:</p>
                        <ul>
                            <li>fiecare participant va primi un cod unic de concurs;</li>
                            <li>codul este strict personal și netransmisibil;</li>
                            <li>codul va fi utilizat pentru accesul în probele de concurs.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-4 mb-2">3.2 Termen limită</h3>
                        <p>Data limită pentru înscriere este 20 februarie. După această dată, înscrierile vor fi închise automat.</p>
                    </section>

                    <section className="mb-8">
                        <h2>4. Structura concursului</h2>
                        <p>Concursul este organizat în două etape:</p>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 my-4">
                            <h4 className="font-bold text-lg mb-2">Etapa I – Probă grilă (online, asincron)</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>format:</strong> 30 de probleme tip grilă;</li>
                                <li><strong>durata:</strong> 2 ore;</li>
                                <li><strong>desfășurare:</strong> exclusiv pe platforma PLANCK;</li>
                                <li><strong>materia:</strong> conform programei afișate pe platformă, specifică fiecărei clase;</li>
                                <li><strong>acces:</strong> doar din contul cu care participantul s-a înscris la concurs.</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 my-4">
                            <h4 className="font-bold text-lg mb-2">Etapa a II-a – Probă de probleme (live)</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>format:</strong> 3 probleme de dificultate ridicată (stil olimpiadă);</li>
                                <li><strong>durata:</strong> 3 ore;</li>
                                <li><strong>desfășurare:</strong> live, pe Google Meet;</li>
                                <li><strong>condiție obligatorie:</strong> cameră video pornită pe toată durata probei.</li>
                            </ul>
                        </div>

                        <p>În Etapa a II-a se califică primii 30% dintre participanții fiecărei clase, în funcție de punctajul obținut la Etapa I.</p>
                        <p>Acest procent poate fi ajustat în cazul apariției egalităților de punctaj.</p>
                    </section>

                    <section className="mb-8">
                        <h2>5. Data concursului</h2>
                        <p>Data exactă a concursului va fi anunțată ulterior pe platforma PLANCK și prin canalele oficiale de comunicare.</p>
                        <p>Participanții au obligația de a verifica periodic informațiile afișate pe pagina concursului.</p>
                    </section>

                    <section className="mb-8">
                        <h2>6. Simularea tehnică</h2>
                        <p>Cu câteva zile înainte de concurs va fi organizată o simulare oficială pentru:</p>
                        <ul>
                            <li>testarea platformei;</li>
                            <li>verificarea funcționării sistemului anti-cheat;</li>
                            <li>familiarizarea participanților cu interfața de concurs.</li>
                        </ul>
                        <p>Participarea la simulare:</p>
                        <ul>
                            <li>nu este obligatorie;</li>
                            <li>nu influențează în niciun fel participarea sau rezultatele din concurs;</li>
                            <li>accesarea simulării din greșeală nu atrage nicio penalizare.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>7. Reguli de desfășurare – Etapa I</h2>
                        <h3 className="text-xl font-semibold mt-4 mb-2">7.1 Autentificare obligatorie</h3>
                        <p>Participanții trebuie să fie autentificați exclusiv în contul cu care s-au înscris;</p>
                        <p>accesarea probei dintr-un alt cont duce la imposibilitatea participării.</p>

                        <h3 className="text-xl font-semibold mt-4 mb-2">7.2 Sistem anti-cheat</h3>
                        <p>În timpul probei, platforma PLANCK utilizează sisteme de monitorizare și anti-cheat care detectează:</p>
                        <ul>
                            <li>accesarea materialelor ajutătoare (cursuri, lecții, notițe);</li>
                            <li>utilizarea instrumentelor AI;</li>
                            <li>comportamente suspecte sau tentative de fraudă.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-4 mb-2">7.3 Sancțiuni</h3>
                        <p>Orice abatere de la regulile de mai sus, inclusiv detectarea unor activități suspecte, va duce la:</p>
                        <ul>
                            <li>eliminarea imediată din concurs, inclusiv în timpul probei;</li>
                            <li>invalidarea punctajului obținut.</li>
                        </ul>
                        <p>Deciziile luate de organizatori în urma analizelor anti-cheat sunt definitive.</p>
                    </section>

                    <section className="mb-8">
                        <h2>8. Reguli de desfășurare – Etapa a II-a</h2>
                        <p>Pentru participanții calificați în Etapa a II-a:</p>
                        <ul>
                            <li>prezența la sesiunea Google Meet este obligatorie;</li>
                            <li>camera video trebuie să fie pornită permanent;</li>
                            <li>participantul trebuie să fie vizibil clar pe toată durata probei;</li>
                            <li>este interzisă comunicarea cu alte persoane;</li>
                            <li>este interzisă utilizarea oricăror materiale ajutătoare sau dispozitive nepermise.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-4 mb-2">Eliminare</h3>
                        <p>Orice încălcare a regulilor de mai sus duce la:</p>
                        <ul>
                            <li>eliminarea imediată din concurs;</li>
                            <li>anularea rezultatului obținut.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2>9. Evaluare și clasament</h2>
                        <ul>
                            <li>evaluarea se face automat (Etapa I) și manual (Etapa a II-a);</li>
                            <li>clasamentele sunt realizate separat pentru fiecare clasă;</li>
                            <li>rezultatele finale vor fi afișate pe platforma PLANCK.</li>
                        </ul>
                        <p>Organizatorii își rezervă dreptul de a verifica suplimentar orice rezultat suspect.</p>
                    </section>

                    <section className="mb-8">
                        <h2>10. Dispoziții finale</h2>
                        <ul>
                            <li>Organizatorii își rezervă dreptul de a modifica prezentul regulament, cu informarea prealabilă a participanților;</li>
                            <li>prin înscriere, participantul declară că a citit și a înțeles regulamentul;</li>
                            <li>nerespectarea regulamentului duce la excluderea din concurs.</li>
                        </ul>
                        <p>Pentru orice nelămuriri, informațiile oficiale vor fi comunicate exclusiv prin platforma PLANCK.</p>
                    </section>

                    <div className="mt-12 p-6 bg-orange-50 border border-orange-100 rounded-xl text-center">
                        <p className="font-bold text-lg text-gray-900">
                            Concursul Național de Fizică PLANCK este o competiție construită pe corectitudine, merit și înțelegere reală a fizicii.
                        </p>
                    </div>

                    <div className="mt-12 flex justify-center">
                        <Link href="/concurs">
                            <Button size="lg" className="gap-2 rounded-full">
                                <ArrowLeft className="w-4 h-4" />
                                Înapoi la concurs
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-12 bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-gray-900">PLANCK</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="/termeni" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Termeni și Condiții
                            </Link>
                            <Link href="/confidentialitate" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Politica de Confidențialitate
                            </Link>
                            <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Contact
                            </Link>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
