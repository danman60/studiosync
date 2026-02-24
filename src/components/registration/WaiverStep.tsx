'use client';

import { useState } from 'react';
import { Shield, Check } from 'lucide-react';

interface WaiverData {
  id: string;
  title: string;
  content: string;
  is_required: boolean;
  version: number;
}

interface WaiverSignatureData {
  waiverId: string;
  waiverVersion: number;
  accepted: boolean;
  signedName: string;
}

interface Props {
  waivers: WaiverData[];
  parentName: string;
  signatures: WaiverSignatureData[];
  onSignaturesChange: (sigs: WaiverSignatureData[]) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function WaiverStep({ waivers, parentName, signatures, onSignaturesChange, isSubmitting, onSubmit, onBack }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(waivers.length === 1 ? waivers[0].id : null);

  function updateSignature(waiverId: string, field: 'accepted' | 'signedName', value: boolean | string) {
    const updated = signatures.map((s) =>
      s.waiverId === waiverId ? { ...s, [field]: value } : s
    );
    onSignaturesChange(updated);
  }

  const allRequiredSigned = waivers
    .filter((w) => w.is_required)
    .every((w) => {
      const sig = signatures.find((s) => s.waiverId === w.id);
      return sig?.accepted && sig.signedName.trim().length > 0;
    });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-800">Waivers & Agreements</h2>
        <p className="mt-1 text-sm text-stone-500">
          Please review and sign the following {waivers.length === 1 ? 'waiver' : 'waivers'} to complete registration.
        </p>
      </div>

      {waivers.map((waiver) => {
        const sig = signatures.find((s) => s.waiverId === waiver.id);
        const isExpanded = expandedId === waiver.id;
        const isSigned = sig?.accepted && sig.signedName.trim().length > 0;

        return (
          <div
            key={waiver.id}
            className={`rounded-xl border transition-all ${
              isSigned
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-stone-200 bg-white'
            }`}
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : waiver.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isSigned ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary'
                }`}>
                  {isSigned ? <Check size={16} /> : <Shield size={16} />}
                </div>
                <div>
                  <p className="font-medium text-stone-800 text-sm">{waiver.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {waiver.is_required && (
                      <span className="text-[10px] font-medium text-red-600">Required</span>
                    )}
                    {isSigned && (
                      <span className="text-[10px] font-medium text-emerald-600">Signed</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-stone-400">{isExpanded ? 'Collapse' : 'Read & Sign'}</span>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-stone-100 p-4 space-y-4">
                {/* Waiver text */}
                <div className="max-h-64 overflow-y-auto rounded-lg bg-stone-50 p-4 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {waiver.content}
                </div>

                {/* Acceptance checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sig?.accepted ?? false}
                    onChange={(e) => updateSignature(waiver.id, 'accepted', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-stone-700">
                    I have read and agree to the terms of this waiver.
                    {waiver.is_required && <span className="text-red-500"> *</span>}
                  </span>
                </label>

                {/* E-signature (typed name) */}
                {sig?.accepted && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Type your full name as electronic signature
                    </label>
                    <input
                      type="text"
                      value={sig.signedName}
                      onChange={(e) => updateSignature(waiver.id, 'signedName', e.target.value)}
                      placeholder={parentName}
                      className="form-input w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/20 italic"
                    />
                    <p className="mt-1 text-xs text-stone-400">
                      By typing your name above, you acknowledge this constitutes a legally binding electronic signature.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !allRequiredSigned}
        className="btn-gradient flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-lg shadow-primary/15 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          'Submit Registration'
        )}
      </button>

      {!allRequiredSigned && (
        <p className="text-center text-xs text-amber-600">
          Please read and sign all required waivers to continue.
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        className="flex h-10 items-center rounded-xl px-3 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
      >
        &larr; Go back and edit
      </button>
    </div>
  );
}
