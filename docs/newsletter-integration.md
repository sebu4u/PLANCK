# Newsletter Integration cu MailerLite API

## Descriere

Această integrare permite utilizatorilor să se aboneze la newsletter-ul PLANCK prin formularul existent de pe homepage. Emailurile sunt trimise automat într-un grup specific din MailerLite.

## Componente

### 1. API Route (`/app/api/newsletter/route.ts`)
- **Endpoint**: `POST /api/newsletter`
- **Funcționalitate**: 
  - Validează adresa de email
  - Implementează rate limiting (10 cereri/minut per IP)
  - Trimite emailul către MailerLite API
  - Gestionează erorile și returnează răspunsuri adecvate

### 2. Componenta Newsletter (`/components/newsletter-section.tsx`)
- **Funcționalitate**:
  - Formular de abonare cu validare client-side
  - Integrare cu sistemul de notificări toast
  - Rate limiting pe partea de client (5 încercări/oră)
  - Resetarea formularului după submit reușit

### 3. Utilitare (`/lib/newsletter.ts`)
- **Funcții**:
  - `isValidEmail()` - Validare email cu regex comprehensiv
  - `sanitizeEmail()` - Sanitizare email (trim + lowercase)
  - `NewsletterRateLimiter` - Rate limiting pe client
  - `subscribeToNewsletter()` - Funcție helper pentru API calls

## Configurare

### Variabile de Mediu

Adaugă următoarele variabile în fișierul `.env.local`:

```env
MAILERLITE_API_KEY=your_mailerlite_api_key_here
MAILERLITE_GROUP_ID=your_mailerlite_group_id_here
```

### Configurare MailerLite

1. **Obține API Key**:
   - Accesează [MailerLite Dashboard](https://app.mailerlite.com/)
   - Navighează la Integrations > API
   - Generează un nou API key

2. **Creează Grupul**:
   - Navighează la Subscribers > Groups
   - Creează un nou grup pentru newsletter
   - Copiază Group ID-ul

## Securitate

### Rate Limiting
- **Server-side**: 10 cereri/minut per IP
- **Client-side**: 5 încercări/oră per browser

### Validare
- **Email format**: Regex comprehensiv pentru validare
- **Sanitizare**: Trim whitespace + lowercase
- **CSRF Protection**: Implementată prin validare server-side

### Error Handling
- **400**: Email invalid sau lipsă
- **409**: Email deja abonat
- **429**: Rate limit exceeded
- **500**: Erori interne

## Utilizare

### În Componente

```tsx
import { subscribeToNewsletter } from '@/lib/newsletter'

const handleSubmit = async (email: string) => {
  try {
    const result = await subscribeToNewsletter(email)
    // Handle success
  } catch (error) {
    // Handle error
  }
}
```

### Testare API

```bash
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Mesaje de Eroare

| Cod | Mesaj |
|-----|-------|
| 400 | Adresa de email este obligatorie |
| 400 | Adresa de email nu este validă |
| 409 | Această adresă de email este deja abonată la newsletter |
| 429 | Prea multe încercări. Te rugăm să încerci din nou în câteva minute. |
| 500 | A apărut o eroare. Te rugăm să încerci din nou. |

## Monitorizare

### Logs
- Toate erorile sunt logate în console
- Rate limiting este monitorizat
- API calls către MailerLite sunt logate

### Metrics
- Numărul de abonări reușite
- Rate de eroare
- Rate limiting triggers

## Troubleshooting

### Probleme Comune

1. **API Key Invalid**
   - Verifică dacă API key-ul este corect
   - Asigură-te că are permisiunile necesare

2. **Group ID Invalid**
   - Verifică dacă grupul există în MailerLite
   - Asigură-te că API key-ul are acces la grup

3. **Rate Limiting**
   - Verifică logs pentru rate limiting
   - Ajustează limitele dacă este necesar

### Debug

```typescript
// Activează debug logging
console.log('Newsletter API Response:', response)
console.log('MailerLite Error:', error)
```

## Dezvoltare

### Adăugare Funcționalități

1. **Double Opt-in**: Implementează confirmare email
2. **Analytics**: Adaugă tracking pentru conversii
3. **A/B Testing**: Testează diferite versiuni ale formularului

### Optimizări

1. **Caching**: Cache API responses pentru performanță
2. **Queue**: Implementează queue pentru procesare asincronă
3. **Retry Logic**: Adaugă retry pentru API calls eșuate
