
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
  imageUri: string;
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

// Create Meshy image-to-image task
async function createMeshyTask(imageBase64: string, prompt: string): Promise<string> {
  if (!MESHY_API_KEY) {
    throw new Error("MESHY_API_KEY not configured. Please add it to Supabase environment variables.");
  }

  console.log("Creating Meshy task with prompt:", prompt);
  
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
      if (!data.output || !data.output.image_url) {
        throw new Error("No output image URL in completed task");
      }
      console.log("Task completed successfully, image URL:", data.output.image_url);
      return data.output.image_url;
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
    if (!body.imageUri) {
      return new Response(JSON.stringify({ error: "Image URI required" }), {
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

    // Step 1: Convert image to base64
    const imageBase64 = await imageUrlToBase64(body.imageUri);

    // Step 2: Create Meshy transformation task
    const taskId = await createMeshyTask(imageBase64, prompt);

    // Step 3: Poll for completion and get result URL
    const transformedImageUrl = await pollMeshyTask(taskId);

    // Step 4: Download the transformed image
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
</write file>

Now let me also create a storage bucket setup guide and update the hook to handle better error messages:

<write file="hooks/useChristmasTransform.ts">
import { useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export type ChristmasTransformParams = {
  imageUri: string;
  filters: string[];
  prompt?: string;
};

export type ChristmasTransformResult = {
  url: string;
  path: string;
  duration_ms: number;
  taskId?: string;
};

type State =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: ChristmasTransformResult; error: null }
  | { status: 'error'; data: null; error: string };

export function useChristmasTransform() {
  const [state, setState] = useState<State>({
    status: 'idle',
    data: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  const transform = useCallback(
    async (
      params: ChristmasTransformParams
    ): Promise<ChristmasTransformResult | null> => {
      if (!params.imageUri) {
        setState({
          status: 'error',
          data: null,
          error: 'Image URI is required',
        });
        return null;
      }

      if (!params.filters || params.filters.length === 0) {
        setState({
          status: 'error',
          data: null,
          error: 'Please select at least one Christmas filter',
        });
        return null;
      }

      setState({ status: 'loading', data: null, error: null });

      try {
        console.log('Calling christmas-transform function with:', {
          imageUri: params.imageUri.substring(0, 50) + '...',
          filters: params.filters,
          hasPrompt: !!params.prompt,
        });

        const { data, error } = await supabase.functions.invoke(
          'christmas-transform',
          {
            body: {
              imageUri: params.imageUri,
              filters: params.filters,
              prompt: params.prompt,
            },
          }
        );

        if (error) {
          console.error('Transform error:', error);
          let message = 'Failed to transform image';
          
          if (error.message) {
            message = error.message;
          } else if (typeof error === 'object' && 'detail' in error) {
            message = (error as any).detail;
          }
          
          throw new Error(message);
        }

        if (!data) {
          throw new Error('No data returned from transformation');
        }

        console.log('Transform successful:', {
          url: data.url?.substring(0, 50) + '...',
          duration_ms: data.duration_ms,
          taskId: data.taskId,
        });

        const result = data as ChristmasTransformResult;
        setState({ status: 'success', data: result, error: null });
        return result;
      } catch (err: any) {
        console.error('Transform exception:', err);
        let message = 'Unknown error occurred';
        
        if (err?.message) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }

        // Provide user-friendly error messages
        if (message.includes('MESHY_API_KEY')) {
          message = 'AI transformation service is not configured. Please contact support.';
        } else if (message.includes('timeout')) {
          message = 'Transformation is taking longer than expected. Please try again with a smaller image.';
        } else if (message.includes('Unauthorized')) {
          message = 'Please sign in to use AI transformations.';
        } else if (message.includes('Failed to fetch')) {
          message = 'Network error. Please check your internet connection and try again.';
        }

        setState({ status: 'error', data: null, error: message });
        return null;
      }
    },
    []
  );

  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.error : null;
  const data = state.status === 'success' ? state.data : null;

  return { transform, loading, error, data, reset };
}
