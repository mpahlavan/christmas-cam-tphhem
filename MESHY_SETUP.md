
# Meshy AI Integration Setup Guide

This guide will help you set up the Meshy AI API for Christmas photo transformations.

## Prerequisites

1. A Meshy AI account (sign up at https://www.meshy.ai/)
2. Access to your Supabase project dashboard
3. The Supabase CLI installed (optional, for local testing)

## Step 1: Get Your Meshy API Key

1. Go to https://www.meshy.ai/ and sign up or log in
2. Navigate to your account settings or API section
3. Generate a new API key
4. Copy the API key (it should start with something like `msy_...`)

## Step 2: Add API Key to Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/wmuowsqzbrqgtbmunkdx
2. Navigate to **Edge Functions** in the left sidebar
3. Click on **Manage secrets** or **Environment Variables**
4. Add a new secret:
   - Name: `MESHY_API_KEY`
   - Value: Your Meshy API key (e.g., `msy_xxxxxxxxxxxxx`)
5. Click **Save**

### Option B: Using Supabase CLI

```bash
# Set the secret for your project
supabase secrets set MESHY_API_KEY=your_meshy_api_key_here --project-ref wmuowsqzbrqgtbmunkdx
```

## Step 3: Create Storage Bucket

The app needs a storage bucket to save transformed images.

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket with these settings:
   - Name: `christmas-images`
   - Public bucket: **Yes** (so users can view their transformed images)
   - File size limit: 50 MB (recommended)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/jpg`

5. Set up storage policies for the bucket:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'christmas-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'christmas-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'christmas-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 4: Deploy the Edge Function

The Edge Function is already in your project at `supabase/functions/christmas-transform/index.ts`.

### Deploy using Supabase CLI:

```bash
# Deploy the function
supabase functions deploy christmas-transform --project-ref wmuowsqzbrqgtbmunkdx
```

### Or deploy via Supabase Dashboard:

1. Go to **Edge Functions** in your Supabase dashboard
2. The function should appear automatically if you have the Supabase CLI linked
3. Click **Deploy** on the `christmas-transform` function

## Step 5: Test the Integration

1. Open your app
2. Take or select a photo
3. Choose one or more Christmas filters (Snow, Santa Hat, Lights, Frame)
4. Tap **Apply AI Transform**
5. Wait for the transformation (this may take 10-60 seconds depending on image size)
6. Your transformed image should appear!

## Troubleshooting

### Error: "Meshy API not configured"
- Make sure you've added the `MESHY_API_KEY` environment variable to Supabase
- Redeploy the Edge Function after adding the secret

### Error: "Upload failed"
- Verify the `christmas-images` storage bucket exists
- Check that the bucket is set to public
- Verify the storage policies are correctly set up

### Error: "Task timeout"
- The image might be too large. Try using a smaller image
- Meshy AI can take 30-60 seconds for complex transformations
- Check your Meshy AI account quota/limits

### Error: "Unauthorized"
- Make sure you're signed in to the app
- Check that Supabase authentication is working

### Error: "Failed to fetch image"
- The image URI might be invalid
- Check network connectivity
- Try selecting a different image

## Meshy AI API Limits

- Free tier: Limited number of transformations per month
- Check your Meshy AI dashboard for current usage and limits
- Consider upgrading to a paid plan for production use

## Alternative: Using OpenAI DALL-E Instead

If you prefer to use OpenAI's DALL-E for image transformations instead of Meshy:

1. Get an OpenAI API key from https://platform.openai.com/
2. Add it to Supabase secrets as `OPENAI_API_KEY`
3. Modify the Edge Function to use OpenAI's image editing API (similar to the example in the knowledge base)

## Support

For issues with:
- **Meshy AI**: Contact Meshy support at https://www.meshy.ai/support
- **Supabase**: Check Supabase docs at https://supabase.com/docs
- **This app**: Check the app logs in Supabase Edge Functions dashboard

## Cost Considerations

- **Meshy AI**: Check pricing at https://www.meshy.ai/pricing
- **Supabase Storage**: Free tier includes 1GB storage, then $0.021/GB/month
- **Supabase Edge Functions**: Free tier includes 500K invocations/month

Estimated cost per transformation:
- Meshy API call: ~$0.01-0.05 (varies by plan)
- Storage: ~$0.0001 per image stored
- Edge Function: Free (within limits)

Total: ~$0.01-0.05 per transformation
