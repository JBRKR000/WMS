import { GithubIcon, Mail, Phone, MapPin, ExternalLink, Heart } from 'lucide-react'
import { type FC } from 'react'

const Footer: FC = () => {
  return (
    <footer className="shadow bg-surface mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-main mb-3 sm:mb-4">O nas</h3>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-secondary text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-none mx-auto sm:mx-0">
                Nowoczesny system zarządzania magazynem zapewniający efektywność i kontrolę.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-secondary hover:text-main transition-colors duration-300 group">
                <MapPin size={16} className="text-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Bydgoszcz, Polska</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-main mb-3 sm:mb-4">Wsparcie</h3>
            <div className="space-y-2 sm:space-y-3">
              <a href="/help" className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-secondary hover:text-primary transition-all duration-300 group">
                <ExternalLink size={16} className="text-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Centrum pomocy</span>
              </a>
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-secondary hover:text-main transition-colors duration-300 group">
                <Mail size={16} className="text-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <span className="text-xs sm:text-sm break-all sm:break-normal">support@wms.pl</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-secondary hover:text-main transition-colors duration-300 group">
                <Phone size={16} className="text-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <span className="text-xs sm:text-sm">+48 123 456 789</span>
              </div>
            </div>
          </div>

          {/* Additional Info - spans full width on mobile */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left sm:col-span-1 col-span-full">
            <h3 className="text-base sm:text-lg font-semibold text-main mb-3 sm:mb-4">Status</h3>
            <div className="flex flex-col sm:flex-col items-center sm:items-start space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs sm:text-sm">System Online</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-start sm:space-y-1 text-xs sm:text-sm text-secondary">
                <span>Wersja: 1.0.0</span>
                <span className="sm:hidden">•</span>
                <span>Build: {new Date().toISOString().slice(0,10)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-main pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm text-secondary">
              <span>© {new Date().getFullYear()} JBRKR</span>
              <span className="hidden sm:inline">— made with</span>
              <Heart size={14} className="text-red-500 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">in Poland</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <a href="/privacy" className="text-secondary hover:text-primary transition-colors duration-300 whitespace-nowrap">
                Polityka prywatności
              </a>
              <span className="text-secondary hidden sm:inline">•</span>
              <a href="/terms" className="text-secondary hover:text-primary transition-colors duration-300 whitespace-nowrap">
                Regulamin
              </a>
              <span className="text-secondary hidden sm:inline">•</span>
              <a href="https://github.com" className="text-secondary hover:text-primary transition-colors duration-300 flex items-center gap-1 group whitespace-nowrap">
                <GithubIcon size={14} className="group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer