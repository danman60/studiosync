'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';
import { StudentInfoStep } from './StudentInfoStep';
import { ParentInfoStep } from './ParentInfoStep';
import { ReviewStep, type PromoCodeResult } from './ReviewStep';
import { ConfirmationStep } from './ConfirmationStep';
import { WaiverStep } from './WaiverStep';

const registrationSchema = z.object({
  student: z.object({
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

interface WaiverSignatureData {
  waiverId: string;
  waiverVersion: number;
  accepted: boolean;
  signedName: string;
}

const STEP_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  0: ['student'],
  1: ['parent'],
};

interface Props {
  classId: string;
}

export function RegistrationWizard({ classId }: Props) {
  const [step, setStep] = useState(0);
  const [existingFamilyId, setExistingFamilyId] = useState<string | null>(null);
  const [waiverSignatures, setWaiverSignatures] = useState<WaiverSignatureData[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeResult | null>(null);
  const [result, setResult] = useState<{
    status: 'pending' | 'waitlisted';
    waitlistPosition: number | null;
    studentName: string;
    className: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      student: { firstName: '', lastName: '', dateOfBirth: '', gender: '', medicalNotes: '' },
      parent: { firstName: '', lastName: '', email: '', phone: '', emergencyContactName: '', emergencyContactPhone: '' },
    },
    mode: 'onBlur',
  });

  const classQuery = trpc.registration.getClassForRegistration.useQuery({ classId });
  const waiversQuery = trpc.waiver.getForRegistration.useQuery({ classId });
  const submitMutation = trpc.registration.submit.useMutation();

  const cls = classQuery.data;
  const waivers = waiversQuery.data ?? [];
  const hasWaivers = waivers.length > 0;

  // Steps: 0=Student, 1=Parent, 2=Review, 3=Waivers (if any), last=Confirmation
  const STEPS = hasWaivers
    ? ['Student Info', 'Parent Info', 'Review', 'Waivers', 'Confirmation'] as const
    : ['Student Info', 'Parent Info', 'Review', 'Confirmation'] as const;
  const REVIEW_STEP = 2;
  const WAIVER_STEP = hasWaivers ? 3 : -1;
  const CONFIRMATION_STEP = hasWaivers ? 4 : 3;

  function validateAge(): string | null {
    if (!cls) return null;
    const dob = form.getValues('student.dateOfBirth');
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
      return `Student must be at least ${cls.min_age} years old at the start of the season (currently ${age})`;
    }
    if (cls.max_age != null && age > cls.max_age) {
      return `Student must be ${cls.max_age} years old or younger at the start of the season (currently ${age})`;
    }
    return null;
  }

  async function handleNext() {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await form.trigger(fields as unknown as (keyof RegistrationFormData)[]);
      if (!valid) return;
    }

    if (step === 0) {
      const ageError = validateAge();
      if (ageError) {
        form.setError('student.dateOfBirth', { message: ageError });
        return;
      }
    }

    // When moving to waiver step, initialize signatures
    if (step === REVIEW_STEP && hasWaivers) {
      if (waiverSignatures.length === 0) {
        setWaiverSignatures(
          waivers.map((w) => ({
            waiverId: w.id,
            waiverVersion: w.version,
            accepted: false,
            signedName: '',
          }))
        );
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

    // Build waiver signatures for submission
    const signedWaivers = hasWaivers
      ? waiverSignatures
          .filter((s) => s.accepted && s.signedName.trim())
          .map((s) => ({
            waiverId: s.waiverId,
            waiverVersion: s.waiverVersion,
            parentName: s.signedName.trim(),
          }))
      : undefined;

    try {
      const res = await submitMutation.mutateAsync({
        classId,
        student: {
          firstName: values.student.firstName,
          lastName: values.student.lastName,
          dateOfBirth: values.student.dateOfBirth,
          gender: values.student.gender || undefined,
          medicalNotes: values.student.medicalNotes || undefined,
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
        waiverSignatures: signedWaivers,
        promoCodeId: appliedPromo?.promoCodeId,
      });

      setResult({
        status: res.status,
        waitlistPosition: res.waitlistPosition,
        studentName: res.studentName,
        className: res.className,
      });
      setStep(CONFIRMATION_STEP);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    }
  }

  if (classQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="skeleton h-6 w-40 mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-10 w-full rounded-xl" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
              <div className="skeleton h-10 w-full rounded-xl" />
              <div className="skeleton h-10 w-full rounded-xl" />
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div>
          <div className="glass-card rounded-2xl p-5">
            <div className="skeleton h-5 w-16 rounded-full mb-2" />
            <div className="skeleton h-5 w-32 mb-1" />
            <div className="skeleton h-4 w-40 mb-3" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (classQuery.error || !cls) {
    return (
      <div className="glass-card rounded-2xl border-red-200 p-6 text-center animate-fade-in-up">
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

  const stepCountForIndicator = hasWaivers ? 4 : 3;
  const parentName = `${form.getValues('parent.firstName')} ${form.getValues('parent.lastName')}`.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Class Summary Sidebar */}
      <div className="order-first lg:order-last">
        <div className="sticky top-24 glass-card rounded-2xl p-5 animate-fade-in-up">
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
              <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
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
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className={`h-2 w-2 rounded-full ${
                isFull ? 'bg-red-500' : spotsLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
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
        {step < CONFIRMATION_STEP && (
          <div className="mb-6 flex items-center gap-2 animate-fade-in-up">
            {STEPS.slice(0, stepCountForIndicator).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium transition-all ${
                    i === step
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
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
                {i < stepCountForIndicator - 1 && <div className="mx-1 h-px w-6 bg-gray-200" />}
              </div>
            ))}
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-1">
          {submitError && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {step === 0 && (
            <StudentInfoStep
              form={form}
              minAge={cls.min_age}
              maxAge={cls.max_age}
              seasonStartDate={seasons?.start_date ?? null}
            />
          )}

          {step === 1 && (
            <ParentInfoStep form={form} onExistingFamily={setExistingFamilyId} />
          )}

          {step === REVIEW_STEP && (
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
              isSubmitting={!hasWaivers && submitMutation.isPending}
              onSubmit={hasWaivers ? handleNext : handleSubmit}
              submitLabel={hasWaivers ? 'Continue to Waivers' : undefined}
              appliedPromo={appliedPromo}
              onApplyPromo={setAppliedPromo}
            />
          )}

          {step === WAIVER_STEP && hasWaivers && (
            <WaiverStep
              waivers={waivers}
              parentName={parentName}
              signatures={waiverSignatures}
              onSignaturesChange={setWaiverSignatures}
              isSubmitting={submitMutation.isPending}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          )}

          {step === CONFIRMATION_STEP && result && (
            <ConfirmationStep
              status={result.status}
              waitlistPosition={result.waitlistPosition}
              studentName={result.studentName}
              className={result.className}
            />
          )}

          {/* Navigation for steps 0-1 */}
          {step < REVIEW_STEP && (
            <div className="mt-6 flex justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-11 items-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={handleNext}
                className="btn-gradient flex h-11 items-center rounded-xl px-6 text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}

          {/* Back button on Review step (no waivers case — with waivers, ReviewStep handles its own back) */}
          {step === REVIEW_STEP && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex h-10 items-center rounded-xl px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
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
