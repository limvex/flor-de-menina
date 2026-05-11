/** Ícones compactos (~22px) para rodapé — marcas são referências visuais genéricas. */

export function VisaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 12" aria-hidden="true">
      <title>Visa</title>
      <rect width="36" height="12" rx="2" fill="#1A1F71" />
      <text
        x="18"
        y="8.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="6"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 20" aria-hidden="true">
      <title>Mastercard</title>
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" fillOpacity="0.95" />
      <path d="M16 4.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z" fill="#FF5F00" />
    </svg>
  );
}

export function EloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 14" aria-hidden="true">
      <title>Elo</title>
      <rect width="40" height="14" rx="2" fill="#0D0D0D" />
      <path
        d="M6 10V4h2.2c1.2 0 2 .6 2 1.6 0 1-.8 1.6-2 1.6H7.2V10H6zm2.8-3.4c0-.5-.4-.8-1-.8H7.2v1.6h.6c.6 0 1-.3 1-.8z"
        fill="#FFCB05"
      />
      <path d="M12.5 10V4h3.4v1H13.7v1.3h1.9v1h-1.9V9h2.2v1h-3.4z" fill="#00A4E4" />
      <path
        d="M18 10l2.2-6h1.3l2.2 6h-1.3l-.4-1.2h-2.2L19.3 10H18zm2.5-4.2-.6 1.8h1.2l-.6-1.8z"
        fill="#EF4123"
      />
      <path d="M25 10V4h1.8l1.4 3.4V4h1.2v6h-1.5L27 6.2V10H25z" fill="#fff" />
    </svg>
  );
}

export function PixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <title>PIX</title>
      <path
        fill="#32BCAD"
        d="M15.1 2.4h-2.2c-.5 0-1 .2-1.4.6l-1.5 1.5-1.5-1.5a2 2 0 0 0-1.4-.6H5.9c-.6 0-1.1.5-1.1 1.1v2.2c0 .5.2 1 .6 1.4l1.5 1.5-1.5 1.5a2 2 0 0 0-.6 1.4v2.2c0 .6.5 1.1 1.1 1.1h2.2c.5 0 1-.2 1.4-.6l1.5-1.5 1.5 1.5c.4.4.9.6 1.4.6h2.2c.6 0 1.1-.5 1.1-1.1v-2.2c0-.5-.2-1-.6-1.4l-1.5-1.5 1.5-1.5c.4-.4.6-.9.6-1.4V3.5c0-.6-.5-1.1-1.1-1.1z"
      />
    </svg>
  );
}
