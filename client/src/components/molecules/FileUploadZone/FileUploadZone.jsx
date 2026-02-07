import React from "react";
import { UploadCloud, File, X } from "lucide-react";

/**
 * MOLECULE: FileUploadZone
 */
const FileUploadZone = ({
  onFileSelect,
  accept = ".pdf",
  acceptLabel = "PDF files",
  isDragging = false,
  isScanning = false,
  selectedFile = null,
  onRemoveFile = null,
  className = "",
  ...props
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect({ target: { files: [file] } });
  };

  if (selectedFile && !isScanning) {
    return (
      <div
        className={`flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg ${className}`}
        {...props}
      >
        <div className="bg-white p-2 rounded shadow-sm">
          <File className="text-brand-blue" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500">
            {(selectedFile.size / 1024).toFixed(0)} KB
          </p>
        </div>
        {onRemoveFile && (
          <button
            onClick={onRemoveFile}
            className="text-gray-400 hover:text-red-500 flex-shrink-0"
          >
            <X size={20} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-blue-50 hover:border-brand-blue transition-all cursor-pointer ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      {...props}
    >
      <input
        type="file"
        accept={accept}
        onChange={onFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="p-3 bg-blue-100 text-brand-blue rounded-full group-hover:scale-110 transition-transform">
          <UploadCloud size={32} />
        </div>
        <div>
          <p className="text-gray-700 font-medium text-lg">
            Click to upload {acceptLabel}
          </p>
          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
        </div>
      </div>

      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
          <div className="text-center">
            <div className="animate-spin inline-block">
              <svg
                className="w-8 h-8 text-brand-blue"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-2">Scanning...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
