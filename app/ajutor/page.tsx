import { Metadata } from "next"
import { Mail, MessageCircle, Clock, HelpCircle, BookOpen, Users } from "lucide-react"
import { generateMetadata } from "@/lib/metadata"

export const metadata: Metadata = generateMetadata('help')

export default function AjutorPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Centru de Ajutor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ai nevoie de ajutor cu platforma Planck? Suntem aici să te sprijinim!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Help Information */}
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">
                Informații de contact pentru suport
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="w-6 h-6 text-[hsl(348,83%,47%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white mb-1">
                      Email suport
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      contact@planck.academy
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Clock className="w-6 h-6 text-[hsl(348,83%,47%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white mb-1">
                      Timp de răspuns
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      În maxim 24 de ore în zilele lucrătoare
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-[hsl(348,83%,47%)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white mb-1">
                      Tipuri de suport
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tehnic, educațional și general
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                Cum te putem ajuta?
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[hsl(348,83%,47%)] rounded-full"></div>
                  <span>Probleme tehnice cu platforma</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[hsl(348,83%,47%)] rounded-full"></div>
                  <span>Întrebări despre cursuri și materiale</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[hsl(348,83%,47%)] rounded-full"></div>
                  <span>Probleme cu contul și autentificarea</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[hsl(348,83%,47%)] rounded-full"></div>
                  <span>Suport pentru navigarea pe site</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[hsl(348,83%,47%)] rounded-full"></div>
                  <span>Întrebări despre funcționalități</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                Resurse utile
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-[hsl(348,83%,47%)]" />
                  <span className="text-gray-600 dark:text-gray-400">Pagina Despre noi</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-[hsl(348,83%,47%)]" />
                  <span className="text-gray-600 dark:text-gray-400">Termeni și condiții</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Form */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">
              Solicită ajutor
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Nume complet
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-[hsl(348,83%,47%)] focus:border-transparent"
                  placeholder="Introdu numele tău"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-[hsl(348,83%,47%)] focus:border-transparent"
                  placeholder="email@exemplu.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Tipul problemei
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-[hsl(348,83%,47%)] focus:border-transparent">
                  <option value="">Selectează tipul problemei</option>
                  <option value="tehnic">Problemă tehnică</option>
                  <option value="cursuri">Întrebare despre cursuri</option>
                  <option value="cont">Problemă cu contul</option>
                  <option value="navigare">Problemă de navigare</option>
                  <option value="functionalitate">Întrebare despre funcționalități</option>
                  <option value="altul">Altă problemă</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Descrierea problemei
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-[hsl(348,83%,47%)] focus:border-transparent resize-none"
                  placeholder="Descrie problema ta în detaliu..."
                ></textarea>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Notă:</strong> Pentru răspunsuri mai rapide, poți trimite direct un email la{' '}
                      <a 
                        href="mailto:contact@planck.academy" 
                        className="text-[hsl(348,83%,47%)] hover:underline font-medium"
                      >
                        contact@planck.academy
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-[hsl(348,83%,47%)] hover:bg-[hsl(348,83%,40%)] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                Trimite solicitarea
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
