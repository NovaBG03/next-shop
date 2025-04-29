'use client';

import { useCallback, useState } from 'react';

import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { FileUpload } from '~/components/ui/file-upload';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { ImageMetadata } from '~/lib/mongodb/schema';

interface ImageUploaderProps {
  images: ImageMetadata[];
  onChange: (images: ImageMetadata[]) => void;
  maxImages?: number;
}

interface PresignedUrlInfo {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  fileName?: string;
  error?: string;
}

export function ImageUploader({ images, onChange, maxImages = 10 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingAltText, setEditingAltText] = useState('');

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Check if adding these files would exceed the max
      if (images.length + files.length > maxImages) {
        setError(`You can only upload a maximum of ${maxImages} images`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // Step 1: Get presigned URLs for uploads
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: files.map((file) => ({ name: file.name, type: file.type })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get upload URLs');
        }

        // Step 2: Upload files to presigned URLs
        const uploadPromises = data.presignedUrls.map(
          async (urlInfo: PresignedUrlInfo, index: number) => {
            const file = files[index];
            if (!urlInfo.uploadUrl) {
              throw new Error(`No upload URL for file ${file.name}`);
            }

            const uploadResponse = await fetch(urlInfo.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
              },
              body: file,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload file ${file.name}`);
            }

            // Generate alt text from filename (without extension)
            const altText = file.name.split('.')[0];

            // Return the metadata for this image
            const metadata: ImageMetadata = {
              url: urlInfo.publicUrl,
            };

            // Only add alt property if altText exists
            if (altText) {
              metadata.alt = altText;
            }

            return metadata;
          },
        );

        const newImages = await Promise.all(uploadPromises);

        // Step 3: Update state with new images
        onChange([...images, ...newImages]);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Error uploading images');
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange],
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    },
    [images, onChange],
  );

  const startEditingAlt = useCallback(
    (index: number) => {
      setEditingImageIndex(index);
      setEditingAltText(images[index].alt || '');
    },
    [images],
  );

  const saveAltText = useCallback(() => {
    if (editingImageIndex !== null) {
      const newImages = [...images];
      const newImage = { ...newImages[editingImageIndex] };

      if (editingAltText) {
        newImage.alt = editingAltText;
      } else {
        // If alt text is empty, remove the property
        delete newImage.alt;
      }

      newImages[editingImageIndex] = newImage;
      onChange(newImages);
      setEditingImageIndex(null);
    }
  }, [editingAltText, editingImageIndex, images, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Images ({images.length}/{maxImages})
        </Label>
        {uploading && (
          <div className="flex items-center gap-2 text-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FileUpload
        onChange={handleFileSelect}
        accept="image/*"
        maxFiles={maxImages - images.length}
        maxSize={5}
        multiple={true}
        className={images.length >= maxImages ? 'pointer-events-none opacity-50' : ''}
      />

      {images.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {images.map((img, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-md border p-2">
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                    <img
                      src={img.url}
                      alt={img.alt || 'Product image'}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className =
                          'h-full w-full flex items-center justify-center text-gray-400 text-xs';
                        placeholder.textContent = 'Error loading image';
                        e.currentTarget.parentNode?.appendChild(placeholder);
                      }}
                    />
                  </div>

                  {editingImageIndex === index ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingAltText}
                        onChange={(e) => setEditingAltText(e.target.value)}
                        placeholder="Alt text"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={saveAltText}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => startEditingAlt(index)}
                        className="text-muted-foreground hover:text-foreground line-clamp-1 text-left text-xs underline"
                      >
                        {img.alt || 'Add alt text'}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {images.length < maxImages && (
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="border-input hover:border-ring flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-2 transition-all"
                >
                  <ImagePlus className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-xs">Add image</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <input type="hidden" name="images" value={JSON.stringify(images)} />
    </div>
  );
}
