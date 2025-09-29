import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
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
                href="https://www.instagram.com/planck.academy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-[hsl(348,83%,47%)] transition-colors"
              >
                <Instagram size={20} />
              </Link>
              <Link
                href="https://www.youtube.com/@PLANCK.academy"
                target="_blank"
                rel="noopener noreferrer"
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
                <Link href="/probleme" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Catalog Probleme
                </Link>
              </li>
              <li>
                <Link href="/cursuri" className="hover:text-[hsl(348,83%,47%)] transition-colors">
                  Lecții de Fizică
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
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 PLANCK. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  )
}
