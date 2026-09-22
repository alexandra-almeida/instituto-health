import type { SVGProps } from 'react'

// Ícones inline em SVG (sem dependência externa), traço único, herdam a cor
// do texto via currentColor para se adaptarem ao verde/dourado da marca.

export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7.5H6" />
    </svg>
  )
}

export function TulipiaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 13c-2.5-1-3.5-3.6-2.6-6.2C10.3 4.7 12 3.3 12 3.3s1.7 1.4 2.6 3.5c1 2.6 0 5.2-2.6 6.2Z" />
      <path d="M12 13c-3.4-.2-6 1.3-7 3.6 1.6.6 3.6.5 5-.4" />
      <path d="M12 13c3.4-.2 6 1.3 7 3.6-1.6.6-3.6.5-5-.4" />
      <path d="M12 13v8" />
    </svg>
  )
}

export function HospitalarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

export function JulianaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  )
}

export function ServicosIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3.5 9.4 6.6l-4-.8-.8 4-3.1 2.6 3.1 2.6.8 4 4-.8L12 20.5l2.6-3.1 4 .8.8-4 3.1-2.6-3.1-2.6-.8-4-4 .8Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.6-.3Z" />
      <path d="M12 2.5A9.5 9.5 0 0 0 3.6 17l-1.1 4 4.2-1.1A9.5 9.5 0 1 0 12 2.5Zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-2.5.6.6-2.4-.2-.3a7.8 7.8 0 1 1 6.4 3.4Z" />
    </svg>
  )
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.9.2-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 3.9v2.2H7.9v3h2.5V21h3.1Z" />
    </svg>
  )
}

export function HeartIcon({
  filled,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20.2s-7.4-4.6-10-9.2C.4 7.9 2 4.5 5.4 3.8c2-.4 3.9.5 5 2.1a1 1 0 0 0 1.6 0c1.1-1.6 3-2.5 5-2.1 3.4.7 5 4.1 3.4 7.2-2.6 4.6-10 9.2-10 9.2Z" />
    </svg>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </svg>
  )
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  )
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3.2 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-2.8Z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </svg>
  )
}

// ---- Selos de confiança (página de produto) ----------------------------

export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 6h11v10h-11z" />
      <path d="M13.5 10h3.5l3.5 3.3V16h-7z" />
      <circle cx="7" cy="18" r="1.7" />
      <circle cx="17" cy="18" r="1.7" />
    </svg>
  )
}

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6" />
      <path d="M18 3v3.5h-3.5" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M6 21v-3.5h3.5" />
    </svg>
  )
}

export function BodyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="5.2" r="2.2" />
      <path d="M12 8v6" />
      <path d="M8.5 11 12 9.5 15.5 11" />
      <path d="M9 21l2-6h2l2 6" />
    </svg>
  )
}

// Bonequinho — ícone de usuário/cadastro, no mesmo estilo de traço dos
// demais ícones do header.
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
    </svg>
  )
}

// Carrinho de compras com um "+" sobreposto no canto — usado em ações de
// "compra rápida" (mesma ideia do BagPlusIcon, mas com carrinho em vez de
// sacola, no mesmo estilo do CartIcon do header).
export function CartPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle
        cx="8.5"
        cy="20.5"
        r="1.3"
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <circle
        cx="16"
        cy="20.5"
        r="1.3"
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <path
        d="M1.5 3h2l2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L18 8"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18.5" cy="5.5" r="3.3" fill="currentColor" />
      <path
        d="M18.5 3.9v3.2M16.9 5.5h3.2"
        stroke="white"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ---- Ícones de serviços -------------------------------------------------

export function GraduationCapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 4.5 2.5 9 12 13.5 21.5 9 12 4.5Z" />
      <path d="M6.5 11.2v4.3c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.3" />
      <path d="M21.5 9v6" />
    </svg>
  )
}

export function VideoCallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="m15.5 10.2 5-2.7v9l-5-2.7" />
      <circle cx="9" cy="11" r="2.1" />
      <path d="M6 15.3c.6-1.2 1.7-1.8 3-1.8s2.4.6 3 1.8" />
    </svg>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 5-7 7 7 7" />
    </svg>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

// Hambúrguer — abre o menu de navegação em telas pequenas.
export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  )
}

// ---- Ícones da vitrine de procedimentos (home) ---------------------------

export function SyringeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m20.5 3.5-2 2M17 5l2.5 2.5-9 9-3-1-1-3 9-9Z" />
      <path d="M9 14.5 4 19.5M6 21l-1.5-1.5" />
      <path d="M13 6l2 2" />
    </svg>
  )
}

export function GlowFaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2" />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  )
}

export function DrenagemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 8c2 2 2 4 0 6M9 6c2 2 2 8 0 10M14 8c2 2 2 4 0 6M19 6c2 2 2 8 0 10" />
    </svg>
  )
}

export function RazorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 4v9a3.5 3.5 0 0 0 7 0V4" />
      <path d="M6 4h7M9.5 13v7" />
    </svg>
  )
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3.5 8 4.5-8 4.5-8-4.5 8-4.5Z" />
      <path d="m4 12.5 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </svg>
  )
}

// Estrela — avaliação de produto (página de detalhe da Tulípia).
export function StarIcon({
  filled,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3.3 2.6 5.6 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-.7 2.6-5.6Z" />
    </svg>
  )
}

// ---- Cadastro (/cadastro) -----------------------------------------------

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7c.45-.1.9-.15 1.4-.15 6.2 0 9.5 6.5 9.5 6.5a13 13 0 0 1-3.1 3.9M6.7 6.9C4.2 8.6 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.4 0 2.6-.3 3.7-.85" />
      <path d="M9.9 10.1a2.8 2.8 0 0 0 3.9 3.9" />
    </svg>
  )
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.6 2.6 5.4-5.8" />
    </svg>
  )
}
