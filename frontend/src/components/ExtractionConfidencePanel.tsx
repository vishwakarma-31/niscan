import { Sparkles } from 'lucide-react';
import type { Policy } from '@/types/policy.types';

interface ExtractionConfidencePanelProps {
  extractionConfidence: import('@/types/policy.types').ExtractionConfidence | null;
  isRevealed?: boolean;
}

interface ExtractionField {
  label: string;
  policyKey: keyof Policy;
  confidenceKey: string;
}

const extractionFields: ExtractionField[] = [
  { label: 'Policy Number', policyKey: 'policy_number', confidenceKey: 'policy_number' },
  { label: 'Customer Name', policyKey: 'customer_name', confidenceKey: 'customer_name' },
  { label: 'Vehicle Number', policyKey: 'vehicle_number', confidenceKey: 'vehicle_number' },
  { label: 'Insurer Name', policyKey: 'insurer', confidenceKey: 'insurer_name' },
  { label: 'Premium Amount', policyKey: 'premium', confidenceKey: 'premium_amount' },
];

function getConfidenceColor(confidence: number): string {
  if (confidence > 0.8) return 'bg-green-500';
  if (confidence >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getConfidenceTextColor(confidence: number): string {
  if (confidence > 0.8) return 'text-green-400';
  if (confidence >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

export function ExtractionConfidencePanel({
  extractionConfidence,
  isRevealed = true,
}: ExtractionConfidencePanelProps) {
  if (!extractionConfidence) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Extraction Results</h3>
        </div>
        <p className="text-gray-500 text-sm">No extraction data available</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI Extraction Results</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-500 text-xs rounded">
          <Sparkles className="w-3 h-3" />
          GPT-4o-mini
        </span>
      </div>

      <div className="space-y-5">
        {extractionFields.map((field, index) => {
          const fieldData = extractionConfidence?.[field.confidenceKey];
          const isObject = fieldData && typeof fieldData === 'object' && !Array.isArray(fieldData);
          const hasValue = isObject && (fieldData as { value: string | null; confidence: number }).value !== null;
          const confidence = isObject ? (fieldData as { value: string | null; confidence: number }).confidence ?? 0 : 0;
          const value = isObject ? (fieldData as { value: string | null }).value : null;

          return (
            <div
              key={field.confidenceKey}
              className={`transition-all duration-500 ${
                isRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: isRevealed ? `${index * 100}ms` : '0ms' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{field.label}</span>
                {hasValue && (
                  <span className={`text-xs font-medium ${getConfidenceTextColor(confidence)}`}>
                    {Math.round(confidence * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      hasValue ? 'text-gray-800' : 'text-gray-500 italic'
                    }`}
                  >
                    {hasValue ? value : 'Not extracted'}
                  </p>
                </div>
                {hasValue && (
                  <div className="w-24">
                    <div className="confidence-bar">
                      <div
                        className={`${getConfidenceColor(confidence)}`}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}