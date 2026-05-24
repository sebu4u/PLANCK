# SEO & LLMO Optimization — Planck Academy

## Positioning (2026)

**Primary message:** Platformă care te ajută să obții nota dorită la clasă, BAC sau admitere.

**Flagship product:** Trasee de învățare (`/invata`) — clase 9–12, toate materiile.

**Proof points:**
- 10.000+ grile rezolvate
- 800+ probleme rezolvate video
- Conținut verificat de profesori din toată țara
- 100+ testimoniale (elevi, părinți, profesori)

**Single source of truth:** [`lib/platform-marketing.ts`](../lib/platform-marketing.ts)

---

## Implementări SEO

### 1. Metadata (`lib/metadata.ts`)

- Base metadata importă din `platform-marketing.ts`
- Pagini cheie: `home`, `learning-paths`, `grile`, `coding-problems`, `planckcode` (C++ & Python)
- Open Graph + Twitter Cards pe toate paginile importante

### 2. Structured Data (`lib/structured-data.ts`)

- `EducationalOrganization` — trasee, grile, Insight, Sketch, PlanckCode
- `WebSite` — SearchAction + ReadAction spre `/invata`
- `ItemList` — hub trasee (`learningPathsHubStructuredData`)
- `FAQPage` — homepage (`homepageFaqStructuredData` din `FAQ_ITEMS`)
- `AboutPage`, `LearningResource` per produs

### 3. Sitemap (`app/sitemap.ts`)

Indexează:
- `/invata` (priority 0.95)
- Lecții trasee dinamice din Supabase
- `/grile`, `/matematica/probleme`, `/informatica/probleme`, `/simulari-bac`
- Probleme, cursuri, produse

### 4. Robots (`app/robots.ts`)

- Permite crawleri AI: GPTBot, ClaudeBot, CCBot
- Sitemap: `https://www.planck.academy/sitemap.xml`

### 5. LLMO (`public/llms.txt`)

- Fișier extins (~150+ linii) cu positioning, produse, URL-uri, cifre
- Link discovery: `<link rel="alternate" type="text/plain" href="/llms.txt" />` în `app/layout.tsx`

---

## Pagini cu metadata

| Pagină | Cheie metadata |
|--------|----------------|
| `/` | `home` |
| `/invata` | `learning-paths` |
| `/grile` | `grile` |
| `/probleme` | `problems` |
| `/cursuri` | `physics-lessons` |
| `/matematica/probleme` | `math-problems` |
| `/informatica/probleme` | `coding-problems` |
| `/simulari-bac` | `bac-simulations` |
| `/planckcode` | `planckcode` |
| `/planckcode/ide` | `planckcode-ide` |
| `/insight` | `insight` |
| `/despre` | `about` |
| `/pricing` | `pricing` |

---

## Conținut crawlable pentru LLM-uri

- `/invata` — bloc SEO (`InvataSeoIntro`) sub lista de trasee
- `/despre` — misiune și stats actualizate
- Homepage FAQ — întrebări BAC/admitere/trasee/profesori
- `llms.txt` — context complet pentru AI crawlers

---

## Checklist validare post-deploy

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — Organization, FAQ, ItemList
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — OG pe `/` și `/invata`
- [ ] Fetch `https://www.planck.academy/llms.txt`
- [ ] Google Search Console — resubmit sitemap
- [ ] Verificare titluri indexate după 2–4 săptămâni

---

## Keywords principale

- nota bac, pregatire bac, admitere medicina, admitere politehnica
- trasee invatare, clasa 9 10 11 12
- grile fizica, probleme rezolvate video
- continut verificat profesori
- IDE C++ Python online

---

## Note

- Nu folosi AggregateRating Google până există catalog verificabil de recenzii
- Cifrele din marketing trebuie validate periodic în producție (`quiz_questions`, probleme video)
- Copy-ul „toată materia” reflectă capitolele reale din DB (fizică, mate, info, bio)
