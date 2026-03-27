import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Peixos Puignau - Automatizacion Contable',
  description: 'Automatizacion de imputacion contable de nominas para Peixos Puignau S.A.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
