'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { trpc } from '@/lib/trpc';
import type { RegistrationFormData } from './RegistrationWizard';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
  onExistingFamily: (familyId: string | null) => void;
}

const inputClass = 'mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

export function ParentInfoStep({ form, onExistingFamily }: Props) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const email = watch('parent.email');
  const [familyStatus, setFamilyStatus] = useState<'none' | 'returning' | 'has_auth'>('none');

  const checkFamily = trpc.registration.checkExistingFamily.useQuery(
    { email: email?.trim() },
    {
      enabled: false,
    }
  );

  async function handleEmailBlur() {
    if (!email || !email.includes('@')) return;

    const result = await checkFamily.refetch();
    const data = result.data;

    if (!data || !data.exists) {
      setFamilyStatus('none');
      onExistingFamily(null);
      return;
    }

    if (data.hasAuth) {
      setFamilyStatus('has_auth');
      onExistingFamily(null);
      return;
    }

    // Returning family without auth — pre-fill
    setFamilyStatus('returning');
    onExistingFamily(data.familyId);
    if (data.parentFirstName) setValue('parent.firstName', data.parentFirstName);
    if (data.parentLastName) setValue('parent.lastName', data.parentLastName);
    if (data.phone) setValue('parent.phone', data.phone);
    if (data.emergencyContactName) setValue('parent.emergencyContactName', data.emergencyContactName);
    if (data.emergencyContactPhone) setValue('parent.emergencyContactPhone', data.emergencyContactPhone);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Parent / Guardian Information</h2>
        <p className="mt-1 text-sm text-stone-500">
          We&apos;ll use this to create your family account.
        </p>
      </div>

      {familyStatus === 'returning' && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-700">
          Welcome back! We found your family on file. Your info has been pre-filled.
        </div>
      )}

      {familyStatus === 'has_auth' && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-700">
          This email is already associated with an account. Please{' '}
          <a href="/login" className="font-medium underline">
            sign in
          </a>{' '}
          to register additional students.
        </div>
      )}

      <div>
        <label htmlFor="parent.email" className="block text-sm font-medium text-stone-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="parent.email"
          type="email"
          {...register('parent.email')}
          onBlur={handleEmailBlur}
          className={inputClass}
        />
        {errors.parent?.email && (
          <p className="mt-1 text-sm text-red-600">{errors.parent.email.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="parent.firstName" className="block text-sm font-medium text-stone-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="parent.firstName"
            type="text"
            {...register('parent.firstName')}
            className={inputClass}
          />
          {errors.parent?.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.parent.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="parent.lastName" className="block text-sm font-medium text-stone-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="parent.lastName"
            type="text"
            {...register('parent.lastName')}
            className={inputClass}
          />
          {errors.parent?.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.parent.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="parent.phone" className="block text-sm font-medium text-stone-700">
          Phone <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="parent.phone"
          type="tel"
          {...register('parent.phone')}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="parent.emergencyContactName" className="block text-sm font-medium text-stone-700">
            Emergency Contact Name <span className="text-stone-400">(optional)</span>
          </label>
          <input
            id="parent.emergencyContactName"
            type="text"
            {...register('parent.emergencyContactName')}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="parent.emergencyContactPhone" className="block text-sm font-medium text-stone-700">
            Emergency Contact Phone <span className="text-stone-400">(optional)</span>
          </label>
          <input
            id="parent.emergencyContactPhone"
            type="tel"
            {...register('parent.emergencyContactPhone')}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
