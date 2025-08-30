# 📧 Newsletter Integration - PLANCK Platform

## 🎯 Scop

Integrarea formularului de newsletter existent cu API-ul MailerLite pentru a permite utilizatorilor să se aboneze automat la newsletter-ul PLANCK.

## ✨ Funcționalități

- ✅ **Integrare completă cu MailerLite API**
- ✅ **Validare email robustă** (client + server)
- ✅ **Rate limiting** (10 cereri/minut server, 5/oră client)
- ✅ **Notificări toast** pentru feedback utilizator
- ✅ **Gestionare erori comprehensivă**
- ✅ **Securitate avansată** (sanitizare, CSRF protection)
- ✅ **Resetare automată formular** după submit reușit

## 🚀 Instalare și Configurare

### 1. Variabile de Mediu

Creează fișierul `.env.local` în rădăcina proiectului:

```env
# MailerLite API Configuration
MAILERLITE_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiOTU3NmEyNGMwZTNmYjIwNDc4MjcwMjAwMGZhZTJmYjliNmUzZmI2NDY3OThlNWJhYjUwNWExMDAyMjI0YTU0Zjg4OTk3YjEyNjVkYTZjNmUiLCJpYXQiOjE3NTY1NTY5NjguNjc4ODkyLCJuYmYiOjE3NTY1NTY5NjguNjc4ODk1LCJleHAiOjQ5MTIyMzA1NjguNjc0NzcxLCJzdWIiOiIxNzgyMTY5Iiwic2NvcGVzIjpbXX0.o2pN_sug_3zge558b7FEjluCBq0t58KCmpAtbSm-q2IQICcgfA7BjWIIQUZ53BVbDX6nyDVTv4zvR-PNN0zqnetxeQXtq-FFUz1aLmltg1wdn1zCCj5xa0ahEt9oaG-xHGZliTyz1OUdQ1vJMX3iJ0XkOo5RrZDabjTl1T1MgZKOO-y28Pnq4suibXeriwo1QW0unC10vy2wgZpxP4I0p7RCXafeor01v36j9USU_ij74rzwp6P1e8NzhgELYHz7cPTRxTJFhZxkGhiHH7iNra0kRKnP3mTgmGC2hdBWHEmD0T_3D_ivPr1qSGjHaFDJXY7QMSIVvvK3zwMK5a2LVijExaO5JJEBa-Zqgras2h654jkfK8kYHVTr_syE2_9tswFHr1lxPuKEm20U-XZNQWwp6G2T4p6pqVcu8vq6ubKE0d8tBzB6ehU64xk6NMwGWvi24g8ApbNnImbcS4Q_XU4mW-P83jWZkVyemMlxwcbTSItaT4T01XO2CILmhLbi1qncO7eLEAwDbrmlIgBHTWadiLRMYQCMg2iZGrj3wjX8X0iwOCEDXnTn5xR2h2fyE5-btG8z4ZURgVx2NOym2OvBOXsDWMR_-KHA6lp0WJF7q4Mta_JuSdi88ZiYDomcIyS8UsUtIZ0Q3tGjZqS-AoEFC1OzolLyBRYjrjKobAY
MAILERLITE_GROUP_ID=164161213156033744
```

### 2. Configurare MailerLite

1. **Accesează MailerLite Dashboard**: https://app.mailerlite.com/
2. **Navighează la Integrations > API**
3. **Generează API Key** (dacă nu ai deja unul)
4. **Creează un grup** pentru newsletter în Subscribers > Groups
5. **Copiază Group ID**-ul

### 3. Testare

Rulează scriptul de testare:

```bash
node scripts/test-newsletter.js
```

## 📁 Structura Fișierelor

```
├── app/
│   └── api/
│       └── newsletter/
│           └── route.ts              # API endpoint
├── components/
│   └── newsletter-section.tsx        # Componenta formular
├── lib/
│   └── newsletter.ts                 # Utilitare și helpers
├── docs/
│   └── newsletter-integration.md     # Documentație detaliată
└── scripts/
    └── test-newsletter.js            # Script testare
```

## 🔧 Utilizare

### În Componente

```tsx
import { subscribeToNewsletter } from '@/lib/newsletter'

const handleNewsletterSubmit = async (email: string) => {
  try {
    const result = await subscribeToNewsletter(email)
    console.log('Abonare reușită:', result.message)
  } catch (error) {
    console.error('Eroare abonare:', error.message)
  }
}
```

### API Endpoint

```bash
POST /api/newsletter
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Răspunsuri:**

```json
// Succes
{
  "success": true,
  "message": "Te-ai abonat cu succes la newsletter!",
  "data": { ... }
}

// Eroare
{
  "success": false,
  "message": "Adresa de email nu este validă"
}
```

## 🛡️ Securitate

### Rate Limiting
- **Server**: 10 cereri/minut per IP
- **Client**: 5 încercări/oră per browser

### Validare
- **Email format**: Regex comprehensiv
- **Sanitizare**: Trim whitespace + lowercase
- **CSRF Protection**: Validare server-side

### Error Handling
| Cod | Descriere |
|-----|-----------|
| 400 | Email invalid sau lipsă |
| 409 | Email deja abonat |
| 429 | Rate limit exceeded |
| 500 | Erori interne |

## 🧪 Testare

### Testare Manuală

1. **Pornește serverul**:
   ```bash
   npm run dev
   ```

2. **Accesează homepage-ul** și testează formularul

3. **Verifică notificările** toast

4. **Testează scenarii de eroare**:
   - Email invalid
   - Email gol
   - Rate limiting

### Testare Automată

```bash
# Rulează scriptul de testare
node scripts/test-newsletter.js

# Testează cu curl
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🔍 Debug

### Logs Console

```typescript
// Activează debug logging
console.log('Newsletter API Response:', response)
console.log('MailerLite Error:', error)
```

### Verificare Rate Limiting

```javascript
// Verifică rate limiting pe client
import { NewsletterRateLimiter } from '@/lib/newsletter'
console.log('Rate limited:', NewsletterRateLimiter.isRateLimited())
```

## 🚨 Troubleshooting

### Probleme Comune

1. **"API Key Invalid"**
   - Verifică `MAILERLITE_API_KEY` în `.env.local`
   - Asigură-te că API key-ul are permisiunile necesare

2. **"Group ID Invalid"**
   - Verifică `MAILERLITE_GROUP_ID` în `.env.local`
   - Asigură-te că grupul există în MailerLite

3. **"Rate Limited"**
   - Așteaptă câteva minute
   - Verifică logs pentru detalii

4. **"Email Already Exists"**
   - Emailul este deja în grupul MailerLite
   - Comportament normal pentru emailuri duplicate

### Verificare Configurare

```bash
# Verifică variabilele de mediu
echo $MAILERLITE_API_KEY
echo $MAILERLITE_GROUP_ID

# Testează conexiunea la MailerLite
curl -H "Authorization: Bearer $MAILERLITE_API_KEY" \
  https://connect.mailerlite.com/api/subscribers
```

## 📈 Monitorizare

### Metrics de Urmărit

- **Rate de conversie**: Abonări reușite / Total încercări
- **Rate de eroare**: Erori / Total cereri
- **Rate limiting triggers**: Câte cereri sunt limitate

### Logs Importante

```typescript
// În API route
console.log('Newsletter subscription:', { email, success: true })
console.log('Rate limiting triggered for IP:', clientIP)
console.log('MailerLite API error:', error)
```

## 🔄 Actualizări

### Versiuni

- **v1.0.0**: Integrare inițială cu MailerLite
- **v1.1.0**: Adăugare rate limiting și validare îmbunătățită
- **v1.2.0**: Adăugare utilitare și documentație completă

### Roadmap

- [ ] Double opt-in confirmation
- [ ] Analytics tracking
- [ ] A/B testing pentru formulare
- [ ] Queue processing pentru performanță
- [ ] Retry logic pentru API calls

## 📞 Suport

Pentru probleme sau întrebări:

1. **Verifică documentația** din `docs/newsletter-integration.md`
2. **Rulează scriptul de testare** pentru diagnosticare
3. **Verifică logs-urile** pentru detalii de eroare
4. **Contactează echipa de dezvoltare** pentru suport

---

**🎉 Newsletter Integration este gata de utilizare!**
