"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Package, Truck, Brain, TrendingUp } from "lucide-react"

interface ComparisonResultsProps {
  results: {
    packagingProduct: string
    deliveryProduct: string
    areProductsSame: boolean
    similarityPercentage?: number
    differences: string[]
    summary: string
    visualDifferences?: string
    confidenceScore: number
    technicalAnalysis?: any
  }
}

export default function ComparisonResults({ results }: ComparisonResultsProps) {
  const {
    packagingProduct,
    deliveryProduct,
    areProductsSame,
    similarityPercentage,
    differences,
    summary,
    visualDifferences,
    confidenceScore,
    technicalAnalysis,
  } = results

  const getStatusColor = () => {
    if (areProductsSame && (similarityPercentage || 0) > 90) return "text-green-600"
    if (areProductsSame && (similarityPercentage || 0) > 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = () => {
    if (areProductsSame && (similarityPercentage || 0) > 90) return CheckCircle
    if (areProductsSame && (similarityPercentage || 0) > 70) return AlertTriangle
    return XCircle
  }

  const StatusIcon = getStatusIcon()

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${getStatusColor()}`} />
            Validation Results
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
                Product Identification
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Packaging:</span>
                  <Badge variant="outline" className="text-xs max-w-48 truncate" title={packagingProduct}>
                    {packagingProduct}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery:</span>
                  <Badge variant="outline" className="text-xs max-w-48 truncate" title={deliveryProduct}>
                    {deliveryProduct}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Match Status */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Match Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Products Match:</span>
                  <Badge variant={areProductsSame ? "default" : "destructive"}>{areProductsSame ? "Yes" : "No"}</Badge>
                </div>
                {areProductsSame && similarityPercentage && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Similarity:</span>
                      <span className={`font-semibold ${getStatusColor()}`}>{similarityPercentage}%</span>
                    </div>
                    <Progress value={similarityPercentage} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis */}
      {technicalAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Technical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {technicalAnalysis.completeness_score && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completeness:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={technicalAnalysis.completeness_score} className="w-20 h-2" />
                    <span className="text-sm font-medium">{technicalAnalysis.completeness_score}%</span>
                  </div>
                </div>
              )}
              {technicalAnalysis.condition_change && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Condition:</span>
                  <span className="text-sm">{technicalAnalysis.condition_change}</span>
                </div>
              )}
              {technicalAnalysis.color_variation && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Color Variation:</span>
                  <span className="text-sm">{technicalAnalysis.color_variation}</span>
                </div>
              )}
              {technicalAnalysis.packaging_integrity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Packaging:</span>
                  <span className="text-sm">{technicalAnalysis.packaging_integrity}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Differences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identified Differences</CardTitle>
          </CardHeader>
          <CardContent>
            {differences.length > 0 ? (
              <ul className="space-y-2">
                {differences.map((difference, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{difference}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No significant differences detected</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{summary}</p>
            {visualDifferences && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Visual Analysis:
                </h4>
                <p className="text-sm text-blue-800">{visualDifferences}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {areProductsSame ? (
              <>
                {(similarityPercentage || 0) > 90 ? (
                  <p className="text-green-700 font-medium">
                    ✅ Delivery validation passed - products match with high confidence ({confidenceScore}% confidence)
                  </p>
                ) : (similarityPercentage || 0) > 70 ? (
                  <p className="text-yellow-700 font-medium">
                    ⚠️ Products match but with notable variations - manual review recommended ({confidenceScore}%
                    confidence)
                  </p>
                ) : (
                  <p className="text-orange-700 font-medium">
                    🔍 Products match but with significant differences - detailed inspection required ({confidenceScore}
                    % confidence)
                  </p>
                )}
              </>
            ) : (
              <p className="text-red-700 font-medium">
                ❌ Products do not match - delivery validation failed ({confidenceScore}% confidence)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
