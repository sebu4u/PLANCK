import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail } from "lucide-react"

interface FooterProps {
  backgroundColor?: string
  borderColor?: string
}

export function Footer({ backgroundColor = "bg-black", borderColor = "border-gray-800" }: FooterProps) {
  return (
    <footer className={`${backgroundColor} border-t ${borderColor} py-16 px-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4 title-font">PLANCK</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Platforma educațională de fizică și informatică pentru liceeni. Învață, exersează și reușește!
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-gray-400 hover:text-purple-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/planck.academy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </Link>
              <Link
                href="https://www.youtube.com/@PLANCK.academy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-purple-400 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>

          {/* Platform Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Platformă</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-purple-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/cursuri" className="hover:text-purple-400 transition-colors">
                  Cursuri de Fizică
                </Link>
              </li>
              <li>
                <Link href="/probleme" className="hover:text-purple-400 transition-colors">
                  Probleme de Fizică
                </Link>
              </li>
              <li>
                <span className="text-gray-400 cursor-default">
                  Probleme de Informatică
                </span>
              </li>
              <li>
                <Link href="/planckcode" className="hover:text-purple-400 transition-colors">
                  Planck Code
                </Link>
              </li>
              <li>
                <Link href="/insight" className="hover:text-purple-400 transition-colors">
                  Planck Insight
                </Link>
              </li>
              <li>
                <Link href="/sketch" className="hover:text-purple-400 transition-colors">
                  Sketch
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Cont & Suport</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/profil" className="hover:text-purple-400 transition-colors">
                  Profil
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-purple-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/despre" className="hover:text-purple-400 transition-colors">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/ajutor" className="hover:text-purple-400 transition-colors">
                  Ajutor
                </Link>
              </li>
              <li>
                <Link href="/termeni" className="hover:text-purple-400 transition-colors">
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-purple-400 transition-colors">
                  Politica de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Linkuri rapide</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/planckcode/ide" className="hover:text-purple-400 transition-colors">
                  IDE Online
                </Link>
              </li>
              <li>
                <Link href="/insight/chat" className="hover:text-purple-400 transition-colors">
                  Chat Insight
                </Link>
              </li>
              <li>
                <Link href="/sketch/new" className="hover:text-purple-400 transition-colors">
                  Creează Sketch
                </Link>
              </li>
              <li>
                <Link href="/sketch/boards" className="hover:text-purple-400 transition-colors">
                  Sketch Boards
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-purple-400 transition-colors">
                  Înregistrare
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t ${borderColor} mt-12 pt-8 text-center`}>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  )
}
