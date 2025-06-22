// Alternative: Hugging Face Vision Models (completely free)
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
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function analyzeImageWithHuggingFace(imageBase64: string) {
  try {
    // Using BLIP-2 for image captioning (free)
    const response = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageBase64,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const result = await response.json()
    return result[0]?.generated_text || "Unable to analyze image"
  } catch (error) {
    console.error("Hugging Face analysis failed:", error)
    return "Analysis failed"
  }
}

async function calculateImageSimilarity(img1Base64: string, img2Base64: string): Promise<number> {
  // Simple pixel-based similarity calculation
  try {
    const canvas1 = document.createElement("canvas")
    const canvas2 = document.createElement("canvas")
    const ctx1 = canvas1.getContext("2d")
    const ctx2 = canvas2.getContext("2d")

    if (!ctx1 || !ctx2) return 50

    const img1 = new Image()
    const img2 = new Image()

    img1.crossOrigin = "anonymous"
    img2.crossOrigin = "anonymous"

    return new Promise((resolve) => {
      let loadedCount = 0

      const onLoad = () => {
        loadedCount++
        if (loadedCount === 2) {
          // Resize images to same size for comparison
          const size = 100
          canvas1.width = canvas1.height = size
          canvas2.width = canvas2.height = size

          ctx1.drawImage(img1, 0, 0, size, size)
          ctx2.drawImage(img2, 0, 0, size, size)

          const data1 = ctx1.getImageData(0, 0, size, size).data
          const data2 = ctx2.getImageData(0, 0, size, size).data

          let diff = 0
          for (let i = 0; i < data1.length; i += 4) {
            diff += Math.abs(data1[i] - data2[i]) // Red
            diff += Math.abs(data1[i + 1] - data2[i + 1]) // Green
            diff += Math.abs(data1[i + 2] - data2[i + 2]) // Blue
          }

          const maxDiff = size * size * 3 * 255
          const similarity = Math.max(0, (1 - diff / maxDiff) * 100)
          resolve(Math.round(similarity))
        }
      }

      img1.onload = onLoad
      img2.onload = onLoad
      img1.onerror = () => resolve(50)
      img2.onerror = () => resolve(50)

      img1.src = img1Base64
      img2.src = img2Base64
    })
  } catch (error) {
    console.error("Similarity calculation failed:", error)
    return 50
  }
}

export async function analyzeImagesWithHuggingFace(packagingImage: File, deliveryImage: File): Promise<AnalysisResult> {
  try {
    // Convert images to base64
    const packagingBase64 = await convertImageToBase64(packagingImage)
    const deliveryBase64 = await convertImageToBase64(deliveryImage)

    // Analyze both images
    const [packagingDescription, deliveryDescription] = await Promise.all([
      analyzeImageWithHuggingFace(packagingBase64),
      analyzeImageWithHuggingFace(deliveryBase64),
    ])

    // Calculate similarity
    const similarityPercentage = await calculateImageSimilarity(packagingBase64, deliveryBase64)

    // Simple product matching logic
    const packagingWords = packagingDescription.toLowerCase().split(" ")
    const deliveryWords = deliveryDescription.toLowerCase().split(" ")
    const commonWords = packagingWords.filter((word) => deliveryWords.includes(word) && word.length > 3)

    const areProductsSame = commonWords.length > 2 || similarityPercentage > 70
    const confidenceScore = Math.min(95, Math.max(60, commonWords.length * 15 + similarityPercentage * 0.3))

    const differences = []
    if (similarityPercentage < 90) {
      differences.push(`Visual similarity: ${similarityPercentage}% - some differences detected`)
    }
    if (commonWords.length < 3) {
      differences.push("Product descriptions have limited overlap")
    }

    const summary = areProductsSame
      ? `Both images appear to show similar products. Packaging shows: "${packagingDescription}". Delivery shows: "${deliveryDescription}". Similarity score: ${similarityPercentage}%`
      : `Images show different products. Packaging: "${packagingDescription}". Delivery: "${deliveryDescription}". This may indicate a delivery mismatch.`

    return {
      packagingProduct: packagingDescription,
      deliveryProduct: deliveryDescription,
      areProductsSame,
      similarityPercentage,
      differences,
      summary,
      visualDifferences: `Pixel-based similarity: ${similarityPercentage}%`,
      confidenceScore: Math.round(confidenceScore),
      technicalAnalysis: {
        common_words: commonWords,
        pixel_similarity: similarityPercentage,
        method: "huggingface_blip",
      },
    }
  } catch (error) {
    console.error("Error analyzing images with Hugging Face:", error)
    throw new Error("Failed to analyze images. Please try again.")
  }
}
