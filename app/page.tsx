"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Truck, Zap, Eye, Shield, Sparkles, Images, Camera } from "lucide-react"
import MultiImageUploader from "@/components/multi-image-uploader"
import MultiImageResults from "@/components/multi-image-results"
import { analyzeMultipleImages } from "@/lib/multi-image-gemini-service"

interface MultiImageAnalysisResult {
  packagingProduct: string
  deliveryProduct: string
  areProductsSame: boolean
  overallSimilarityPercentage: number
  angleAnalysis: Array<{
    angle: string
    packagingImageIndex: number
    deliveryImageIndex: number
    similarityPercentage: number
    differences: string[]
    matchQuality: "excellent" | "good" | "fair" | "poor"
  }>
  comprehensiveDifferences: string[]
  detailedSummary: string
  confidenceScore: number
  technicalAnalysis: any
  recommendations: string[]
}

export default function MultiAngleDeliveryValidationApp() {
  const [packagingImages, setPackagingImages] = useState<File[]>([])
  const [deliveryImages, setDeliveryImages] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [results, setResults] = useState<MultiImageAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const features = [
    { icon: Sparkles, label: "Gemini Pro Vision", color: "bg-purple-100 text-purple-700" },
    { icon: Images, label: "Multi-Angle Analysis", color: "bg-blue-100 text-blue-700" },
    { icon: Camera, label: "5 Images Per Side", color: "bg-green-100 text-green-700" },
    { icon: Eye, label: "360° Validation", color: "bg-pink-100 text-pink-700" },
    { icon: Shield, label: "Comprehensive Check", color: "bg-orange-100 text-orange-700" },
  ]

  const handleAnalysis = async () => {
    if (packagingImages.length === 0 || deliveryImages.length === 0) {
      setError("Please upload at least one image for both packaging and delivery")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResults(null)
    setAnalysisProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 1500)

      const result = await analyzeMultipleImages(packagingImages, deliveryImages)

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      setTimeout(() => {
        setResults(result)
        setIsAnalyzing(false)
        setAnalysisProgress(0)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const totalImages = packagingImages.length + deliveryImages.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI-Powered Multi-Angle Delivery Validation
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Advanced multi-angle product verification using Google Gemini Pro Vision
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {features.map((feature, index) => (
              <Badge key={index} variant="secondary" className={`${feature.color} px-3 py-1`}>
                <feature.icon className="w-4 h-4 mr-2" />
                {feature.label}
              </Badge>
            ))}
          </div>

          {/* Ready Status */}
          <Alert className="mb-4 max-w-md mx-auto border-green-200 bg-green-50">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Multi-Angle Analysis Ready!</strong> Upload up to 5 images per side for comprehensive validation.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Upload Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />
                  Packaging Images
                  <Badge variant="outline" className="ml-2">
                    {packagingImages.length}/5
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImageUploader
                  onImagesSelect={setPackagingImages}
                  selectedImages={packagingImages}
                  placeholder="Upload packaging images from multiple angles"
                  description="Front, back, sides, top, bottom - capture all angles"
                  maxImages={5}
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Images
                  <Badge variant="outline" className="ml-2">
                    {deliveryImages.length}/5
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImageUploader
                  onImagesSelect={setDeliveryImages}
                  selectedImages={deliveryImages}
                  placeholder="Upload delivery images from multiple angles"
                  description="Match the same angles as packaging images"
                  maxImages={5}
                />
              </CardContent>
            </Card>
          </div>

          {/* Analysis Summary */}
          {totalImages > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>{packagingImages.length} packaging images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{deliveryImages.length} delivery images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-green-600" />
                    <span>{totalImages} total images ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleAnalysis}
              disabled={packagingImages.length === 0 || deliveryImages.length === 0 || isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Eye className="w-5 h-5 mr-2 animate-pulse" />
                  Analyzing {totalImages} Images...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Start Multi-Angle AI Analysis
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mb-8">
              <div className="text-center mb-2">
                <span className="text-sm text-gray-600">
                  Processing {totalImages} images with Google Gemini Pro Vision...
                </span>
              </div>
              <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
              <div className="text-center mt-2 text-xs text-gray-500">
                {analysisProgress < 30 && "Analyzing product identification..."}
                {analysisProgress >= 30 && analysisProgress < 60 && "Comparing angles and conditions..."}
                {analysisProgress >= 60 && analysisProgress < 90 && "Generating comprehensive report..."}
                {analysisProgress >= 90 && "Finalizing results..."}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && <MultiImageResults results={results} />}

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-gray-500">
            Powered by Google Gemini Pro Vision • Multi-Angle Analysis • Up to 10 Images Total • 360° Product Validation
          </div>
        </div>
      </div>
    </div>
  )
}
