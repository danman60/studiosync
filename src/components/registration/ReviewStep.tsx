'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from './RegistrationWizard';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ClassInfo {
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  monthly_price: number | null;
  registration_fee: number | null;
  class_types: { name: string; color: string } | null;
  levels: { name: string } | null;
}

export interface PromoCodeResult {
  promoCodeId: string;
  code: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  description: string | null;
}

interface Props {
  form: UseFormReturn<RegistrationFormData>;
  classInfo: ClassInfo;
  isSubmitting: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  appliedPromo: PromoCodeResult | null;
  onApplyPromo: (promo: PromoCodeResult | null) => void;
}

export function ReviewStep({ form, classInfo, isSubmitting, onSubmit, submitLabel, appliedPromo, onApplyPromo }: Props) {
  const values = form.getValues();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateQuery = trpc.promo.validate.useQuery(
    { code: promoInput.trim(), context: 'registration' },
    { enabled: false }
  );

  async function handleValidatePromo() {
    if (!promoInput.trim()) return;
    setPromoError(null);
    setIsValidating(true);

    try {
      const result = await validateQuery.refetch();
      const data = result.data;
      if (!data || !data.valid) {
        setPromoError(data?.message ?? 'Invalid code');
        onApplyPromo(null);
      } else {
        onApplyPromo({
          promoCodeId: data.promoCodeId,
          code: data.code,
          discount_type: data.discount_type as 'flat' | 'percent',
          discount_value: data.discount_value,
          description: data.description ?? null,
        });
        setPromoError(null);
      }
    } catch {
      setPromoError('Failed to validate code');
    } finally {
      setIsValidating(false);
    }
  }

  function handleRemovePromo() {
    onApplyPromo(null);
    setPromoInput('');
    setPromoError(null);
  }

  function formatDiscount(promo: PromoCodeResult): string {
    if (promo.discount_type === 'percent') {
      return `${promo.discount_value / 100}% off`;
    }
    return `$${(promo.discount_value / 100).toFixed(2)} off`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please verify the information below is correct.
        </p>
      </div>

      {/* Class */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Class</p>
        <p className="mt-1 font-semibold text-gray-900">{classInfo.name}</p>
        <p className="text-sm text-gray-600">
          {DAYS_OF_WEEK[classInfo.day_of_week]}s, {formatTime(classInfo.start_time)} – {formatTime(classInfo.end_time)}
        </p>
        {classInfo.monthly_price != null && (
          <p className="text-sm text-gray-600">
            ${classInfo.monthly_price}/month
            {classInfo.registration_fee != null && classInfo.registration_fee > 0 && (
              <span> + ${classInfo.registration_fee} registration fee</span>
            )}
          </p>
        )}
      </div>

      {/* Student */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Student</p>
        <p className="mt-1 font-semibold text-gray-900">
          {values.student.firstName} {values.student.lastName}
        </p>
        <p className="text-sm text-gray-600">
          Born: {new Date(values.student.dateOfBirth).toLocaleDateString()}
        </p>
        {values.student.gender && (
          <p className="text-sm text-gray-600">Gender: {values.student.gender}</p>
        )}
        {values.student.medicalNotes && (
          <p className="text-sm text-gray-600">Medical: {values.student.medicalNotes}</p>
        )}
      </div>

      {/* Parent */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Parent / Guardian</p>
        <p className="mt-1 font-semibold text-gray-900">
          {values.parent.firstName} {values.parent.lastName}
        </p>
        <p className="text-sm text-gray-600">{values.parent.email}</p>
        {values.parent.phone && (
          <p className="text-sm text-gray-600">{values.parent.phone}</p>
        )}
        {values.parent.emergencyContactName && (
          <p className="text-sm text-gray-600">
            Emergency: {values.parent.emergencyContactName}
            {values.parent.emergencyContactPhone && ` (${values.parent.emergencyContactPhone})`}
          </p>
        )}
      </div>

      {/* Promo Code */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Promo Code</p>
        {appliedPromo ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="font-mono text-sm font-semibold text-emerald-700">{appliedPromo.code}</span>
              <span className="text-sm text-emerald-600">— {formatDiscount(appliedPromo)}</span>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono transition-shadow input-glow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleValidatePromo();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleValidatePromo}
                disabled={!promoInput.trim() || isValidating}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gray-100 px-4 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {isValidating ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                Apply
              </button>
            </div>
            {promoError && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <XCircle size={12} /> {promoError}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn-gradient flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
      >
        {isSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          submitLabel ?? 'Submit Registration'
        )}
      </button>
    </div>
  );
}
