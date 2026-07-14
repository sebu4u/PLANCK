import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CookieManager } from '@/lib/cookie-management'

import { pageTitle } from '@/lib/metadata'

export const metadata: Metadata = {
  title: pageTitle('Politica cookie-uri'),
  description: 'Informații despre cookie-urile utilizate pe platforma PLANCK și modul în care le gestionăm conform GDPR.',
  robots: 'index, follow'
}

// Static cookie info for server-side rendering
const cookieInfo = [
  // Essential cookies
  {
    name: 'supabase_session',
    purpose: 'Păstrează sesiunea de autentificare utilizator',
    duration: 'Sesiune (se șterge la închiderea browser-ului)',
    category: 'essential' as const
  },
  {
    name: 'theme_preference',
    purpose: 'Păstrează preferința de temă (dark/light)',
    duration: '1 an',
    category: 'essential' as const
  },
  {
    name: 'user_preferences',
    purpose: 'Păstrează setările personale ale utilizatorului',
    duration: '1 an',
    category: 'essential' as const
  },
  
  // Analytics cookies
  {
    name: '_ga',
    purpose: 'Identifică utilizatorii unici pentru Google Analytics',
    duration: '2 ani',
    category: 'analytics' as const
  },
  {
    name: '_ga_[ID]',
    purpose: 'Stochează ID-ul de sesiune pentru Google Analytics',
    duration: '2 ani',
    category: 'analytics' as const
  },
  {
    name: '_gid',
    purpose: 'Identifică utilizatorii pentru Google Analytics (24h)',
    duration: '24 ore',
    category: 'analytics' as const
  },
  
  // Marketing cookies
  {
    name: 'newsletter_tracking',
    purpose: 'Urmărește abonarea la newsletter și comunicările',
    duration: '1 an',
    category: 'marketing' as const
  }
]

export default function CookiePolicyPage() {
  const essentialCookies = cookieInfo.filter(c => c.category === 'essential')
  const analyticsCookies = cookieInfo.filter(c => c.category === 'analytics')
  const marketingCookies = cookieInfo.filter(c => c.category === 'marketing')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🍪 Politica Cookie-uri
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Informații despre cookie-urile utilizate pe platforma PLANCK și modul în care le gestionăm 
            conform reglementărilor GDPR.
          </p>
        </div>

        {/* Informații generale */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
              Ce sunt cookie-urile?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Cookie-urile sunt fișiere text mici care sunt stocate pe dispozitivul tău când vizitezi un site web. 
              Ele ne ajută să îți oferim o experiență personalizată și să înțelegem cum folosești platforma PLANCK.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              PLANCK folosește cookie-uri pentru a-ți oferi conținut educațional personalizat, pentru a analiza 
              progresul tău în învățare și pentru a îmbunătăți continuu platforma.
            </p>
          </CardContent>
        </Card>

        {/* Categorii de cookie-uri */}
        <div className="grid gap-6 mb-8">
          {/* Essential Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  Esențiale
                </Badge>
                <CardTitle className="text-xl">Cookie-uri Esențiale</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aceste cookie-uri sunt necesare pentru funcționarea de bază a platformei și nu pot fi dezactivate.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {essentialCookies.map((cookie, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {cookie.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {cookie.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Analytics
                </Badge>
                <CardTitle className="text-xl">Cookie-uri Analytics</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aceste cookie-uri ne ajută să înțelegem cum folosești platforma pentru a îmbunătăți conținutul educațional.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsCookies.map((cookie, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {cookie.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {cookie.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Google Analytics
                  </h5>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Folosim Google Analytics pentru a analiza traficul site-ului și comportamentul utilizatorilor. 
                    Datele sunt anonimizate și nu conțin informații personale identificabile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-purple-500 text-purple-600">
                  Marketing
                </Badge>
                <CardTitle className="text-xl">Cookie-uri Marketing</CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aceste cookie-uri sunt folosite pentru newsletter și comunicări personalizate despre conținut educațional.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketingCookies.map((cookie, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {cookie.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {cookie.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {cookie.purpose}
                    </p>
                  </div>
                ))}
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    MailerLite Integration
                  </h5>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Folosim MailerLite pentru gestionarea newsletter-ului și comunicărilor educaționale. 
                    Datele sunt procesate conform politicii de confidențialitate MailerLite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gestionarea cookie-urilor */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
              Cum îți gestionezi cookie-urile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Setări în platformă
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Poți schimba preferințele cookie-urilor oricând din profilul tău sau din banner-ul de consimțământ.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Accesează profilul tău</li>
                  <li>• Mergi la "Setări Confidențialitate"</li>
                  <li>• Ajustează preferințele cookie-urilor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Setări în browser
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Poți șterge sau bloca cookie-urile direct din setările browser-ului tău.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Chrome: Setări → Confidențialitate → Cookie-uri</li>
                  <li>• Firefox: Opțiuni → Confidențialitate → Cookie-uri</li>
                  <li>• Safari: Preferințe → Confidențialitate → Cookie-uri</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drepturile tale */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
              Drepturile tale conform GDPR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Dreptul la informare
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Ai dreptul să știi ce date colectăm și cum le folosim.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Dreptul la acces
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Poți cere o copie a datelor tale personale.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Dreptul la ștergere
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Poți cere ștergerea datelor tale personale.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Dreptul la portabilitate
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Poți exporta datele tale într-un format standard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Dacă ai întrebări despre cookie-uri sau confidențialitatea datelor tale, 
                nu ezita să ne contactezi:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    PLANCK Platform
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Email: <a href="mailto:planck.fizica@gmail.com" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      planck.fizica@gmail.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Locație: Ploiești, Prahova, România
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
          </p>
        </div>
      </div>
    </div>
  )
}
