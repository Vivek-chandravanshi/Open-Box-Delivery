"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Truck, Zap, Eye, Palette, Shield, Sparkles } from "lucide-react"
import ImageUploader from "@/components/image-uploader"
import ComparisonResults from "@/components/comparison-results"
import { analyzeImages } from "@/lib/gemini-vision-service"

interface AnalysisResult {
  packagingProduct: string
  deliveryProduct: string
  areProductsSame: boolean
  similarityPercentage?: number
  differences: string[]
  summary: string
  visualDifferences?: string
  confidenceScore: number
  technicalAnalysis: any
}

export default function DeliveryValidationApp() {
  const [packagingImage, setPackagingImage] = useState<File | null>(null)
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const features = [
    { icon: Sparkles, label: "Gemini Pro Vision", color: "bg-purple-100 text-purple-700" },
    { icon: Eye, label: "Advanced Analysis", color: "bg-blue-100 text-blue-700" },
    { icon: Package, label: "Product Detection", color: "bg-green-100 text-green-700" },
    { icon: Palette, label: "Color Analysis", color: "bg-pink-100 text-pink-700" },
    { icon: Shield, label: "Damage Detection", color: "bg-orange-100 text-orange-700" },
  ]

  const handleAnalysis = async () => {
    if (!packagingImage || !deliveryImage) {
      setError("Please upload both packaging and delivery images")
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
          return prev + 15
        })
      }, 1000)

      const result = await analyzeImages(packagingImage, deliveryImage)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Amazon AI-Powered Open Box Delivery Validation
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Advanced product identification and comparison using Google Gemini Pro Vision
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
          {/* <Alert className="mb-4 max-w-md mx-auto border-green-200 bg-green-50">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Ready to Analyze!</strong> Gemini Pro Vision is configured and ready to use.
            </AlertDescription>
          </Alert> */}
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />
                  Packaging Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImageSelect={setPackagingImage}
                  selectedImage={packagingImage}
                  placeholder="Click to upload packaging image"
                  description="Gemini AI will analyze product automatically"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImageSelect={setDeliveryImage}
                  selectedImage={deliveryImage}
                  placeholder="Click to upload delivery image"
                  description="AI will detect product & condition"
                />
              </CardContent>
            </Card>
          </div>

          {/* Analysis Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleAnalysis}
              disabled={!packagingImage || !deliveryImage || isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Eye className="w-5 h-5 mr-2 animate-pulse" />
                  Analyzing with Gemini AI...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Start Advanced AI Analysis
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mb-8">
              <div className="text-center mb-2">
                <span className="text-sm text-gray-600">Processing with Google Gemini Pro Vision...</span>
              </div>
              <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && <ComparisonResults results={results} />}

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-gray-500">
            Powered by Google Gemini Pro Vision • Advanced AI Analysis • 30+ Product Types Including Electronics &
            Clothing
          </div>
        </div>
      </div>
    </div>
  )
}
