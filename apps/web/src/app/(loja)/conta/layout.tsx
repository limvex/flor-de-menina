import { redirect } from 'next/navigation';
import { requireCustomer } from '@/lib/auth/require-customer';
import { AccountProvider } from '@/contexts/account-context';
import { AccountSidebar } from '@/components/loja/conta/account-sidebar';
import { AccountMobileNav } from '@/components/loja/conta/account-mobile-nav';

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  if (!user) redirect('/login?redirect=/conta');

  return (
    <AccountProvider>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex gap-10">
          <AccountSidebar />
          <div className="flex-1 min-w-0">
            <AccountMobileNav />
            {children}
          </div>
        </div>
      </div>
    </AccountProvider>
  );
}
