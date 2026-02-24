'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from './RegistrationWizard';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
  minAge: number | null;
  maxAge: number | null;
  seasonStartDate: string | null;
}

const inputClass = 'mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

export function StudentInfoStep({ form, minAge, maxAge, seasonStartDate }: Props) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Student Information</h2>
        <p className="mt-1 text-sm text-stone-500">
          Tell us about the dancer you&apos;d like to register.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="student.firstName" className="block text-sm font-medium text-stone-700">
            Student First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="student.firstName"
            type="text"
            {...register('student.firstName')}
            className={inputClass}
          />
          {errors.student?.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.student.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="student.lastName" className="block text-sm font-medium text-stone-700">
            Student Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="student.lastName"
            type="text"
            {...register('student.lastName')}
            className={inputClass}
          />
          {errors.student?.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.student.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="student.dateOfBirth" className="block text-sm font-medium text-stone-700">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          id="student.dateOfBirth"
          type="date"
          {...register('student.dateOfBirth')}
          className={inputClass}
        />
        {errors.student?.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.student.dateOfBirth.message}</p>
        )}
        {minAge != null && maxAge != null && seasonStartDate && (
          <p className="mt-1 text-xs text-stone-400">
            Student must be ages {minAge}–{maxAge} at season start ({new Date(seasonStartDate).toLocaleDateString()})
          </p>
        )}
      </div>

      <div>
        <label htmlFor="student.gender" className="block text-sm font-medium text-stone-700">
          Gender <span className="text-stone-400">(optional)</span>
        </label>
        <select
          id="student.gender"
          {...register('student.gender')}
          className={inputClass}
        >
          <option value="">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="non-binary">Non-binary</option>
        </select>
      </div>

      <div>
        <label htmlFor="student.medicalNotes" className="block text-sm font-medium text-stone-700">
          Medical Notes / Allergies <span className="text-stone-400">(optional)</span>
        </label>
        <textarea
          id="student.medicalNotes"
          rows={3}
          {...register('student.medicalNotes')}
          placeholder="Any medical conditions, allergies, or special needs the instructor should know about"
          className={`${inputClass} placeholder:text-stone-400`}
        />
      </div>
    </div>
  );
}
