'use client';

import { useAccount } from '@/contexts/account-context';
import { ProfileForm } from '@/components/loja/conta/profile-form';
import { ChangePasswordForm } from '@/components/loja/conta/change-password-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function PerfilPage() {
  const { profile } = useAccount();

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-serif text-xl text-flor-800">Informações pessoais</h2>
        <ProfileForm profile={profile} />
      </section>

      <div className="border-t" />

      <section>
        <h2 className="mb-4 font-serif text-xl text-flor-800">Segurança</h2>
        {profile.hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 max-w-md">
            <p className="text-sm font-medium text-stone-800">Conta vinculada ao Google</p>
            <p className="mt-1 text-sm text-stone-500">
              Sua conta usa login pelo Google. Gerencie sua senha diretamente pelo Google.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
