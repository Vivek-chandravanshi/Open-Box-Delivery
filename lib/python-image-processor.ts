// Python-based image processing using Pyodide
let pyodideInstance: any = null

export async function initializePyodide() {
  if (pyodideInstance) return pyodideInstance

  try {
    // Check if we're in browser environment
    if (typeof window === "undefined") {
      throw new Error("Pyodide can only run in browser environment")
    }

    // Wait for loadPyodide to be available
    let attempts = 0
    while (!(window as any).loadPyodide && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!(window as any).loadPyodide) {
      throw new Error("Pyodide failed to load after 5 seconds")
    }

    console.log("Loading Pyodide...")

    // Load Pyodide with error handling
    const pyodide = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      stdout: (text: string) => console.log("Pyodide stdout:", text),
      stderr: (text: string) => console.warn("Pyodide stderr:", text),
    })

    console.log("Pyodide loaded, installing packages...")

    // Install required packages with error handling
    try {
      await pyodide.loadPackage(["numpy", "pillow"])
      console.log("Basic packages installed")

      // Try to install scikit-image, but continue if it fails
      try {
        await pyodide.loadPackage(["scikit-image"])
        console.log("scikit-image installed")
      } catch (skimageError) {
        console.warn("scikit-image installation failed, using basic comparison:", skimageError)
      }
    } catch (packageError) {
      console.error("Package installation failed:", packageError)
      throw new Error("Failed to install required Python packages")
    }

    // Define Python functions for image processing with fallbacks
    pyodide.runPython(`
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
import base64
import json

# Try to import scikit-image, use fallback if not available
try:
    from skimage.metrics import structural_similarity as ssim
    from skimage import color, feature
    SCIKIT_AVAILABLE = True
    print("scikit-image available")
except ImportError:
    SCIKIT_AVAILABLE = False
    print("scikit-image not available, using basic comparison")

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    try:
        image_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_data))
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        raise

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    try:
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85)
        return base64.b64encode(buffer.getvalue()).decode()
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        raise

def preprocess_image(base64_string):
    """Preprocess image for better analysis"""
    try:
        image = base64_to_image(base64_string)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Enhance contrast and sharpness
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        # Resize to standard size for comparison
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        
        return image_to_base64(image)
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return base64_string  # Return original if preprocessing fails

def calculate_similarity_basic(base64_img1, base64_img2):
    """Basic similarity calculation using PIL only"""
    try:
        img1 = base64_to_image(base64_img1)
        img2 = base64_to_image(base64_img2)
        
        # Convert to same size
        size = (256, 256)
        img1 = img1.resize(size).convert('RGB')
        img2 = img2.resize(size).convert('RGB')
        
        # Convert to numpy arrays
        arr1 = np.array(img1)
        arr2 = np.array(img2)
        
        # Calculate mean squared error
        mse = np.mean((arr1 - arr2) ** 2)
        
        # Convert MSE to similarity percentage (inverse relationship)
        max_mse = 255 ** 2  # Maximum possible MSE for 8-bit images
        similarity = max(0, (1 - mse / max_mse) * 100)
        
        return float(similarity)
    except Exception as e:
        print(f"Error in basic similarity calculation: {e}")
        return 75.0  # Default similarity

def calculate_similarity_advanced(base64_img1, base64_img2):
    """Advanced similarity calculation using scikit-image"""
    try:
        img1 = base64_to_image(base64_img1)
        img2 = base64_to_image(base64_img2)
        
        # Convert to grayscale
        img1_gray = np.array(img1.convert('L'))
        img2_gray = np.array(img2.convert('L'))
        
        # Resize to same dimensions
        if img1_gray.shape != img2_gray.shape:
            img2_gray = np.array(Image.fromarray(img2_gray).resize(img1_gray.shape[::-1]))
        
        # Calculate SSIM
        similarity_score = ssim(img1_gray, img2_gray)
        
        return float(similarity_score * 100)  # Convert to percentage
    except Exception as e:
        print(f"Error in advanced similarity calculation: {e}")
        return calculate_similarity_basic(base64_img1, base64_img2)

def calculate_similarity(base64_img1, base64_img2):
    """Calculate similarity using best available method"""
    if SCIKIT_AVAILABLE:
        return calculate_similarity_advanced(base64_img1, base64_img2)
    else:
        return calculate_similarity_basic(base64_img1, base64_img2)

def detect_features_basic(base64_string):
    """Basic feature detection using PIL only"""
    try:
        image = base64_to_image(base64_string)
        img_array = np.array(image.convert('RGB'))
        
        # Calculate basic statistics
        brightness = float(np.mean(img_array))
        contrast = float(np.std(img_array))
        
        # Simple color analysis
        r_mean = float(np.mean(img_array[:,:,0]))
        g_mean = float(np.mean(img_array[:,:,1]))
        b_mean = float(np.mean(img_array[:,:,2]))
        
        dominant_colors = []
        if r_mean > g_mean and r_mean > b_mean:
            dominant_colors.append("red_dominant")
        elif g_mean > r_mean and g_mean > b_mean:
            dominant_colors.append("green_dominant")
        else:
            dominant_colors.append("blue_dominant")
        
        return {
            "brightness": brightness,
            "contrast": contrast,
            "dominant_colors": dominant_colors,
            "r_mean": r_mean,
            "g_mean": g_mean,
            "b_mean": b_mean
        }
    except Exception as e:
        print(f"Error in basic feature detection: {e}")
        return {
            "brightness": 128.0,
            "contrast": 50.0,
            "dominant_colors": [],
            "r_mean": 128.0,
            "g_mean": 128.0,
            "b_mean": 128.0
        }

def detect_features_advanced(base64_string):
    """Advanced feature detection using scikit-image"""
    try:
        image = base64_to_image(base64_string)
        img_array = np.array(image.convert('L'))
        
        # Detect edges
        edges = feature.canny(img_array)
        edge_density = float(np.sum(edges) / edges.size)
        
        # Get basic features
        basic_features = detect_features_basic(base64_string)
        basic_features["edge_density"] = edge_density
        
        return basic_features
    except Exception as e:
        print(f"Error in advanced feature detection: {e}")
        return detect_features_basic(base64_string)

def detect_features(base64_string):
    """Detect features using best available method"""
    if SCIKIT_AVAILABLE:
        return detect_features_advanced(base64_string)
    else:
        return detect_features_basic(base64_string)

def compare_images_advanced(base64_img1, base64_img2):
    """Advanced image comparison using available methods"""
    try:
        # Preprocess images
        processed_img1 = preprocess_image(base64_img1)
        processed_img2 = preprocess_image(base64_img2)
        
        # Calculate similarity
        similarity = calculate_similarity(processed_img1, processed_img2)
        
        # Extract features
        features1 = detect_features(base64_img1)
        features2 = detect_features(base64_img2)
        
        # Compare features
        brightness_diff = abs(features1["brightness"] - features2["brightness"])
        contrast_diff = abs(features1["contrast"] - features2["contrast"])
        
        # Generate differences list
        differences = []
        if brightness_diff > 20:
            differences.append(f"Brightness difference: {brightness_diff:.1f}")
        if contrast_diff > 15:
            differences.append(f"Contrast difference: {contrast_diff:.1f}")
        
        # Color comparison
        r_diff = abs(features1.get("r_mean", 0) - features2.get("r_mean", 0))
        g_diff = abs(features1.get("g_mean", 0) - features2.get("g_mean", 0))
        b_diff = abs(features1.get("b_mean", 0) - features2.get("b_mean", 0))
        
        if max(r_diff, g_diff, b_diff) > 30:
            differences.append("Significant color differences detected")
        
        # Edge comparison (if available)
        if "edge_density" in features1 and "edge_density" in features2:
            edge_diff = abs(features1["edge_density"] - features2["edge_density"])
            if edge_diff > 0.1:
                differences.append(f"Edge detail difference: {edge_diff:.3f}")
        
        return {
            "similarity_percentage": similarity,
            "differences": differences,
            "features_comparison": {
                "brightness_diff": brightness_diff,
                "contrast_diff": contrast_diff,
                "color_diff": max(r_diff, g_diff, b_diff),
                "method_used": "advanced" if SCIKIT_AVAILABLE else "basic"
            }
        }
    except Exception as e:
        print(f"Error in advanced comparison: {e}")
        return {
            "similarity_percentage": 50.0,
            "differences": ["Error in image processing"],
            "features_comparison": {"error": str(e)}
        }

print("Python image processing functions loaded successfully")
`)

    pyodideInstance = pyodide
    console.log("Pyodide initialization completed successfully")
    return pyodide
  } catch (error) {
    console.error("Failed to initialize Pyodide:", error)
    throw new Error(`Failed to initialize Python image processing: ${error}`)
  }
}

export async function processImagesWithPython(img1Base64: string, img2Base64: string) {
  const pyodide = await initializePyodide()

  try {
    // Set the base64 images in Python
    pyodide.globals.set("img1_base64", img1Base64)
    pyodide.globals.set("img2_base64", img2Base64)

    // Run the comparison
    const result = pyodide.runPython(`
result = compare_images_advanced(img1_base64, img2_base64)
import json
json.dumps(result)
`)

    return JSON.parse(result)
  } catch (error) {
    console.error("Error processing images with Python:", error)
    throw new Error("Python image processing failed")
  }
}
