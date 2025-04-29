'use client';

import { ChangeEvent, useCallback, useState } from 'react';

import { ImagePlus, Upload, X } from 'lucide-react';

import { cn } from '~/lib/utils';

interface FileUploadProps {
  className?: string;
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({
  className,
  onChange,
  maxFiles = 5,
  maxSize = 5, // 5MB default
  accept = 'image/*',
  multiple = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return [];

      // Check number of files
      if (!multiple && files.length > 1) {
        setError('Only one file can be uploaded');
        return [];
      }

      if (multiple && maxFiles && files.length > maxFiles) {
        setError(`You can upload a maximum of ${maxFiles} files`);
        return [];
      }

      // Filter files
      const validFiles = Array.from(files).filter((file) => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          setError(`File size should not exceed ${maxSize}MB`);
          return false;
        }

        // Check file type
        const fileType = file.type;
        if (accept && accept !== '*') {
          const acceptedTypes = accept.split(',').map((type) => type.trim());
          if (
            !acceptedTypes.some((type) => {
              if (type === 'image/*') return fileType.startsWith('image/');
              if (type === 'video/*') return fileType.startsWith('video/');
              if (type === 'audio/*') return fileType.startsWith('audio/');
              return type === fileType;
            })
          ) {
            setError(`Invalid file type. Accepted types: ${accept}`);
            return false;
          }
        }

        return true;
      });

      if (validFiles.length === 0) {
        if (!error) setError('No valid files selected');
        return [];
      }

      setError(null);
      return validFiles;
    },
    [accept, error, maxFiles, maxSize, multiple],
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files) {
        const validFiles = validateFiles(Array.from(e.dataTransfer.files));
        if (validFiles.length > 0) {
          onChange(validFiles);
        }
      }
    },
    [onChange, validateFiles],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const validFiles = validateFiles(Array.from(e.target.files));
        if (validFiles.length > 0) {
          onChange(validFiles);
        }
      }
    },
    [onChange, validateFiles],
  );

  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        className={cn(
          'border-input hover:border-ring flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all',
          dragActive && 'border-primary bg-primary/5',
          error && 'border-destructive bg-destructive/5',
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {error ? (
            <>
              <X className="text-destructive h-8 w-8" strokeWidth={1.5} />
              <p className="text-destructive text-sm font-medium">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearError();
                }}
                className="text-muted-foreground hover:text-foreground text-xs underline"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              {accept && accept.includes('image') ? (
                <ImagePlus className="text-muted-foreground h-8 w-8" strokeWidth={1.5} />
              ) : (
                <Upload className="text-muted-foreground h-8 w-8" strokeWidth={1.5} />
              )}
              <div className="text-muted-foreground space-y-1">
                <p className="font-medium">
                  Drag & drop {multiple ? 'files' : 'a file'} or click to browse
                </p>
                <p className="text-xs">
                  {multiple ? `Upload up to ${maxFiles} files` : 'Upload a single file'} (max{' '}
                  {maxSize}MB
                  {accept && accept !== '*'
                    ? `, ${accept.includes('image') ? 'images' : accept}`
                    : ''}
                  )
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <input
        id="file-upload"
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
