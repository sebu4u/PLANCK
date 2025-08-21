# Sistem de Gamification - Configurare

Acest document explică cum să configurezi sistemul de gamification pentru badge-uri în platforma PLANCK.

## 🎯 Funcționalități

Sistemul de gamification include:

- **Badge-uri progresive** bazate pe numărul de probleme rezolvate
- **Notificări vizuale** când utilizatorul câștigă un badge nou
- **Afișare pe profil** cu toate badge-urile câștigate
- **Progres vizual** către următorul badge

## 🏆 Badge-urile disponibile

| Badge | Icon | Probleme necesare | Descriere |
|-------|------|-------------------|-----------|
| Începător | 🌱 | 1 | Ai rezolvat prima ta problemă! |
| Novice Fizician | 🔬 | 5 | Ai rezolvat 5 probleme! |
| Apprentice | 📚 | 10 | Ai rezolvat 10 probleme! |
| Problema Buster | 💪 | 25 | Ai rezolvat 25 de probleme! |
| Cercetător Junior | 🔍 | 50 | Ai rezolvat 50 de probleme! |
| Experimentator | 🧪 | 100 | Ai rezolvat 100 de probleme! |
| Maestru al problemelor | 👑 | 200 | Ai rezolvat 200 de probleme! |
| Fizician Expert | ⚡ | 300 | Ai rezolvat 300 de probleme! |
| Omul de știință | 🔬 | 400 | Ai rezolvat 400 de probleme! |
| Legendă PLANCK | 🌟 | 500 | Ai rezolvat 500 de probleme! |

## 🚀 Configurare

### Pasul 1: Configurare baza de date

1. Mergi la **Supabase Dashboard**
2. Deschide **SQL Editor**
3. Copiază și rulează conținutul din `supabase/badges-system.sql`

Sau rulează scriptul automat:

```bash
node scripts/setup-badges.js
```

### Pasul 2: Verificare configurare

După rularea migrației, verifică că:

1. Tabela `badges` există și conține toate badge-urile
2. Tabela `user_badges` există pentru a stoca badge-urile câștigate
3. Funcția `check_and_award_badges` există
4. Trigger-ul `on_problem_solved` este activ

### Pasul 3: Acordare badge-uri pentru utilizatorii existenți

Pentru utilizatorii care au deja probleme rezolvate, rulează:

```bash
node scripts/award-existing-badges.js
```

Acest script va:
- Găsi toți utilizatorii cu probleme rezolvate
- Verifica și acorda badge-urile corespunzătoare
- Afișa statistici despre badge-urile acordate

### Pasul 4: Testare

1. Autentifică-te în aplicație
2. Rezolvă o problemă (marchează-o ca rezolvată)
3. Verifică că primești badge-ul "Începător"
4. Verifică profilul pentru a vedea badge-ul afișat

## 📁 Structura fișierelor

```
├── supabase/
│   └── badges-system.sql          # Migrația pentru sistemul de badge-uri
├── components/
│   └── user-badges.tsx            # Component pentru afișarea badge-urilor
├── app/
│   ├── profil/page.tsx            # Pagina de profil (actualizată)
│   └── probleme/[id]/ProblemDetailClient.tsx  # Logica de acordare badge-uri
├── scripts/
│   ├── setup-badges.js            # Script de configurare
│   └── award-existing-badges.js   # Script pentru utilizatorii existenți
└── docs/
    └── GAMIFICATION_SETUP.md      # Această documentație
```

## 🔧 Funcționare

### Logica de acordare badge-uri

1. Când un utilizator marchează o problemă ca rezolvată, se inserează în `solved_problems`
2. Trigger-ul `on_problem_solved` se declanșează automat
3. Funcția `check_and_award_badges` verifică dacă utilizatorul îndeplinește condițiile pentru badge-uri noi
4. Badge-urile noi sunt inserate în `user_badges`

### Afișare badge-uri

- **Pe profil**: Componentul `UserBadges` afișează toate badge-urile câștigate
- **Notificare**: Când se câștigă un badge nou, apare o notificare vizuală
- **Progres**: Se afișează progresul către următorul badge

## 🎨 Personalizare

### Adăugare badge-uri noi

Pentru a adăuga badge-uri noi, editează `supabase/badges-system.sql`:

```sql
INSERT INTO public.badges (name, description, icon, required_problems, color) 
VALUES ('Nume Badge', 'Descriere badge', '🎯', 1000, 'bg-purple-500');
```

### Modificare culori

Culorile badge-urilor folosesc clasele Tailwind CSS. Poți modifica:

- `bg-green-500` - Verde
- `bg-blue-500` - Albastru
- `bg-purple-500` - Violet
- `bg-orange-500` - Portocaliu
- `bg-pink-500` - Roz
- etc.

### Modificare iconițe

Iconițele sunt emoji-uri Unicode. Poți folosi orice emoji disponibil:

- 🌱🌿🍀 - Pentru începători
- 🔬⚗️🧪 - Pentru știință
- 📚📖🎓 - Pentru învățare
- 💪🏆👑 - Pentru realizări
- ⚡🌟✨ - Pentru expertiză

## 🐛 Depanare

### Badge-urile nu se acordă

1. Verifică că trigger-ul `on_problem_solved` există
2. Verifică că funcția `check_and_award_badges` funcționează
3. Verifică log-urile Supabase pentru erori

### Badge-urile nu se afișează

1. Verifică că tabelele `badges` și `user_badges` există
2. Verifică că RLS policies sunt configurate corect
3. Verifică că utilizatorul este autentificat

### Erori de permisiuni

1. Verifică că RLS policies permit accesul utilizatorilor la badge-uri
2. Verifică că utilizatorul are permisiuni pentru a vedea propriile badge-uri

## 📈 Monitorizare

Pentru a monitoriza utilizarea sistemului:

```sql
-- Numărul total de badge-uri acordate
SELECT COUNT(*) FROM user_badges;

-- Badge-urile cele mai populare
SELECT b.name, COUNT(*) as count 
FROM user_badges ub 
JOIN badges b ON ub.badge_id = b.id 
GROUP BY b.id, b.name 
ORDER BY count DESC;

-- Utilizatorii cu cele mai multe badge-uri
SELECT u.email, COUNT(*) as badge_count 
FROM user_badges ub 
JOIN auth.users u ON ub.user_id = u.id 
GROUP BY u.id, u.email 
ORDER BY badge_count DESC;
```
