# Configurare Sistem Resetare Parolă - PLANCK Platform

## Configurare Supabase

### 1. Email Templates

Mergi la **Supabase Dashboard > Authentication > Email Templates**

#### Template "Reset Password"
- **Subject**: `Resetare parolă - PLANCK Platform`
- **Content** (HTML):
```html
<h2>Resetare parolă PLANCK</h2>
<p>Salut!</p>
<p>Ai solicitat resetarea parolei pentru contul tău PLANCK Platform.</p>
<p>Apasă butonul de mai jos pentru a seta o nouă parolă:</p>
<a href="{{ .ConfirmationURL }}" style="background: linear-gradient(45deg, #9333ea, #dc2626); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">Resetează parola</a>
<p>Dacă nu ai solicitat această acțiune, poți ignora acest email.</p>
<p>Link-ul expiră în 24 de ore.</p>
<p>Cu dragoste,<br>Echipa PLANCK</p>
```

### 2. URL Configuration

Mergi la **Supabase Dashboard > Authentication > URL Configuration**

#### Site URL
```
https://planck-platform.vercel.app
```
(sau URL-ul tău de producție)

#### Redirect URLs
Adaugă următoarele URL-uri:
```
https://planck-platform.vercel.app/auth/callback
https://planck-platform.vercel.app/reset-password
```

**Notă**: URL-ul `/reset-password` gestionează atât trimiterea email-ului de resetare cât și setarea noii parole. Când utilizatorul apasă link-ul din email, Supabase îl redirecționează înapoi la aceeași pagină cu token-urile necesare pentru resetarea parolei.

### 3. Verificare RLS Policies

Asigură-te că ai rulat scriptul `supabase/rls-policies.sql` în Supabase SQL Editor.

## Funcționalități Implementate

### 1. Resetare Parolă (Când utilizatorul a uitat-o)
- **Locație**: Pagina `/reset-password`
- **Acces**: Link "Ai uitat parola?" de pe pagina de login
- **Funcționalitate**:
  - Utilizatorul introduce email-ul
  - Primește un email cu link de resetare
  - Apasă link-ul din email și este redirecționat înapoi la `/reset-password` cu token-urile necesare
  - Setează o nouă parolă în același formular

### 2. Schimbare Parolă (Când utilizatorul o știe)
- **Locație**: Pagina de profil (`/profil`)
- **Acces**: Buton "Schimbă parola" în secțiunea Securitate
- **Funcționalitate**:
  - Modal cu formular pentru schimbarea parolei
  - Verificare parolă actuală
  - Setare parolă nouă

## Funcționare Tehnică

### Resetare Parolă
Pagina `/reset-password` funcționează în două moduri:

1. **Modul Email** (fără parametri URL):
   - Afișează formularul pentru introducerea email-ului
   - Trimite email-ul de resetare cu `redirectTo: /reset-password`

2. **Modul Resetare** (cu parametri URL):
   - Detectează `access_token`, `refresh_token`, `type=recovery` în URL
   - Setează sesiunea Supabase cu token-urile
   - Afișează formularul pentru setarea noii parole

### Schimbare Parolă
- Modal separat pe pagina de profil
- Verifică parola actuală prin reautentificare
- Actualizează parola prin `supabase.auth.updateUser()`

## Securitate

- Parolele sunt validate (minim 6 caractere)
- Verificare că parola nouă este diferită de cea actuală
- Verificare că parolele se potrivesc la confirmare
- Token-urile de resetare expiră în 24 de ore
- Reautentificare pentru verificarea parolei actuale

## Testare

### Testare Resetare Parolă
1. Mergi la `/login`
2. Apasă "Ai uitat parola?"
3. Introdu un email valid
4. Verifică email-ul primit
5. Apasă link-ul de resetare
6. Setează o nouă parolă

### Testare Schimbare Parolă
1. Conectează-te la cont
2. Mergi la `/profil`
3. Apasă "Schimbă parola"
4. Introdu parola actuală și noua parolă
5. Confirmă schimbarea

## Note Importante

- Asigură-te că email-urile nu ajung în spam
- Testează pe un cont real pentru a verifica funcționalitatea
- Monitorizează log-urile Supabase pentru erori
- Verifică că redirect URL-urile sunt corecte pentru mediul de producție
