'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from './RegistrationWizard';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';

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

interface Props {
  form: UseFormReturn<RegistrationFormData>;
  classInfo: ClassInfo;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function ReviewStep({ form, classInfo, isSubmitting, onSubmit }: Props) {
  const values = form.getValues();

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

      {/* Child */}
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Child</p>
        <p className="mt-1 font-semibold text-gray-900">
          {values.child.firstName} {values.child.lastName}
        </p>
        <p className="text-sm text-gray-600">
          Born: {new Date(values.child.dateOfBirth).toLocaleDateString()}
        </p>
        {values.child.gender && (
          <p className="text-sm text-gray-600">Gender: {values.child.gender}</p>
        )}
        {values.child.medicalNotes && (
          <p className="text-sm text-gray-600">Medical: {values.child.medicalNotes}</p>
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

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn-gradient flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
      >
        {isSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          'Submit Registration'
        )}
      </button>
    </div>
  );
}
