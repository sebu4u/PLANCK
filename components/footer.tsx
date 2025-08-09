import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-4 title-font">PLANCK</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Platforma educațională de fizică pentru liceeni. Învață, exersează și reușește!
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
              >
                <Facebook size={20} />
              </Link>
              <Link
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
              >
                <Instagram size={20} />
              </Link>
              <Link
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
              >
                <Youtube size={20} />
              </Link>
              <Link
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Cursuri</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/cursuri/clasa-9" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Fizica Clasa a 9-a
                </Link>
              </li>
              <li>
                <Link href="/cursuri/clasa-10" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Fizica Clasa a 10-a
                </Link>
              </li>
              <li>
                <Link href="/probleme" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Catalog Probleme
                </Link>
              </li>
              <li>
                <Link href="/abonament" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Abonament
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Suport</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/despre" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/ajutor" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Ajutor
                </Link>
              </li>
              <li>
                <Link href="/termeni" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Termeni și condiții
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-black dark:text-white font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Primește noutăți și resurse gratuite</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email-ul tău"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-black dark:text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(348,83%,47%)]"
              />
              <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-[hsl(348,83%,47%)] dark:hover:bg-[hsl(348,83%,47%)] dark:hover:text-white rounded transition-colors">
                Abonează-te
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 PLANCK. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  )
}
