import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Cormorant_Garamond, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ReactQueryProvider } from '@/lib/query-client';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE = 'https://flordemenina.store';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Flor de Menina',
  url: SITE,
  logo: `${SITE}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Portuguese',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Maceió',
    addressRegion: 'AL',
    addressCountry: 'BR',
  },
  sameAs: ['https://www.instagram.com/lojaflordemenina'],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Flor de Menina — Moda Feminina em Maceió-AL',
    template: '%s | Flor de Menina',
  },
  description:
    'Loja de moda feminina com peças selecionadas, qualidade e estilo. Entregamos para todo o Brasil.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE,
    siteName: 'Flor de Menina',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {gtmId ? (
          <noscript>
            <iframe
              title="Google Tag Manager"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <NuqsAdapter>
          <ReactQueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </ReactQueryProvider>
        </NuqsAdapter>
        {gtmId ? (
          <Script id="gtm-script" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}
        {pixelId ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
