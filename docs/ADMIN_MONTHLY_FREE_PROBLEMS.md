# Administrare Probleme Gratuite Lunare

Acest document explică cum să configurezi și să folosești sistemul de administrare pentru selecția manuală a problemelor gratuite lunare.

## Configurare Inițială

### 1. Rulare Migrație SQL

Rulează migrația SQL pentru a crea tabelul necesar:

```sql
-- Rulează fișierul: supabase/monthly-free-problems.sql
```

Sau rulează direct în Supabase SQL Editor:

```sql
create table if not exists public.monthly_free_problems (
  id uuid primary key default gen_random_uuid(),
  month_key text not null,
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique(month_key, problem_id)
);
```

### 2. Configurare Admin

Există trei moduri de a configura un utilizator ca admin:

#### Opțiunea 1: Email-uri în variabilă de mediu (Recomandat)

Adaugă în `.env` sau `.env.local`:

```env
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

Email-urile trebuie separate prin virgulă.

#### Opțiunea 2: app_metadata în Supabase

În Supabase Dashboard, pentru utilizatorul dorit:
1. Mergi la Authentication > Users
2. Selectează utilizatorul
3. Editează `app_metadata` și adaugă:
   ```json
   {
     "role": "admin"
   }
   ```

#### Opțiunea 3: user_metadata în Supabase

Similar cu opțiunea 2, dar editează `user_metadata`:
```json
{
  "role": "admin"
}
```

## Utilizare

### Accesare Pagină Admin

După configurare, accesează:
```
/admin/monthly-free-problems
```

### Funcționalități

1. **Selectare Lună**: Poți selecta pentru ce lună configurezi problemele (format: YYYY-MM)

2. **Filtrare Probleme**:
   - Căutare după titlu
   - Filtrare după dificultate (Ușor, Mediu, Avansat, Concurs)
   - Filtrare după clasă (9, 10, 11, 12)

3. **Selecție Probleme**:
   - Bifează problemele pe care vrei să le faci gratuite
   - Maxim 50 de probleme per lună
   - Problemele selectate sunt evidențiate cu verde

4. **Salvare**:
   - Click pe "Salvează selecțiile" pentru a salva configurația
   - Selecțiile manuale au prioritate față de algoritmul automat

5. **Ștergere**:
   - Click pe "Șterge selecțiile" pentru a reveni la algoritmul automat
   - După ștergere, sistemul va folosi algoritmul hash pentru selecție

## Cum Funcționează

1. **Prioritate Selecții Manuale**: Dacă există selecții manuale pentru o lună, acestea au prioritate față de algoritmul automat.

2. **Algoritm Automat**: Dacă nu există selecții manuale, sistemul folosește un algoritm hash determinist bazat pe:
   - Luna curentă (ex: "2024-12")
   - ID-ul problemei

3. **Cache**: Sistemul folosește cache pentru performanță. Selecțiile manuale invalidează automat cache-ul.

## API Endpoints

### GET `/api/admin/monthly-free-problems?month_key=2024-12`
Obține problemele selectate pentru o lună.

### POST `/api/admin/monthly-free-problems`
Salvează selecții noi:
```json
{
  "month_key": "2024-12",
  "problem_ids": ["uuid1", "uuid2", ...]
}
```

### DELETE `/api/admin/monthly-free-problems?month_key=2024-12`
Șterge selecțiile pentru o lună.

### GET `/api/admin/coding-problems`
Obține toate problemele active (cu filtrare opțională).

## Securitate

- Toate endpoint-urile verifică dacă utilizatorul este admin
- Verificarea se face pe server-side
- Utilizatorii normali nu pot accesa pagina sau API-urile admin
- RLS (Row Level Security) este activat pe tabelul `monthly_free_problems`

## Note

- Maxim 50 de probleme pot fi selectate per lună
- Selecțiile sunt specifice pentru fiecare lună
- Poți configura probleme pentru luni viitoare în avans
- Ștergerea selecțiilor pentru o lună va face ca sistemul să folosească algoritmul automat pentru acea lună















