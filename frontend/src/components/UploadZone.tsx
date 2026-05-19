import { useState, useCallback, useRef } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (selectedFile) {
    return (
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
        <button
          onClick={handleRemoveFile}
          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      className={`
        cursor-pointer border-2 border-dashed rounded-md p-8 text-center transition-all duration-200
        ${
          isDragging
            ? 'border-blue-600 bg-blue-100'
            : 'border-gray-300 hover:border-slate-600 hover:bg-white/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-12 h-12 rounded flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-100' : 'bg-white'
          }`}
        >
          <CloudUpload className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {isDragging ? 'Drop your PDF here' : 'Drag and drop your PDF here'}
          </p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
        </div>
        <p className="text-xs text-slate-600">PDF files only, max 10MB</p>
      </div>
    </div>
  );
}