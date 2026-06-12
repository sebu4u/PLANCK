# OAuth Setup pentru PLANCK Platform (Google & GitHub)

## Cum funcționează acum

Google folosește Google Identity Services (GIS) în browser și trimite un ID token către Supabase prin `supabase.auth.signInWithIdToken`. Acest flow nu mai trimite utilizatorul prin redirect-ul Google către `blgvqkwccjnwakhousvq.supabase.co/auth/v1/callback`, deci consent screen-ul Google poate afișa branding-ul PLANCK / `planck.academy`.

GitHub rămâne pe flow-ul Supabase OAuth clasic, prin `signInWithOAuth`, și folosește în continuare pagina `/auth/callback`.

## Fișiere relevante

- `components/google-oauth-bridge.tsx` încarcă Google Identity Services și pune butonul Google real ca overlay peste UI-ul PLANCK.
- `lib/google-sign-in.ts` finalizează login-ul în Supabase cu `signInWithIdToken`.
- `components/auth-provider.tsx` oferă `loginWithGoogle()` și `loginWithGitHub()` către restul aplicației.
- `lib/oauth-popup.ts` rămâne folosit pentru GitHub OAuth.
- `app/auth/callback/page.tsx` rămâne necesar pentru callback-ul GitHub.

## Variabile de mediu

Setează următoarele variabile în local și în hosting:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blgvqkwccjnwakhousvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` trebuie să fie Web Client ID-ul din Google Cloud Console.

## Supabase Dashboard

### Google Provider

1. Mergi la **Authentication** > **Providers** > **Google**.
2. Activează providerul Google.
3. Adaugă același Web Client ID folosit în `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. Păstrează Client Secret configurat în Supabase.

Nu este necesar un Supabase Custom Domain pentru flow-ul Google cu GIS + ID token.

### GitHub Provider

1. Mergi la **Authentication** > **Providers** > **GitHub**.
2. Activează providerul GitHub.
3. Adaugă Client ID și Client Secret din GitHub Developer Settings.

### URL Configuration

Pentru GitHub și alte flow-uri Supabase OAuth, păstrează:

- **Site URL**: `https://planck.academy` în producție sau `http://localhost:3000` local.
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `https://planck.academy/auth/callback`
  - `https://www.planck.academy/auth/callback` dacă folosești domeniul cu `www`.

## Google Cloud Console

### OAuth Client

În OAuth 2.0 Client ID de tip **Web application**:

- **Authorized JavaScript origins**:
  - `https://planck.academy`
  - `https://www.planck.academy` dacă folosești domeniul cu `www`
  - `http://localhost:3000`

Pentru noul flow Google cu GIS, nu mai este necesar să adaugi `https://blgvqkwccjnwakhousvq.supabase.co/auth/v1/callback` la **Authorized redirect URIs**. Păstrează-l doar temporar dacă mai ai un fallback vechi pe `signInWithOAuth`.

### OAuth Consent Screen

Configurează branding-ul în Google Auth Platform:

1. App name: `PLANCK`.
2. Homepage: `https://planck.academy`.
3. Privacy policy și terms links pe domeniul PLANCK.
4. Authorized domains: `planck.academy`.
5. Trimite branding-ul la verificare dacă Google o cere.

Brand verification poate dura câteva zile. Fără verificare, Google poate afișa mai puțin branding, dar flow-ul nu mai depinde de domeniul Supabase.

## Testare

1. Rulează aplicația cu `pnpm dev`.
2. Deschide `http://localhost:3000/login` sau `http://localhost:3000/register`.
3. Apasă `Continuă cu Google`.
4. Verifică faptul că Google nu mai afișează `blgvqkwccjnwakhousvq.supabase.co` ca destinație principală.
5. După autentificare, verifică încărcarea profilului și flow-ul de onboarding.
6. Testează separat GitHub pentru a confirma că `/auth/callback` încă funcționează.
