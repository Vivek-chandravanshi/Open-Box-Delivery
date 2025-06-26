"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, X, Plus, Images } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MultiImageUploaderProps {
  onImagesSelect: (files: File[]) => void
  selectedImages: File[]
  placeholder: string
  description: string
  maxImages?: number
}

export default function MultiImageUploader({
  onImagesSelect,
  selectedImages,
  placeholder,
  description,
  maxImages = 5,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    // Limit to maxImages
    const newImages = [...selectedImages, ...imageFiles].slice(0, maxImages)
    onImagesSelect(newImages)

    // Create preview URLs
    const newUrls = newImages.map((file) => URL.createObjectURL(file))
    setPreviewUrls(newUrls)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    onImagesSelect(newImages)

    // Update preview URLs
    const newUrls = previewUrls.filter((_, i) => i !== index)
    setPreviewUrls(newUrls)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = selectedImages.length < maxImages

  return (
    <div className="w-full space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {/* Upload Area */}
      {(selectedImages.length === 0 || canAddMore) && (
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-1">{placeholder}</p>
          <p className="text-sm text-gray-500 mb-2">{description}</p>
          <Badge variant="outline" className="text-xs">
            {selectedImages.length}/{maxImages} images
          </Badge>
        </div>
      )}

      {/* Image Previews Grid */}
      {selectedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            {canAddMore && (
              <Button onClick={handleClick} variant="outline" size="sm" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add More
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border shadow-sm"
                />
                <Button
                  onClick={() => handleRemoveImage(index)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
                <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs px-1 py-0">
                  {index + 1}
                </Badge>
              </div>
            ))}
          </div>

          {/* File Names */}
          <div className="text-xs text-gray-500 space-y-1">
            {selectedImages.map((file, index) => (
              <div key={index} className="truncate">
                {index + 1}. {file.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
