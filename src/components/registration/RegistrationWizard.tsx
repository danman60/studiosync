'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';
import { ChildInfoStep } from './ChildInfoStep';
import { ParentInfoStep } from './ParentInfoStep';
import { ReviewStep } from './ReviewStep';
import { ConfirmationStep } from './ConfirmationStep';

const registrationSchema = z.object({
  child: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().optional(),
    medicalNotes: z.string().optional(),
  }),
  parent: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
  }),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

const STEPS = ['Child Info', 'Parent Info', 'Review', 'Confirmation'] as const;
const STEP_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  0: ['child'],
  1: ['parent'],
};

interface Props {
  classId: string;
}

export function RegistrationWizard({ classId }: Props) {
  const [step, setStep] = useState(0);
  const [existingFamilyId, setExistingFamilyId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: 'pending' | 'waitlisted';
    waitlistPosition: number | null;
    childName: string;
    className: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      child: { firstName: '', lastName: '', dateOfBirth: '', gender: '', medicalNotes: '' },
      parent: { firstName: '', lastName: '', email: '', phone: '', emergencyContactName: '', emergencyContactPhone: '' },
    },
    mode: 'onBlur',
  });

  const classQuery = trpc.registration.getClassForRegistration.useQuery({ classId });
  const submitMutation = trpc.registration.submit.useMutation();

  const cls = classQuery.data;

  function validateAge(): string | null {
    if (!cls) return null;
    const dob = form.getValues('child.dateOfBirth');
    if (!dob) return null;

    const seasonsData = cls.seasons as unknown as { start_date: string } | { start_date: string }[] | null;
    const seasonStart = Array.isArray(seasonsData) ? seasonsData[0]?.start_date : seasonsData?.start_date;
    if (!seasonStart) return null;

    const ref = new Date(seasonStart);
    const birth = new Date(dob);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;

    if (cls.min_age != null && age < cls.min_age) {
      return `Child must be at least ${cls.min_age} years old at the start of the season (currently ${age})`;
    }
    if (cls.max_age != null && age > cls.max_age) {
      return `Child must be ${cls.max_age} years old or younger at the start of the season (currently ${age})`;
    }
    return null;
  }

  async function handleNext() {
    const fields = STEP_FIELDS[step];
    if (fields) {
      // Validate current step fields
      const valid = await form.trigger(fields as unknown as (keyof RegistrationFormData)[]);
      if (!valid) return;
    }

    // Age validation on step 0
    if (step === 0) {
      const ageError = validateAge();
      if (ageError) {
        form.setError('child.dateOfBirth', { message: ageError });
        return;
      }
    }

    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitError(null);
    const values = form.getValues();

    try {
      const res = await submitMutation.mutateAsync({
        classId,
        child: {
          firstName: values.child.firstName,
          lastName: values.child.lastName,
          dateOfBirth: values.child.dateOfBirth,
          gender: values.child.gender || undefined,
          medicalNotes: values.child.medicalNotes || undefined,
        },
        parent: {
          firstName: values.parent.firstName,
          lastName: values.parent.lastName,
          email: values.parent.email,
          phone: values.parent.phone || undefined,
          emergencyContactName: values.parent.emergencyContactName || undefined,
          emergencyContactPhone: values.parent.emergencyContactPhone || undefined,
        },
        existingFamilyId: existingFamilyId ?? undefined,
      });

      setResult({
        status: res.status,
        waitlistPosition: res.waitlistPosition,
        childName: res.childName,
        className: res.className,
      });
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    }
  }

  if (classQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (classQuery.error || !cls) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">Class not found</p>
        <p className="mt-1 text-sm text-red-600">This class may no longer be available for registration.</p>
      </div>
    );
  }

  const spotsLeft = cls.capacity - cls.enrolled_count;
  const isFull = spotsLeft <= 0;
  const classTypes = cls.class_types as unknown as { name: string; color: string } | null;
  const levels = cls.levels as unknown as { name: string } | null;
  const rawSeasons = cls.seasons as unknown as { name: string; start_date: string; end_date: string } | { name: string; start_date: string; end_date: string }[] | null;
  const seasons = Array.isArray(rawSeasons) ? rawSeasons[0] ?? null : rawSeasons;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Class Summary Sidebar */}
      <div className="order-first lg:order-last">
        <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            {classTypes && (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: classTypes.color }}
              >
                {classTypes.name}
              </span>
            )}
            {levels && (
              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {levels.name}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-gray-900">{cls.name}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {DAYS_OF_WEEK[cls.day_of_week]}s, {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
          </p>
          {seasons && (
            <p className="text-sm text-gray-500">{seasons.name}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isFull ? 'bg-red-500' : spotsLeft <= 3 ? 'bg-amber-500' : 'bg-green-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {isFull ? 'Waitlist only' : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="lg:col-span-2">
        {/* Step Indicator */}
        {step < 3 && (
          <div className="mb-6 flex items-center gap-2">
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    i === step
                      ? 'bg-indigo-600 text-white'
                      : i < step
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`hidden text-sm sm:inline ${
                    i === step ? 'font-medium text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {i < 2 && <div className="mx-1 h-px w-6 bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </div>
          )}

          {step === 0 && (
            <ChildInfoStep
              form={form}
              minAge={cls.min_age}
              maxAge={cls.max_age}
              seasonStartDate={seasons?.start_date ?? null}
            />
          )}

          {step === 1 && (
            <ParentInfoStep form={form} onExistingFamily={setExistingFamilyId} />
          )}

          {step === 2 && (
            <ReviewStep
              form={form}
              classInfo={{
                name: cls.name,
                day_of_week: cls.day_of_week,
                start_time: cls.start_time,
                end_time: cls.end_time,
                monthly_price: cls.monthly_price,
                registration_fee: cls.registration_fee,
                class_types: classTypes,
                levels: levels,
              }}
              isSubmitting={submitMutation.isPending}
              onSubmit={handleSubmit}
            />
          )}

          {step === 3 && result && (
            <ConfirmationStep
              status={result.status}
              waitlistPosition={result.waitlistPosition}
              childName={result.childName}
              className={result.className}
            />
          )}

          {/* Navigation */}
          {step < 2 && (
            <div className="mt-6 flex justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                &larr; Go back and edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
