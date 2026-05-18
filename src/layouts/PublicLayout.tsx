import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Logo className="h-10 w-10 drop-shadow-md" />
            <span className="text-xl font-extrabold tracking-tight hidden sm:inline-block bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Ladakh Placement</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Jobs</Link>
            <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">Admin Login</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Ladakh Placement Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
