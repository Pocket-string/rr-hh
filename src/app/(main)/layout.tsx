'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navSections = [
  {
    title: 'General',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    ],
  },
  {
    title: 'Maestros',
    items: [
      { href: '/employees', label: 'Empleados', icon: '◉' },
      { href: '/departments', label: 'Departamentos', icon: '▦' },
      { href: '/concepts', label: 'Conceptos', icon: '≋' },
    ],
  },
  {
    title: 'Nominas',
    items: [
      { href: '/variables', label: 'Datos Variables', icon: '✎' },
      { href: '/upload', label: 'Subir IC', icon: '↑' },
      { href: '/ic', label: 'ICs Cargados', icon: '≡' },
    ],
  },
  {
    title: 'Contabilidad',
    items: [
      { href: '/rules', label: 'Reglas Contables', icon: '⚙' },
      { href: '/entries', label: 'Asientos', icon: '₪' },
    ],
  },
]

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold">Peixos Puignau</h1>
          <p className="text-xs text-slate-400 mt-1">Gestion de Nominas</p>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">PRP-002 v1.0</p>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
