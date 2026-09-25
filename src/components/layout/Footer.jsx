import { Link } from 'react-router-dom'
import { Shield, Truck, RotateCcw, MessageSquare, Facebook, Twitter, Instagram } from 'lucide-react'

const footerLinks = {
  producto: [
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'Cómo funciona', href: '#' },
    { label: 'Precios', href: '#' },
    { label: 'FAQ', href: '#' },
  ],
  empresa: [
    { label: 'Sobre nosotros', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Prensa', href: '#' },
    { label: 'Carreras', href: '#' },
  ],
  soporte: [
    { label: 'Centro de ayuda', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'Términos', href: '#' },
    { label: 'Privacidad', href: '#' },
  ],
  legal: [
    { label: 'Términos de servicio', href: '#' },
    { label: 'Política de privacidad', href: '#' },
    { label: 'Política de cookies', href: '#' },
  ],
}

const features = [
  { icon: Shield, title: 'Transacciones seguras', desc: 'Pagos protegidos y verificación dual' },
  { icon: Truck, title: 'Entrega en campus', desc: 'Recoge y entrega en tu universidad' },
  { icon: RotateCcw, title: 'Devolución fácil', desc: 'Proceso simple sin complicaciones' },
  { icon: MessageSquare, title: 'Soporte 24/7', desc: 'Estamos aquí para ayudarte' },
]

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="UniTrade Inicio">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-xl font-bold text-white">UniTrade</span>
            </Link>
            <p className="text-sm text-gray-400 mb-6">
              Plataforma de alquiler entre universitarios. Ahorra dinero, comparte recursos.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Producto</h3>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Soporte</h3>
            <ul className="space-y-3">
              {footerLinks.soporte.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{title}</h4>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} UniTrade. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-500">
            Hecho con ❤️ para estudiantes universitarios
          </p>
        </div>
      </div>
    </footer>
  )
}