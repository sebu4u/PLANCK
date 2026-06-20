# 🚀 Ghid de Deployment PLANCK Platform

## ❗ IMPORTANT: Configurare Variabile de Mediu

Pentru ca site-ul publicat să funcționeze corect, **trebuie să configurezi variabilele de mediu pe platformă de hosting**.

## 📋 Variabile de Mediu Necesare

### Variabile Obligatorii

```env
# Supabase Configuration (Obligatoriu)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# PartyKit Configuration (Obligatoriu pentru Whiteboard)
NEXT_PUBLIC_PARTYKIT_HOST=your-project-name.username.partykit.dev


# OpenAI API - IMPORTANT pentru modelul AI Insight! (Obligatoriu)
OPENAI_API_KEY=your_openai_api_key_here
```

### Variabile Opționale

```env
# MailerLite API Configuration
MAILERLITE_API_KEY=your_mailerlite_api_key_here
MAILERLITE_GROUP_ID=your_mailerlite_group_id_here

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-7TTVHVHLPE

# Cookie Management
NEXT_PUBLIC_COOKIE_CONSENT_VERSION=1.0

# Insight AI Configuration - Costuri și Alerte
INSIGHT_COST_INPUT_PER_1K=0.005
INSIGHT_COST_OUTPUT_PER_1K=0.015
INSIGHT_MONTHLY_ALERT_USD=20
INSIGHT_ALERT_WEBHOOK=

# Admin Configuration
ADMIN_EMAILS=admin@example.com
```

## 🔧 Configurare pe Platforme de Hosting

### Vercel (Recomandat pentru Next.js)

1. **Accesează Dashboard-ul Vercel**
   - Mergi pe [vercel.com](https://vercel.com)
   - Click pe proiectul tău

2. **Navighează la Settings**
   - Click pe tab-ul **Settings**
   - Selectează **Environment Variables** din meniul lateral

3. **Adaugă variabilele de mediu**
   - Click pe **Add New**
   - Pentru fiecare variabilă:
     - **Name**: numele variabilei (ex: `OPENAI_API_KEY`)
     - **Value**: valoarea variabilei
     - **Environment**: selectează `Production`, `Preview`, și `Development`
   - Click **Save**

4. **Redeploy aplicația**
   - Mergi la tab-ul **Deployments**
   - Click pe cele trei puncte (**...**) din deploymentul activ
   - Selectează **Redeploy**
   - ✅ Bifează opțiunea **"Use existing Build Cache"** (opțional, pentru deploy mai rapid)
   - Click **Redeploy**

### Netlify

1. **Accesează Dashboard-ul Netlify**
   - Mergi pe [netlify.com](https://netlify.com)
   - Selectează site-ul tău

2. **Configurează variabilele**
   - Click pe **Site settings**
   - Selectează **Environment variables** din meniul lateral
   - Click pe **Add a variable**

3. **Adaugă fiecare variabilă**
   - **Key**: numele variabilei
   - **Values**: valoarea variabilei
   - Selectează **Same value for all deploy contexts** sau specifică pentru production

4. **Trigger un nou deploy**
   - Mergi la **Deploys**
   - Click pe **Trigger deploy** → **Deploy site**

### Railway

1. **Accesează proiectul**
   - Mergi pe [railway.app](https://railway.app)
   - Selectează proiectul tău

2. **Adaugă variabile**
   - Click pe service-ul tău
   - Selectează tab-ul **Variables**
   - Click **New Variable**
   - Adaugă fiecare variabilă

3. **Redeploy**
   - Railway va redeплoya automat la salvarea variabilelor

## 🔑 Cum obții API Keys

### OpenAI API Key (CRITICAL pentru AI Insight)

1. **Creează cont OpenAI**
   - Mergi pe [platform.openai.com](https://platform.openai.com)
   - Creează un cont sau autentifică-te

2. **Generează API Key**
   - Click pe profilul tău (dreapta sus)
   - Selectează **API keys**
   - Click **Create new secret key**
   - **IMPORTANT**: Copiază key-ul imediat (nu îl vei mai putea vedea)

3. **Adaugă credit în cont**
   - Mergi la **Billing** → **Payment methods**
   - Adaugă o metodă de plată
   - Adaugă credit minim $5 (recomandat $10-20)
   - **NOTĂ**: OpenAI necesită credit pre-plătit pentru API

4. **Configurează limite de spending (Recomandat)**
   - Mergi la **Billing** → **Usage limits**
   - Setează un soft limit (ex: $20/lună)
   - Setează un hard limit (ex: $30/lună)

### Supabase Keys

1. **Accesează Dashboard Supabase**
   - Mergi pe [supabase.com](https://supabase.com)
   - Selectează proiectul tău

2. **Găsește keys**
   - Click pe **Settings** (iconița roată)
   - Selectează **API**
   - Copiază:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Ține secret!)

### PartyKit Host

1. **Deploy PartyKit Server**
   - Rulează `npx partykit deploy` în terminal
   - Copiază URL-ul generat (ex: `planck-sketch.andrei.partykit.dev`)

2. **Configurează Variabila**
   - Adaugă URL-ul (fără `https://`) ca valoare pentru `NEXT_PUBLIC_PARTYKIT_HOST`


## ✅ Verificare Deployment

### 1. Verifică dacă variabilele sunt setate

Pe Vercel, poți verifica în **Settings** → **Environment Variables**.

### 2. Testează funcționalitatea AI

1. Accesează site-ul publicat
2. Mergi la secțiunea **Insight AI**
3. Încearcă să trimiți un mesaj
4. **Dacă totul funcționează**: Vei primi un răspuns de la AI ✅
5. **Dacă încă primești eroare**: Verifică logs-urile

### 3. Verifică logs-urile (Debugging)

**Pe Vercel:**
- Mergi la tab-ul **Functions** sau **Logs**
- Caută erori legate de `OPENAI_API_KEY`

**Pe Netlify:**
- Mergi la **Functions** → **Function logs**

## 📈 Monitorizare Active CPU (Vercel Fluid Compute)

După deploy, compară metricile din **Vercel → Observability → Functions** (sau Usage → Active CPU) înainte vs. după ~24–48h:

| Rută / zonă | Ce urmărești | Țintă după optimizări |
|-------------|--------------|------------------------|
| `middleware` | Invocări + Active CPU total | Scădere semnificativă (mai puține request-uri trec prin auth refresh) |
| `api/insight/chat` | Active CPU per invocare | Scădere pe mesaje fără resurse (catalog oprit când `artifactLimit = 0`) |
| `probleme`, `informatica/probleme` (SSR) | Active CPU la render | Scădere (payload inițial limitat, fără `select` pe tot catalogul) |
| `api/run` | Active CPU per Run | Scădere când codul nu folosește `ofstream` |
| `api/coding-problems/*/submit` | Durată invocare | Scădere (Judge0 în batch paralel) |

**Loguri utile în Function Logs** (prefixe):

- `[insight.catalog]` — timp căutare catalog, nr. candidați/rezultate
- `[run]` — durată execuție + bytes sursă
- `[judge0.submit]` — durată + nr. teste rulate

**Alertă Hobby**: planul include ~4h Active CPU/lună; dacă depășești, verifică top 5 funcții după Active CPU în dashboard.

## 🚨 Probleme Comune

### "Configurare API invalidă. Contactează administratorul."

**Cauză**: `OPENAI_API_KEY` nu este setată sau este invalidă.

**Soluție**:
1. Verifică dacă ai adăugat variabila pe platformă
2. Verifică dacă valoarea este corectă (fără spații extra)
3. Redeploy aplicația după adăugarea variabilei

### "Contul OpenAI nu are suficiente credite."

**Cauză**: Contul OpenAI nu are credit sau billing nu este configurat.

**Soluție**:
1. Accesează [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Adaugă o metodă de plată
3. Adaugă credit în cont

### "Rate limit exceeded"

**Cauză**: Prea multe cereri în scurt timp.

**Soluție**:
1. Așteaptă câteva minute
2. Verifică dacă cineva face spam pe API
3. Implementează rate limiting mai strict (deja implementat pentru free users)

## 📊 Costuri Estimate

### OpenAI API (Model: gpt-4o-mini)

- **Input**: $0.005 / 1000 tokens
- **Output**: $0.015 / 1000 tokens
- **Estimare**: ~$0.02 - $0.05 per conversație medie
- **Buget lunar recomandat**: $10-30 pentru utilizare moderată

### Alte Servicii

- **Vercel**: Plan gratuit disponibil (suficient pentru start)
- **Supabase**: Plan gratuit disponibil (500MB storage, 50,000 active users)
- **Netlify**: Plan gratuit disponibil

## 🎯 Checklist Final

Înainte de a declara deployment-ul complet:

- [ ] ✅ Toate variabilele de mediu sunt configurate pe platformă
- [ ] ✅ `OPENAI_API_KEY` este validă și are credit în cont
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` este setată corect
- [ ] ✅ `NEXT_PUBLIC_PARTYKIT_HOST` este setată și PartyKit server este deployed
- [ ] ✅ Site-ul a fost redeployed după adăugarea variabilelor
- [ ] ✅ AI Insight funcționează pe site-ul publicat
- [ ] ✅ Autentificarea funcționează corect
- [ ] ✅ Toate funcționalitățile au fost testate

## 📞 Suport

Dacă întâmpini probleme:

1. **Verifică logs-urile** pe platformă de hosting
2. **Testează local** cu `npm run dev` pentru a vedea dacă funcționează
3. **Compară** `.env.local` cu variabilele setate pe platformă
4. **Verifică** dacă toate API keys sunt valide

---

**✨ Baftă cu deployment-ul!**











