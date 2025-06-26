// Enhanced Gemini service for multiple image analysis
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const GEMINI_MODEL   = process.env.NEXT_PUBLIC_GEMINI_MODEL!;
const GEMINI_ENDPOINT = 
  `https://generativelanguage.googleapis.com/v1beta/models/` +
  `${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface MultiImageAnalysisResult {
  packagingProduct: string
  deliveryProduct: string
  areProductsSame: boolean
  overallSimilarityPercentage: number
  angleAnalysis: AngleAnalysis[]
  comprehensiveDifferences: string[]
  detailedSummary: string
  confidenceScore: number
  technicalAnalysis: any
  recommendations: string[]
}

interface AngleAnalysis {
  angle: string
  packagingImageIndex: number
  deliveryImageIndex: number
  similarityPercentage: number
  differences: string[]
  matchQuality: "excellent" | "good" | "fair" | "poor"
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callGemini(prompt: string, images: string[]) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            ...images.map((image) => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: image,
              },
            })),
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192, // Increased for multiple image analysis
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API Error:", response.status, errorText)
    throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function analyzeMultipleImages(
  packagingImages: File[],
  deliveryImages: File[],
): Promise<MultiImageAnalysisResult> {
  try {
    // Convert all images to base64
    const packagingBase64 = await Promise.all(packagingImages.map((img) => convertImageToBase64(img)))
    const deliveryBase64 = await Promise.all(deliveryImages.map((img) => convertImageToBase64(img)))

    // Combine all images for analysis
    const allImages = [...packagingBase64, ...deliveryBase64]

    // Step 1: Comprehensive Multi-Angle Product Analysis
    const analysisPrompt = `You are an expert product validation specialist analyzing multiple images of the same product from different angles. 

PACKAGING IMAGES (First ${packagingImages.length} images): These show the product at packaging/seller time
DELIVERY IMAGES (Next ${deliveryImages.length} images): These show the product at delivery/customer time

Perform a comprehensive multi-angle analysis:

1. **Product Identification**: Identify the specific product across all images
2. **Angle Analysis**: Analyze each angle/view (front, back, sides, top, bottom, details)
3. **Cross-Reference Validation**: Compare corresponding angles between packaging and delivery
4. **Condition Assessment**: Evaluate condition changes across all angles
5. **Completeness Check**: Verify all components, accessories, packaging integrity
6. **Quality Scoring**: Provide similarity scores for each comparable angle

Respond in JSON format:
{
  "product_identification": {
    "product_name": "specific product with brand and model",
    "category": "product category",
    "key_identifiers": ["identifier1", "identifier2"]
  },
  "packaging_analysis": {
    "total_images": ${packagingImages.length},
    "angles_covered": ["angle1", "angle2"],
    "condition_summary": "overall condition description",
    "completeness": "completeness assessment"
  },
  "delivery_analysis": {
    "total_images": ${deliveryImages.length},
    "angles_covered": ["angle1", "angle2"],
    "condition_summary": "overall condition description",
    "completeness": "completeness assessment"
  },
  "angle_comparisons": [
    {
      "angle": "front_view",
      "packaging_image_index": 0,
      "delivery_image_index": 0,
      "similarity_percentage": 85,
      "differences": ["difference1", "difference2"],
      "match_quality": "good"
    }
  ],
  "overall_assessment": {
    "products_match": true/false,
    "overall_similarity": 0-100,
    "confidence_level": 0-100,
    "comprehensive_differences": ["diff1", "diff2"],
    "missing_angles": ["angle1", "angle2"],
    "quality_concerns": ["concern1", "concern2"]
  },
  "technical_analysis": {
    "best_matching_angles": ["angle1", "angle2"],
    "worst_matching_angles": ["angle1", "angle2"],
    "coverage_completeness": 0-100,
    "validation_reliability": "high/medium/low"
  },
  "recommendations": ["recommendation1", "recommendation2"]
}`

    const analysisResponse = await callGemini(analysisPrompt, allImages)
    let analysis

    try {
      const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse analysis JSON:", analysisResponse)
      throw new Error("Failed to parse multi-image analysis. Please try again.")
    }

    // Process the results
    const angleAnalysis: AngleAnalysis[] = analysis.angle_comparisons.map((comp: any) => ({
      angle: comp.angle,
      packagingImageIndex: comp.packaging_image_index,
      deliveryImageIndex: comp.delivery_image_index,
      similarityPercentage: comp.similarity_percentage,
      differences: comp.differences,
      matchQuality: comp.match_quality,
    }))

    return {
      packagingProduct: analysis.product_identification.product_name,
      deliveryProduct: analysis.product_identification.product_name,
      areProductsSame: analysis.overall_assessment.products_match,
      overallSimilarityPercentage: analysis.overall_assessment.overall_similarity,
      angleAnalysis,
      comprehensiveDifferences: analysis.overall_assessment.comprehensive_differences,
      detailedSummary: `Multi-angle analysis of ${analysis.product_identification.product_name} completed. 
        Analyzed ${packagingImages.length} packaging images and ${deliveryImages.length} delivery images. 
        Overall similarity: ${analysis.overall_assessment.overall_similarity}%. 
        ${analysis.overall_assessment.products_match ? "Products match across all angles." : "Significant discrepancies detected."}
        Coverage completeness: ${analysis.technical_analysis.coverage_completeness}%.`,
      confidenceScore: analysis.overall_assessment.confidence_level,
      technicalAnalysis: {
        ...analysis.technical_analysis,
        total_packaging_images: packagingImages.length,
        total_delivery_images: deliveryImages.length,
        angles_analyzed: analysis.angle_comparisons.length,
        missing_angles: analysis.overall_assessment.missing_angles,
      },
      recommendations: analysis.recommendations,
    }
  } catch (error) {
    console.error("Error analyzing multiple images:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to analyze multiple images. Please try again.")
  }
}
