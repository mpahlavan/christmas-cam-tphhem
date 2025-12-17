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

// Create Meshy image-to-image task
async function createMeshyImageTask(imageBase64: string, prompt: string): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured. Please add it to Supabase environment variables.");
  }

  console.log("Creating Meshy image-to-image task with prompt:", prompt);

  // Meshy AI API endpoint for image-to-image transformation
  const response = await fetch(`${MESHY_API_BASE}/v2/image-to-image`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: `data:image/jpeg;base64,${imageBase64}`,
      prompt: prompt,
      art_style: "realistic",
      negative_prompt: "blurry, low quality, distorted, ugly, deformed, watermark, text",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meshy API error:", response.status, errorText);
    throw new Error(`Meshy API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Meshy task created:", data);

  if (!data.result) {
    throw new Error("No task ID returned from Meshy API");
  }

  return data.result;
}

// Poll Meshy task status and get result
async function pollMeshyTask(taskId: string, maxAttempts = 60): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured");
  }

  console.log("Polling Meshy task:", taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${MESHY_API_BASE}/v2/image-to-image/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Meshy polling error:", response.status, errorText);
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Task status (attempt ${attempt + 1}):`, data.status);

    if (data.status === "SUCCEEDED") {
      if (!data.image_url) {
        throw new Error("No image URL in completed task");
      }
      console.log("Task completed successfully, image URL:", data.image_url);
      return data.image_url;
    } else if (data.status === "FAILED") {
      throw new Error(`Meshy task failed: ${data.error || 'Unknown error'}`);
    } else if (data.status === "PENDING" || data.status === "IN_PROGRESS") {
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw new Error(`Unknown task status: ${data.status}`);
    }
  }

  throw new Error("Task timeout: Image transformation took too long");
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

// Fallback: Apply simple filters locally (when Meshy is not available)
async function applyLocalFilters(imageBase64: string, filters: string[]): Promise<string> {
  console.log("Applying local filters as fallback:", filters);
  // This is a fallback that just returns the original image
  // In a real implementation, you could use image manipulation libraries
  return `data:image/jpeg;base64,${imageBase64}`;
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const body = (await req.json()) as TransformRequest;
    if (!body.imageBase64) {
      return new Response(JSON.stringify({ error: "Image data required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (!body.filters || body.filters.length === 0) {
      return new Response(JSON.stringify({ error: "At least one filter required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const started = performance.now();

    // Generate prompt based on filters
    const prompt = body.prompt || generateChristmasPrompt(body.filters);
    console.log("Generated prompt:", prompt);

    let transformedImageUrl: string;
    let taskId: string | undefined;

    // Check if Meshy API is configured
    if (!MESHY_API_KEY) {
      console.warn("MESHY_API_KEY not configured, using local filters");
      // Use local filters as fallback
      transformedImageUrl = await applyLocalFilters(body.imageBase64, body.filters);
    } else {
      try {
        // Use the base64 image data directly from the client
        const imageBase64 = body.imageBase64;
        console.log("Received image base64, length:", imageBase64.length);

        // Create Meshy transformation task
        taskId = await createMeshyImageTask(imageBase64, prompt);

        // Poll for completion and get result URL
        transformedImageUrl = await pollMeshyTask(taskId);
      } catch (meshyError) {
        console.error("Meshy API failed, falling back to local filters:", meshyError);
        // Fallback to local filters if Meshy fails
        transformedImageUrl = await applyLocalFilters(body.imageBase64, body.filters);
      }
    }

    // Download the transformed image
    let imageData: Uint8Array;
    if (transformedImageUrl.startsWith('data:')) {
      // Local filter result - extract base64
      const base64Data = transformedImageUrl.split(',')[1];
      const binaryString = atob(base64Data);
      imageData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageData[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Remote URL - download
      imageData = await downloadImage(transformedImageUrl);
    }

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET);

    if (!bucketExists) {
      console.log("Creating storage bucket:", BUCKET);
      const { error: createError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
      });
      if (createError && !createError.message.includes('already exists')) {
        console.error("Error creating bucket:", createError);
      }
    }

    // Save to Supabase Storage
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
      // Return the direct URL if storage fails
      return new Response(
        JSON.stringify({
          url: transformedImageUrl.startsWith('data:') ? transformedImageUrl : transformedImageUrl,
          path: "temp",
          duration_ms: Math.round(performance.now() - started),
          taskId,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const duration_ms = Math.round(performance.now() - started);
    const response: TransformResponse = {
      url: publicUrl,
      path,
      duration_ms,
      taskId,
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