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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-500">Class</h3>
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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-500">Child</h3>
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
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-500">Parent / Guardian</h3>
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
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
      </button>
    </div>
  );
}
