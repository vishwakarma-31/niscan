import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Loader2, FileText, Sparkles, CheckCircle } from 'lucide-react';
import { UploadZone } from '@/components/UploadZone';
import { useSocket } from '@/hooks/useSocket';
import { apiService } from '@/services/api';
import type { Policy } from '@/types/policy.types';
import toast from 'react-hot-toast';



interface ExtractionField {
  key: keyof Policy;
  label: string;
}

const extractionFields: ExtractionField[] = [
  { key: 'customer_name' as keyof Policy, label: 'Customer Name' },
  { key: 'vehicle_number' as keyof Policy, label: 'Vehicle Number' },
  { key: 'insurer' as keyof Policy, label: 'Insurer' },
  { key: 'premium' as keyof Policy, label: 'Premium' },
];

export default function Upload() {
  const navigate = useNavigate();
  const { subscribe } = useSocket();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractedPolicy, setExtractedPolicy] = useState<Policy | null>(null);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const uploadedPolicyId = useRef<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadSuccess(false);
    setExtractedPolicy(null);
    setRevealedFields(new Set());
    uploadedPolicyId.current = null;
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await apiService.policies.upload(formData, (progress) => {
        setUploadProgress(Math.round(progress.progress || 0));
      });

      uploadedPolicyId.current = res.policy.id;
      setExtractedPolicy(res.policy);
      setUploadSuccess(true);
      toast.success('File uploaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!uploadedPolicyId.current || !uploadSuccess) return;

    const unsub = subscribe<{ policy_id: string }>('policy:extraction_complete', (data) => {
      if (data.policy_id === uploadedPolicyId.current) {
        apiService.policies.getById(uploadedPolicyId.current!).then((res) => {
          setExtractedPolicy(res.policy);
          setRevealedFields(new Set());
          res.policy.extraction_confidence &&
            Object.keys(res.policy.extraction_confidence).forEach((key) => {
              if (key !== 'error' && key !== 'raw') {
                setTimeout(() => {
                  setRevealedFields((prev) => new Set([...prev, key]));
                }, 300);
              }
            });
        });
        toast.success('Extraction complete');
      }
    });

    return () => unsub();
  }, [uploadSuccess, subscribe]);

  useEffect(() => {
    if (uploadSuccess && extractedPolicy?.extraction_confidence) {
      const keys = Object.keys(extractedPolicy.extraction_confidence).filter(
        (k) => k !== 'error' && k !== 'raw'
      );
      keys.forEach((key, index) => {
        setTimeout(() => {
          setRevealedFields((prev) => new Set([...prev, key]));
        }, (index + 1) * 300);
      });
    }
  }, [uploadSuccess, extractedPolicy]);

  const handleViewPolicy = () => {
    if (uploadedPolicyId.current) {
      navigate(`/policies/${uploadedPolicyId.current}`);
    }
  };

  const getFieldValue = (key: string): string | null => {
    if (!extractedPolicy) return null;
    const value = extractedPolicy[key as keyof Policy];
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return `₹${value.toLocaleString('en-IN')}`;
    return String(value);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Upload Policy</h1>
          <p className="text-gray-500 mt-1">Upload a PDF policy document for extraction</p>
        </div>

        <div className="card p-6">
          <UploadZone onFileSelect={handleFileSelect} />

          {selectedFile && (
            <div className="mt-4">
              {isUploading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : uploadSuccess ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Upload complete</span>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-4 h-4" />
                  Start Upload
                </button>
              )}
            </div>
          )}
        </div>

        {uploadSuccess && extractedPolicy && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Extraction Results</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-500 text-xs rounded">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </span>
            </div>

            {!extractedPolicy.extraction_confidence?.error ? (
              <div className="space-y-4">
                {extractionFields.map((field) => {
                  const value = getFieldValue(field.key);
                  const isRevealed = revealedFields.has(field.key);

                  return (
                    <div
                      key={field.key}
                      className={`transition-all duration-500 ${
                        isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <p className={`text-sm ${value ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                          {value || 'Not extracted'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-sm text-red-400">
                  {extractedPolicy.extraction_confidence?.error || 'Extraction failed'}
                </p>
              </div>
            )}

            {revealedFields.size > 0 && revealedFields.size === extractionFields.length && (
              <button
                onClick={handleViewPolicy}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                View Policy Details
              </button>
            )}

            {revealedFields.size > 0 && revealedFields.size !== extractionFields.length && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Extracting remaining fields...</span>
              </div>
            )}
          </div>
        )}

        {uploadSuccess && !extractedPolicy && (
          <div className="card p-6">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <div>
                <p className="font-medium">Extraction in progress...</p>
                <p className="text-sm text-gray-600">This may take a moment</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}