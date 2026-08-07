import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-extrabold text-white mb-4 flex items-center">
              <span className="text-orange-500">India</span> 
              <span className="text-blue-400 ml-1">Tour Operators</span> 
            </h2>
            <p className="text-sm text-gray-400 mb-4 max-w-sm leading-relaxed">
              Discover the beauty of India with our verified vendors. Best cab services, tour packages, and comfortable stays all in one place.
            </p>
            <p className="text-sm">📧 rajtours14@gmail.com</p>
            <p className="text-sm mt-1">📞 +91 98924 55466</p>
          </div>

          {/* Quick Links (For Customers) */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link href="/tours" className="hover:text-blue-400 transition-colors">Tour Packages</Link></li>
              <li><Link href="/cabs" className="hover:text-blue-400 transition-colors">Book a Cab</Link></li>
              <li><Link href="/hotels" className="hover:text-blue-400 transition-colors">Find Hotels</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-blue-400 transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* For Partners / Legal */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">For Partners</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-orange-400 transition-colors">Register as Vendor</Link></li>
              <li><Link href="/login" className="hover:text-orange-400 transition-colors">Vendor Login</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500 space-y-2">
          <p>© {new Date().getFullYear()} India Tour Operators. All rights reserved.</p>
          <p className="text-xs">
            Operated & Managed by{' '}
            <a 
              href="https://rajcabs.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-orange-500 hover:underline font-bold"
            >
              Raj Cabs
            </a>{' '}
            &{' '}
            <a 
              href="https://tourismdna.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-orange-500 hover:underline font-bold"
            >
              Tourism DNA
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}