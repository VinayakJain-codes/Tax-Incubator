'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const navSections = [
  {
    title: null,
    items: [
      { href: '/dashboard', label: 'Home', icon: '⊞' },
    ],
  },
  {
    title: 'GROUP DATA',
    items: [
      { href: '/sheets/entities', label: 'Entity Master', icon: '⬡' },
      { href: '/sheets/addresses', label: 'Addresses', icon: '◎' },
      { href: '/sheets/directors', label: 'Directors & Officers', icon: '◉' },
      { href: '/sheets/ubo', label: 'UBO Register', icon: '◈' },
      { href: '/sheets/banks', label: 'Bank Accounts', icon: '▦' },
      { href: '/sheets/signatories', label: 'Signatories', icon: '✦' },
    ],
  },
  {
    title: 'COMPLIANCE',
    items: [
      { href: '/sheets/vat', label: 'VAT Regulatory Matrix', icon: '▤' },
      { href: '/sheets/ct', label: 'Corporate Tax Matrix', icon: '▥' },
      { href: '/sheets/licenses', label: 'Licenses & Regulatory', icon: '▧' },
      { href: '/sheets/auditors', label: 'Auditors', icon: '◇' },
    ],
  },
  {
    title: 'CONTROLS & DOCUMENTS',
    items: [
      { href: '/sheets/documents', label: 'Document Control', icon: '▨' },
      { href: '/sheets/controls', label: 'Controls Log', icon: '◆' },
    ],
  },
];

export default function SheetSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <aside className="w-64 flex flex-col shrink-0 h-full bg-white border-r border-gray-200">
      {/* Logo Header */}
      <div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-gray-100">
        <span className="text-gray-900 font-black text-lg" style={{ letterSpacing: '0.2em' }}>SYMAX</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        {navSections.map((section, si) => (
          <div key={si} className="mb-6">
            {section.title && (
              <p
                className="text-[0.65rem] font-bold px-6 py-2 uppercase text-gray-400"
                style={{ letterSpacing: '0.1em' }}
              >
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-2 text-sm font-medium transition-colors duration-150 relative ${
                      isActive
                        ? 'text-black bg-gray-50'
                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />
                    )}
                    <span className="text-sm shrink-0 w-5 flex justify-center" style={{ opacity: isActive ? 1 : 0.6 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-black hover:bg-gray-50 transition-colors duration-150 rounded-lg group"
        >
          <span className="text-sm shrink-0 w-5 flex justify-center opacity-60 group-hover:opacity-100">↪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
