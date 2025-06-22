// Using Google Gemini AI for image analysis - free tier available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL // quick, multi-modal
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

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

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1]) // Remove data:image/jpeg;base64, prefix
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
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API Error:", response.status, errorText)

    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your Gemini API key.")
    } else if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.")
    } else if (response.status === 400) {
      throw new Error("Invalid request. Please check your images and try again.")
    } else {
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`)
    }
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function analyzeImages(packagingImage: File, deliveryImage: File): Promise<AnalysisResult> {
  try {
    // Convert images to base64
    const packagingBase64 = await convertImageToBase64(packagingImage)
    const deliveryBase64 = await convertImageToBase64(deliveryImage)

    // Step 1: Comprehensive Product Identification and Initial Analysis
    const identificationPrompt = `You are an expert product analyst specializing in delivery validation. Analyze these two images in extreme detail. The first image shows the product at packaging time, and the second shows the product at delivery time.

Provide a comprehensive analysis including:
1. Detailed product identification for each image
2. Key features and specifications visible
3. Condition assessment
4. Initial comparison observations

Respond in JSON format:
{
  "packaging_analysis": {
    "product_name": "specific product with brand and model",
    "key_features": ["feature1", "feature2", "feature3"],
    "condition": "detailed condition description",
    "completeness": "assessment of visible items/accessories",
    "quality_indicators": ["indicator1", "indicator2"]
  },
  "delivery_analysis": {
    "product_name": "specific product with brand and model", 
    "key_features": ["feature1", "feature2", "feature3"],
    "condition": "detailed condition description",
    "completeness": "assessment of visible items/accessories",
    "quality_indicators": ["indicator1", "indicator2"]
  },
  "initial_comparison": {
    "products_match": true/false,
    "confidence_level": 0-100,
    "obvious_differences": ["difference1", "difference2"],
    "concerns": ["concern1", "concern2"]
  }
}`

    const identificationResponse = await callGemini(identificationPrompt, [packagingBase64, deliveryBase64])
    let identification

    try {
      // Clean the response to extract JSON
      const jsonMatch = identificationResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        identification = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse identification JSON:", identificationResponse)
      throw new Error("Failed to parse initial analysis. Please try again.")
    }

    const areProductsSame = identification.initial_comparison.products_match
    const confidenceScore = identification.initial_comparison.confidence_level

    let similarityPercentage: number | undefined
    let differences: string[] = []
    let summary: string
    let visualDifferences: string | undefined
    let technicalAnalysis: any = {}

    if (areProductsSame) {
      // Step 2: Detailed Similarity Analysis for Matching Products
      const similarityPrompt = `These images show the same product: "${identification.packaging_analysis.product_name}".

Conduct a detailed similarity analysis and provide:
1. Precise similarity percentage (0-100) based on condition, completeness, and quality
2. Detailed list of specific differences found
3. Technical analysis of visual changes
4. Overall assessment summary

Consider all factors:
- Physical condition changes
- Missing or added components
- Color/lighting variations
- Packaging changes
- Quality indicators

Respond in JSON format:
{
  "similarity_percentage": 85,
  "detailed_differences": [
    {
      "category": "physical_condition",
      "description": "specific difference description",
      "severity": "low/medium/high"
    }
  ],
  "technical_analysis": {
    "color_variation": "description of color differences",
    "condition_change": "description of condition changes", 
    "completeness_score": 0-100,
    "packaging_integrity": "assessment of packaging changes",
    "quality_assessment": "overall quality comparison"
  },
  "visual_differences": "detailed description of visual discrepancies",
  "summary": "comprehensive assessment summary",
  "recommendations": ["recommendation1", "recommendation2"]
}`

      const similarityResponse = await callGemini(similarityPrompt, [packagingBase64, deliveryBase64])

      try {
        const jsonMatch = similarityResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const similarityAnalysis = JSON.parse(jsonMatch[0])

          similarityPercentage = similarityAnalysis.similarity_percentage
          differences = similarityAnalysis.detailed_differences.map(
            (diff: any) => `${diff.category}: ${diff.description} (${diff.severity} severity)`,
          )
          technicalAnalysis = similarityAnalysis.technical_analysis
          visualDifferences = similarityAnalysis.visual_differences
          summary = similarityAnalysis.summary
        } else {
          throw new Error("No JSON found in similarity response")
        }
      } catch (parseError) {
        console.error("Failed to parse similarity analysis:", parseError)
        // Fallback analysis
        similarityPercentage = 75
        differences = identification.initial_comparison.obvious_differences || []
        summary = `Both images show the same product: ${identification.packaging_analysis.product_name}. Some variations detected in presentation or condition.`
      }
    } else {
      // Products are different
      differences = [
        `Packaging shows: ${identification.packaging_analysis.product_name}`,
        `Delivery shows: ${identification.delivery_analysis.product_name}`,
        "Products are completely different items",
        ...identification.initial_comparison.obvious_differences,
      ]

      summary = `DELIVERY MISMATCH DETECTED: The packaging image contains "${identification.packaging_analysis.product_name}" while the delivery image shows "${identification.delivery_analysis.product_name}". This indicates a serious delivery error that requires immediate attention and investigation.`

      technicalAnalysis = {
        mismatch_type: "different_products",
        packaging_product: identification.packaging_analysis.product_name,
        delivery_product: identification.delivery_analysis.product_name,
        confidence: confidenceScore,
      }
    }

    return {
      packagingProduct: identification.packaging_analysis.product_name,
      deliveryProduct: identification.delivery_analysis.product_name,
      areProductsSame,
      similarityPercentage,
      differences,
      summary,
      visualDifferences,
      confidenceScore,
      technicalAnalysis,
    }
  } catch (error) {
    console.error("Error analyzing images:", error)

    if (error instanceof Error) {
      throw error // Re-throw known errors with specific messages
    }
    throw new Error("Failed to analyze images. Please try again.")
  }
}
