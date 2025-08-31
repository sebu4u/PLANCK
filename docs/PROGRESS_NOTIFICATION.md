# Notificare de Progres - Documentație

## Descriere

Componenta `ProgressNotification` afișează o notificare elegantă în dreapta jos pe homepage care îi arată utilizatorului progresul său și sugerează o problemă pentru a-și mări progresul.

## Funcționalități

### 🎯 Afișare progres
- Numărul total de probleme rezolvate
- Bar de progres vizual (0-10 probleme)
- Mesaje motivante personalizate în funcție de progres

### 🎲 Sugestie inteligentă
- Găsește probleme cu rezolvare video care nu sunt rezolvate
- Fallback la probleme fără video dacă toate cele cu video sunt rezolvate
- Alege o problemă random din cele disponibile
- Indicatori vizuali pentru probleme cu/fără video

### 🎨 Design și UX
- Culoare verde deschis pentru aspect prietenos
- Animație de intrare fluidă (slide-up cu fade)
- Responsive design pentru mobil și desktop
- Buton X pentru închidere în dreapta sus
- Buton CTA pentru navigare la problema sugerată

### 💾 Persistență
- Notificarea rămâne închisă pentru sesiunea curentă
- Folosește `sessionStorage` pentru a nu deranja utilizatorul

## Implementare

### Componenta principală
```tsx
// components/progress-notification.tsx
export function ProgressNotification() {
  // Logică pentru afișare progres și sugestii
}
```

### Integrare în homepage
```tsx
// app/page.tsx
import { ProgressNotification } from "@/components/progress-notification"

// Adăugat la sfârșitul componentei
<ProgressNotification />
```

## Logica de funcționare

### 1. Verificare condiții
- Utilizatorul trebuie să fie autentificat
- Notificarea nu trebuie să fi fost închisă anterior
- Trebuie să existe probleme disponibile pentru sugestie

### 2. Obținere date
- Numărul de probleme rezolvate din `solved_problems`
- Lista problemelor rezolvate pentru filtrare
- Probleme cu video disponibile din `problems`

### 3. Logică de sugestie
```typescript
// 1. Caută probleme cu video nerezolvate
const problemsWithVideo = await supabase
  .from('problems')
  .select('*')
  .not('youtube_url', 'is', null)
  .neq('youtube_url', '')

// 2. Filtrează cele rezolvate
const unsolved = problemsWithVideo.filter(p => !solvedIds.includes(p.id))

// 3. Fallback la orice problemă nerezolvată
if (unsolved.length === 0) {
  // Caută orice problemă disponibilă
}
```

### 4. Afișare
- Apare după 2 secunde pentru a nu deranja
- Animație de intrare fluidă
- Responsive pentru toate dispozitivele

## Stilizare

### Culori
- **Background**: `from-green-50 to-emerald-50`
- **Border**: `border-green-200`
- **Text**: `text-green-700/800`
- **Progress bar**: `from-green-400 to-emerald-500`

### Animații
- **Intrare**: `translate-y-full opacity-0` → `translate-y-0 opacity-100`
- **Durată**: 700ms cu `ease-out`
- **Scale**: `scale-95` → `scale-100`

### Responsive
- **Mobil**: `bottom-4 right-4 max-w-xs p-4`
- **Desktop**: `md:bottom-6 md:right-6 md:max-w-sm md:p-6`

## Optimizări

### Performance
- Query-uri optimizate cu limite
- Filtrare în JavaScript pentru complexitate
- Lazy loading prin `useEffect`

### UX
- Nu apare dacă nu există probleme disponibile
- Mesaje personalizate în funcție de progres
- Închidere persistentă pentru sesiune

### Accesibilitate
- Butoane cu aria-labels
- Contrast bun pentru text
- Focus management corect

## Utilizare

Componenta se integrează automat în homepage și nu necesită configurare suplimentară. Se activează doar pentru utilizatorii autentificați și doar când există probleme disponibile pentru sugestie.

## Debugging

### Probleme comune
1. **Nu apare notificarea**: Verifică dacă utilizatorul este autentificat
2. **Nu găsește probleme**: Verifică tabela `problems` și `solved_problems`
3. **Erori console**: Verifică conexiunea la Supabase

### Logs utile
```typescript
console.log('User:', user?.id)
console.log('Solved count:', solvedCount)
console.log('Suggested problem:', suggestedProblem)
```
