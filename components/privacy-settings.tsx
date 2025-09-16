'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCookieManager } from '@/lib/cookie-management'
import { useAnalytics } from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Eye, 
  Download, 
  Trash2, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Cookie,
  BarChart3,
  Mail
} from 'lucide-react'
import Link from 'next/link'

export function PrivacySettings() {
  const { toast } = useToast()
  const cookieManager = useCookieManager()
  const analytics = useAnalytics()
  const [preferences, setPreferences] = useState(cookieManager.preferences)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setPreferences(cookieManager.preferences)
  }, [cookieManager.preferences])

  const handlePreferenceChange = (key: 'analytics' | 'marketing', value: boolean) => {
    if (!preferences) return

    const newPreferences = {
      ...preferences,
      [key]: value
    }
    
    setPreferences(newPreferences)
    cookieManager.savePreferences(newPreferences)
    
    // Reinitializează analytics dacă este necesar
    if (key === 'analytics' && value) {
      analytics.trackCustomEvent('analytics_consent_given', {
        consent_type: 'analytics',
        timestamp: new Date().toISOString()
      })
    }

    toast({
      title: 'Preferințe actualizate',
      description: `Cookie-urile ${key === 'analytics' ? 'analytics' : 'marketing'} au fost ${value ? 'activate' : 'dezactivate'}.`,
    })
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      // Simulează exportul datelor (în realitate ar trebui să faci o cerere la API)
      const userData = {
        preferences: preferences,
        analytics_consent: cookieManager.hasAnalyticsConsent(),
        marketing_consent: cookieManager.hasMarketingConsent(),
        export_date: new Date().toISOString(),
        platform: 'PLANCK'
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `planck-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Date exportate cu succes',
        description: 'Datele tale au fost descărcate în format JSON.',
      })

      // Track event
      analytics.trackCustomEvent('data_exported', {
        export_type: 'user_data',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      toast({
        title: 'Eroare la export',
        description: 'Nu s-au putut exporta datele. Încearcă din nou.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteData = async () => {
    if (!confirm('Ești sigur că vrei să ștergi toate datele tale? Această acțiune nu poate fi anulată.')) {
      return
    }

    setIsLoading(true)
    try {
      // Șterge preferințele cookie-uri
      cookieManager.clearPreferences()
      
      // Track event înainte de ștergere
      analytics.trackCustomEvent('data_deletion_requested', {
        deletion_type: 'user_data',
        timestamp: new Date().toISOString()
      })

      toast({
        title: 'Date șterse cu succes',
        description: 'Toate datele tale locale au fost șterse. Va trebui să reconfigurezi preferințele.',
      })

      // Reîncarcă pagina pentru a reseta starea
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-au putut șterge datele. Încearcă din nou.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!preferences) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nu ai configurat încă preferințele de confidențialitate. 
            <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 ml-1">
              Configurează-le acum
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Status Confidențialitate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Cookie-uri Esențiale</span>
              </div>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Analytics</span>
              </div>
              <Badge variant={preferences.analytics ? "default" : "secondary"}>
                {preferences.analytics ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  'Inactive'
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Marketing</span>
              </div>
              <Badge variant={preferences.marketing ? "default" : "secondary"}>
                {preferences.marketing ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  'Inactive'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setări cookie-uri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Preferințe Cookie-uri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Essential Cookies - nu pot fi dezactivate */}
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Cookie className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Cookie-uri Esențiale
                </h4>
                <Badge variant="outline" className="text-xs">Obligatoriu</Badge>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Necesare pentru funcționarea de bază a platformei (autentificare, preferințe, securitate)
              </p>
            </div>
            <Switch checked={true} disabled className="ml-4" />
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Cookie-uri Analytics
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ne ajută să înțelegem cum folosești platforma pentru a îmbunătăți conținutul educațional
              </p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
              className="ml-4"
            />
          </div>

          {/* Marketing Cookies */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Cookie-uri Marketing
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pentru newsletter și comunicări personalizate despre conținut educațional
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drepturile tale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Drepturile tale conform GDPR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Dreptul la acces
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Poți descărca toate datele tale personale într-un format standard.
              </p>
              <Button 
                onClick={handleExportData} 
                disabled={isLoading}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? 'Se exportă...' : 'Exportă datele'}
              </Button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Dreptul la ștergere
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Poți șterge toate datele tale personale de pe platformă.
              </p>
              <Button 
                onClick={handleDeleteData} 
                disabled={isLoading}
                variant="outline" 
                size="sm"
                className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Se șterge...' : 'Șterge datele'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Pentru mai multe informații despre cookie-uri și confidențialitate:
            </p>
            <Link 
              href="/cookie-policy" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
            >
              Citește Politica Cookie-uri
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Informații suplimentare */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Confidențialitatea ta este importantă pentru noi.</strong> Toate datele sunt procesate 
          conform reglementărilor GDPR și nu sunt partajate cu terțe părți fără consimțământul tău explicit.
        </AlertDescription>
      </Alert>
    </div>
  )
}
