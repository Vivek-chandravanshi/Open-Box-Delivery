"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Package, Brain, TrendingUp, Eye, Camera, Grid3X3 } from "lucide-react"

interface MultiImageResultsProps {
  results: {
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
}

export default function MultiImageResults({ results }: MultiImageResultsProps) {
  const {
    packagingProduct,
    deliveryProduct,
    areProductsSame,
    overallSimilarityPercentage,
    angleAnalysis,
    comprehensiveDifferences,
    detailedSummary,
    confidenceScore,
    technicalAnalysis,
    recommendations,
  } = results

  const getStatusColor = () => {
    if (areProductsSame && overallSimilarityPercentage > 90) return "text-green-600"
    if (areProductsSame && overallSimilarityPercentage > 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = () => {
    if (areProductsSame && overallSimilarityPercentage > 90) return CheckCircle
    if (areProductsSame && overallSimilarityPercentage > 70) return AlertTriangle
    return XCircle
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const StatusIcon = getStatusIcon()

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${getStatusColor()}`} />
            Multi-Angle Validation Results
            <Badge variant="outline" className="ml-auto">
              Confidence: {confidenceScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Identification */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Analysis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Product:</span>
                  <Badge variant="outline" className="text-xs max-w-48 truncate" title={packagingProduct}>
                    {packagingProduct}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Images Analyzed:</span>
                  <Badge variant="secondary" className="text-xs">
                    {technicalAnalysis.total_packaging_images + technicalAnalysis.total_delivery_images} total
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Angles Compared:</span>
                  <Badge variant="secondary" className="text-xs">
                    {technicalAnalysis.angles_analyzed} angles
                  </Badge>
                </div>
              </div>
            </div>

            {/* Overall Match Status */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Overall Assessment
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Products Match:</span>
                  <Badge variant={areProductsSame ? "default" : "destructive"}>{areProductsSame ? "Yes" : "No"}</Badge>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Overall Similarity:</span>
                    <span className={`font-semibold ${getStatusColor()}`}>{overallSimilarityPercentage}%</span>
                  </div>
                  <Progress value={overallSimilarityPercentage} className="h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coverage:</span>
                  <span className="text-sm font-medium">{technicalAnalysis.coverage_completeness}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Angle-by-Angle Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Angle-by-Angle Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {angleAnalysis.map((angle, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span className="font-medium capitalize">{angle.angle.replace("_", " ")}</span>
                    <Badge className={getQualityColor(angle.matchQuality)}>{angle.matchQuality}</Badge>
                  </div>
                  <span className="font-semibold text-sm">{angle.similarityPercentage}%</span>
                </div>

                <Progress value={angle.similarityPercentage} className="h-2" />

                <div className="text-xs text-gray-600">
                  <span>
                    Packaging Image #{angle.packagingImageIndex + 1} ↔ Delivery Image #{angle.deliveryImageIndex + 1}
                  </span>
                </div>

                {angle.differences.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Differences:</span>
                    <ul className="mt-1 space-y-1">
                      {angle.differences.map((diff, diffIndex) => (
                        <li key={diffIndex} className="text-gray-600 text-xs flex items-start gap-1">
                          <div className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Coverage Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Packaging Images:</span>
                  <span>{technicalAnalysis.total_packaging_images}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Images:</span>
                  <span>{technicalAnalysis.total_delivery_images}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Validation Reliability:</span>
                  <Badge variant="outline" className="text-xs">
                    {technicalAnalysis.validation_reliability}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Quality Insights</h4>
              <div className="space-y-2">
                {technicalAnalysis.best_matching_angles && (
                  <div className="text-sm">
                    <span className="text-gray-600">Best Matches:</span>
                    <div className="text-green-700 text-xs mt-1">
                      {technicalAnalysis.best_matching_angles.join(", ")}
                    </div>
                  </div>
                )}
                {technicalAnalysis.worst_matching_angles && (
                  <div className="text-sm">
                    <span className="text-gray-600">Needs Attention:</span>
                    <div className="text-red-700 text-xs mt-1">
                      {technicalAnalysis.worst_matching_angles.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Differences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comprehensive Differences</CardTitle>
          </CardHeader>
          <CardContent>
            {comprehensiveDifferences.length > 0 ? (
              <ul className="space-y-2">
                {comprehensiveDifferences.map((difference, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{difference}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No significant differences detected across all angles</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{detailedSummary}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Expert Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-purple-800">{recommendation}</span>
              </div>
            ))}

            <div className="mt-4 p-3 bg-white rounded-lg border">
              {areProductsSame ? (
                <>
                  {overallSimilarityPercentage > 90 ? (
                    <p className="text-green-700 font-medium text-sm">
                      ✅ Multi-angle validation PASSED - Products match with high confidence across all angles (
                      {confidenceScore}% confidence)
                    </p>
                  ) : overallSimilarityPercentage > 70 ? (
                    <p className="text-yellow-700 font-medium text-sm">
                      ⚠️ Products match but with variations across some angles - Manual review recommended (
                      {confidenceScore}% confidence)
                    </p>
                  ) : (
                    <p className="text-orange-700 font-medium text-sm">
                      🔍 Products match but with significant differences - Detailed inspection required (
                      {confidenceScore}% confidence)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-red-700 font-medium text-sm">
                  ❌ Multi-angle validation FAILED - Products do not match ({confidenceScore}% confidence)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
