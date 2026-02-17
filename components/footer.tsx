import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail } from "lucide-react"

interface FooterProps {
  backgroundColor?: string
  borderColor?: string
  theme?: "dark" | "light"
}

export function Footer({
  backgroundColor = "bg-black",
  borderColor = "border-gray-800",
  theme = "dark",
}: FooterProps) {
  const isLight = theme === "light"
  const sectionTitleClass = isLight ? "text-[#0b0d10]" : "text-white"
  const bodyTextClass = isLight ? "text-[#2C2F33]/80" : "text-gray-400"
  const linkClass = isLight
    ? "font-semibold text-[#2C2F33] hover:text-[#0b0d10] hover:underline underline-offset-2 transition-colors duration-200"
    : "font-semibold text-gray-400 hover:text-purple-300 hover:underline underline-offset-2 transition-colors duration-200"

  return (
    <footer className={`${backgroundColor} border-t ${borderColor} py-16 px-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className={`text-2xl font-bold mb-4 title-font ${sectionTitleClass}`}>PLANCK</h3>
            <p className={`mb-6 text-sm leading-relaxed ${bodyTextClass}`}>
              Platforma educațională de fizică și informatică pentru liceeni. Învață, exersează și reușește!
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className={linkClass}
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/planck.academy/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </Link>
              <Link
                href="https://www.youtube.com/@PLANCK.academy"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </Link>
              <Link
                href="#"
                className={linkClass}
                aria-label="Email"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>

          {/* Platform Section */}
          <div>
            <h4 className={`font-semibold mb-4 text-base ${sectionTitleClass}`}>Platformă</h4>
            <ul className={`space-y-3 text-sm ${bodyTextClass}`}>
              <li>
                <Link href="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/cursuri" className={linkClass}>
                  Cursuri de Fizică
                </Link>
              </li>
              <li>
                <Link href="/probleme" className={linkClass}>
                  Probleme de Fizică
                </Link>
              </li>
              <li>
                <span className={`${bodyTextClass} cursor-default`}>
                  Probleme de Informatică
                </span>
              </li>
              <li>
                <Link href="/planckcode" className={linkClass}>
                  Planck Code
                </Link>
              </li>
              <li>
                <Link href="/insight" className={linkClass}>
                  Planck Insight
                </Link>
              </li>
              <li>
                <Link href="/sketch" className={linkClass}>
                  Sketch
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support Section */}
          <div>
            <h4 className={`font-semibold mb-4 text-base ${sectionTitleClass}`}>Cont & Suport</h4>
            <ul className={`space-y-3 text-sm ${bodyTextClass}`}>
              <li>
                <Link href="/profil" className={linkClass}>
                  Profil
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/despre" className={linkClass}>
                  Despre noi
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/ajutor" className={linkClass}>
                  Ajutor
                </Link>
              </li>
              <li>
                <Link href="/termeni" className={linkClass}>
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className={linkClass}>
                  Politica de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className={`font-semibold mb-4 text-base ${sectionTitleClass}`}>Linkuri rapide</h4>
            <ul className={`space-y-3 text-sm ${bodyTextClass}`}>
              <li>
                <Link href="/planckcode/ide" className={linkClass}>
                  IDE Online
                </Link>
              </li>
              <li>
                <Link href="/insight/chat" className={linkClass}>
                  Chat Insight
                </Link>
              </li>
              <li>
                <Link href="/sketch/new" className={linkClass}>
                  Creează Sketch
                </Link>
              </li>
              <li>
                <Link href="/sketch/boards" className={linkClass}>
                  Sketch Boards
                </Link>
              </li>
              <li>
                <Link href="/register" className={linkClass}>
                  Înregistrare
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t ${borderColor} mt-12 pt-8 text-center`}>
          <p className={`text-sm ${bodyTextClass}`}>
            &copy; {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  )
}
