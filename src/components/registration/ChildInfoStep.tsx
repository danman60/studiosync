'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from './RegistrationWizard';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
  minAge: number | null;
  maxAge: number | null;
  seasonStartDate: string | null;
}

export function ChildInfoStep({ form, minAge, maxAge, seasonStartDate }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Child Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about the dancer you&apos;d like to register.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="child.firstName" className="block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="child.firstName"
            type="text"
            {...register('child.firstName')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.child?.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.child.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="child.lastName" className="block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="child.lastName"
            type="text"
            {...register('child.lastName')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.child?.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.child.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="child.dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          id="child.dateOfBirth"
          type="date"
          {...register('child.dateOfBirth')}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.child?.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.child.dateOfBirth.message}</p>
        )}
        {minAge != null && maxAge != null && seasonStartDate && (
          <p className="mt-1 text-xs text-gray-400">
            Ages {minAge}–{maxAge} at season start ({new Date(seasonStartDate).toLocaleDateString()})
          </p>
        )}
      </div>

      <div>
        <label htmlFor="child.gender" className="block text-sm font-medium text-gray-700">
          Gender <span className="text-gray-400">(optional)</span>
        </label>
        <select
          id="child.gender"
          {...register('child.gender')}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="non-binary">Non-binary</option>
        </select>
      </div>

      <div>
        <label htmlFor="child.medicalNotes" className="block text-sm font-medium text-gray-700">
          Medical Notes / Allergies <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="child.medicalNotes"
          rows={3}
          {...register('child.medicalNotes')}
          placeholder="Any medical conditions, allergies, or special needs the instructor should know about"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
