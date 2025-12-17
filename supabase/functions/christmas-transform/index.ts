
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "christmas-images";
const MESHY_API_KEY = Deno.env.get("MESHY_API_KEY");
const MESHY_API_BASE = "https://api.meshy.ai";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

type TransformRequest = {
  imageBase64: string;
  filters: string[];
  prompt?: string;
};

type TransformResponse = {
  url: string;
  path: string;
  duration_ms: number;
  taskId?: string;
  modelUrl?: string;
  texturedModelUrl?: string;
};

// Generate Christmas-themed prompt based on selected filters
function generateChristmasPrompt(filters: string[]): string {
  const prompts: Record<string, string> = {
    snow: "Add realistic falling snow, snowflakes, and winter atmosphere with snow on surfaces",
    santa: "Add a festive red Santa hat with white fur trim on the main subject's head",
    lights: "Add colorful twinkling Christmas lights, warm glowing string lights, and festive illumination",
    frame: "Add an elegant Christmas-themed decorative border frame with holly leaves, red berries, pine branches, and ornaments",
  };

  const selectedPrompts = filters
    .map((filter) => prompts[filter])
    .filter(Boolean);

  if (selectedPrompts.length === 0) {
    return "Add festive Christmas decorations, holiday atmosphere, warm lighting, and seasonal elements while keeping the original subject intact";
  }

  return `Transform this photo with Christmas holiday theme: ${selectedPrompts.join(", ")}. Maintain the original composition and subject while naturally blending festive Christmas elements. Make it look magical and festive with rich holiday colors and warm atmosphere.`;
}

// Convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    console.log("Fetching image from URL:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    console.log("Image converted to base64, length:", base64.length);
    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create Meshy image-to-3D task
async function createMeshy3DTask(imageBase64: string): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured. Please add it to Supabase environment variables.");
  }

  console.log("Creating Meshy image-to-3D task");

  // Meshy AI API endpoint for image-to-3D transformation
  const response = await fetch(`${MESHY_API_BASE}/v1/image-to-3d`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: `data:image/jpeg;base64,${imageBase64}`,
      enable_pbr: true,
      surface_mode: "organic",
      model_resolution: "high"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meshy 3D API error:", response.status, errorText);
    throw new Error(`Meshy 3D API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Meshy 3D task created:", data);

  if (!data.result) {
    throw new Error("No task ID returned from Meshy 3D API");
  }

  return data.result;
}

// Create Meshy texture generation task with Christmas theme
async function createMeshyTextureTask(modelUrl: string, prompt: string): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured");
  }

  console.log("Creating Meshy texture task with Christmas theme:", prompt);

  // Use text-to-texture API to apply Christmas theme to 3D model
  const response = await fetch(`${MESHY_API_BASE}/v1/text-to-texture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_url: modelUrl,
      prompt: prompt,
      art_style: "realistic",
      negative_prompt: "blurry, low quality, distorted",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meshy texture API error:", response.status, errorText);
    throw new Error(`Meshy texture API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Meshy texture task created:", data);

  if (!data.result) {
    throw new Error("No task ID returned from Meshy texture API");
  }

  return data.result;
}

// Poll Meshy 3D task status and get result
async function pollMeshy3DTask(taskId: string, maxAttempts = 120): Promise<{ modelUrl: string; thumbnailUrl: string }> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured");
  }

  console.log("Polling Meshy 3D task:", taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${MESHY_API_BASE}/v1/image-to-3d/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Meshy 3D polling error:", response.status, errorText);
      throw new Error(`Failed to check 3D task status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`3D Task status (attempt ${attempt + 1}):`, data.status);

    if (data.status === "SUCCEEDED") {
      if (!data.model_urls || !data.model_urls.glb) {
        throw new Error("No model URL in completed 3D task");
      }
      console.log("3D task completed successfully, model URL:", data.model_urls.glb);
      return {
        modelUrl: data.model_urls.glb,
        thumbnailUrl: data.thumbnail_url || data.model_urls.glb
      };
    } else if (data.status === "FAILED") {
      throw new Error(`Meshy 3D task failed: ${data.error || 'Unknown error'}`);
    } else if (data.status === "PENDING" || data.status === "IN_PROGRESS" || data.status === "IN_QUEUE") {
      // Wait 3 seconds before next poll (3D generation takes longer)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      throw new Error(`Unknown 3D task status: ${data.status}`);
    }
  }

  throw new Error("3D Task timeout: 3D model generation took too long");
}

// Poll Meshy texture task status and get result
async function pollMeshyTextureTask(taskId: string, maxAttempts = 60): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured");
  }

  console.log("Polling Meshy texture task:", taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${MESHY_API_BASE}/v1/text-to-texture/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Meshy texture polling error:", response.status, errorText);
      throw new Error(`Failed to check texture task status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Texture task status (attempt ${attempt + 1}):`, data.status);

    if (data.status === "SUCCEEDED") {
      if (!data.model_urls || !data.model_urls.glb) {
        throw new Error("No textured model URL in completed task");
      }
      console.log("Texture task completed successfully, model URL:", data.model_urls.glb);
      return data.model_urls.glb;
    } else if (data.status === "FAILED") {
      throw new Error(`Meshy texture task failed: ${data.error || 'Unknown error'}`);
    } else if (data.status === "PENDING" || data.status === "IN_PROGRESS" || data.status === "IN_QUEUE") {
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw new Error(`Unknown texture task status: ${data.status}`);
    }
  }

  throw new Error("Texture task timeout: Texture generation took too long");
}

// Download image from URL
async function downloadImage(url: string): Promise<Uint8Array> {
  console.log("Downloading transformed image from:", url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Verify authentication
    const auth = req.headers.get("Authorization") || "";
    const { data: user } = await supabase.auth.getUser(
      auth.replace("Bearer ", "")
    );
    if (!user?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as TransformRequest;
    if (!body.imageBase64) {
      return new Response(JSON.stringify({ error: "Image data required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.filters || body.filters.length === 0) {
      return new Response(JSON.stringify({ error: "At least one filter required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const started = performance.now();

    // Generate prompt based on filters
    const prompt = body.prompt || generateChristmasPrompt(body.filters);
    console.log("Generated prompt:", prompt);

    // Check if Meshy API is configured
    if (!MESHY_API_KEY) {
      console.warn("MESHY_API_KEY not configured, returning original image");
      return new Response(
        JSON.stringify({
          error: "Meshy API not configured",
          detail: "Please add MESHY_API_KEY to Supabase environment variables to enable AI transformations",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use the base64 image data directly from the client
    const imageBase64 = body.imageBase64;
    console.log("Received image base64, length:", imageBase64.length);

    // Step 1: Create 3D model from image
    console.log("Step 1: Creating 3D model from image...");
    const task3DId = await createMeshy3DTask(imageBase64);

    // Step 2: Poll for 3D model completion
    console.log("Step 2: Waiting for 3D model generation...");
    const { modelUrl, thumbnailUrl } = await pollMeshy3DTask(task3DId);

    // Step 3: Apply Christmas textures to 3D model
    console.log("Step 3: Applying Christmas theme to 3D model...");
    const textureTaskId = await createMeshyTextureTask(modelUrl, prompt);

    // Step 4: Poll for textured model completion
    console.log("Step 4: Waiting for Christmas texture application...");
    const texturedModelUrl = await pollMeshyTextureTask(textureTaskId);

    // Step 5: Get the preview/thumbnail of the final 3D model
    // For now, we'll return the thumbnail URL as the transformed image
    // In a full implementation, you'd render the 3D model to an image
    const transformedImageUrl = thumbnailUrl;

    // Step 6: Download the transformed image
    const imageData = await downloadImage(transformedImageUrl);

    // Step 5: Save to Supabase Storage
    const fileName = `${crypto.randomUUID()}.jpg`;
    const path = `${user.user.id}/${Date.now()}-${fileName}`;

    console.log("Uploading transformed image to storage:", path);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, imageData, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({
          error: "Upload failed",
          detail: uploadError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const duration_ms = Math.round(performance.now() - started);
    const response: TransformResponse = {
      url: publicUrl,
      path,
      duration_ms,
      taskId: task3DId,
      modelUrl,
      texturedModelUrl,
    };

    console.log("Transformation completed successfully:", response);

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (e) {
    console.error("Error in christmas-transform:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        error: "Transformation failed",
        detail: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
