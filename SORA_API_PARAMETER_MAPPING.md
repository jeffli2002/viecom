# Sora 2 Pro API Parameter Mapping

## 📋 API Documentation Analysis

Based on KIE.ai Sora 2 Pro API documentation, here's the parameter mapping guide.

---

## 🎯 **API Parameter Requirements**

### Text-to-Video API
```
Model: "sora-2-pro-text-to-video"
```

### Image-to-Video API
```
Model: "sora-2-pro-image-to-video"
```

---

## 🔄 **Parameter Mapping**

### 1. Aspect Ratio Conversion

#### Our UI → KIE API
```typescript
Frontend Value → Backend → KIE API
────────────────────────────────────
'16:9'  →  aspect_ratio  →  'landscape'
'9:16'  →  aspect_ratio  →  'portrait'
```

**Backend Conversion Logic:**
```typescript
const kieAspectRatio = aspectRatio === '16:9' ? 'landscape' : 'portrait';
```

---

### 2. Duration (n_frames)

#### Our UI → KIE API
```typescript
Frontend Value → Backend → KIE API
────────────────────────────────────
10 (number)  →  duration  →  "10" (string)
15 (number)  →  duration  →  "15" (string)
```

**Important**: KIE API expects **string**, not number

**Backend Conversion Logic:**
```typescript
const nFrames = String(duration); // Convert to string
```

---

### 3. Quality (size)

#### Our UI → KIE API
```typescript
Frontend Value → Backend → KIE API
────────────────────────────────────
'standard'  →  quality  →  'standard'  (720P)
'high'      →  quality  →  'high'     (1080P)
```

**Direct mapping**, no conversion needed

---

### 4. Model Name Mapping

#### Our UI → KIE API
```typescript
Frontend Value → Backend → KIE API Model Name
──────────────────────────────────────────────
'sora-2'  →  for T2V  →  'sora-2-text-to-video'
'sora-2'  →  for I2V  →  'sora-2-image-to-video'

'sora-2-pro'  →  for T2V  →  'sora-2-pro-text-to-video'
'sora-2-pro'  →  for I2V  →  'sora-2-pro-image-to-video'
```

---

## 📊 **Complete Request Body Mapping**

### Text-to-Video (Sora 2 Pro)

#### Frontend Sends
```json
{
  "prompt": "a happy dog running...",
  "model": "sora-2-pro",
  "aspect_ratio": "16:9",
  "style": "cinematic",
  "duration": 15,
  "quality": "high",
  "output_format": "mp4"
}
```

#### Backend Transforms to KIE API
```json
{
  "model": "sora-2-pro-text-to-video",
  "input": {
    "prompt": "a happy dog running...",
    "aspect_ratio": "landscape",
    "n_frames": "15",
    "size": "high",
    "remove_watermark": true
  }
}
```

---

### Image-to-Video (Sora 2 Pro)

#### Frontend Sends
```json
{
  "prompt": "create dynamic motion...",
  "model": "sora-2-pro",
  "aspect_ratio": "9:16",
  "style": "professional",
  "duration": 10,
  "quality": "standard",
  "output_format": "mp4",
  "image": "data:image/png;base64,..."
}
```

#### Backend Transforms to KIE API
```json
{
  "model": "sora-2-pro-image-to-video",
  "input": {
    "prompt": "create dynamic motion...",
    "image_urls": ["https://uploaded-image-url.jpg"],
    "aspect_ratio": "portrait",
    "n_frames": "10",
    "size": "standard",
    "remove_watermark": true
  }
}
```

---

## 🎯 **Backend Implementation Guide**

### KIE API Service Update

**File**: `src/lib/kie/kie-api.ts`

```typescript
export interface KIEVideoGenerationParams {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  aspectRatio: '16:9' | '9:16';
  duration: 10 | 15;
  quality?: 'standard' | 'high';
  image?: string; // For I2V mode
}

async generateVideo(params: KIEVideoGenerationParams): Promise<KIETaskResponse> {
  const { prompt, model, aspectRatio, duration, quality = 'standard', image } = params;
  
  // Determine KIE model name
  const isI2V = !!image;
  const kieModel = model === 'sora-2'
    ? (isI2V ? 'sora-2-image-to-video' : 'sora-2-text-to-video')
    : (isI2V ? 'sora-2-pro-image-to-video' : 'sora-2-pro-text-to-video');
  
  // Convert aspect ratio
  const kieAspectRatio = aspectRatio === '16:9' ? 'landscape' : 'portrait';
  
  // Convert duration to string
  const nFrames = String(duration);
  
  // Build request body
  const requestBody: any = {
    model: kieModel,
    input: {
      prompt: prompt,
      aspect_ratio: kieAspectRatio,
      n_frames: nFrames,
      size: quality,
      remove_watermark: true, // Always remove watermark for paid users
    }
  };
  
  // Add image_urls for I2V mode
  if (isI2V && image) {
    // Upload image first and get public URL
    const imageUrl = await this.uploadImage(image);
    requestBody.input.image_urls = [imageUrl];
  }
  
  // Call KIE API
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  // ...
}
```

---

## 🔍 **Current Frontend Implementation Review**

### Video Generator (Single)
**File**: `src/components/video-generator.tsx` (Lines 283-291)

```typescript
const requestBody: any = {
  prompt: finalPrompt,
  model: model,                                           // ✅ 'sora-2' or 'sora-2-pro'
  aspect_ratio: aspectRatio,                             // ✅ '16:9' or '9:16'
  style: videoStyle,
  duration: duration,                                     // ✅ 10 or 15
  quality: model === 'sora-2-pro' ? quality : 'standard', // ✅ 'standard' or 'high'
  output_format: 'mp4',
};
```

**Status**: ✅ All parameters present, backend needs to transform

---

### Batch Video Generator
**File**: `src/components/workflow/batch-generation-flow.tsx` (Lines 537-541)

```typescript
...(generationType === 'video' && {
  model: videoModel,                                      // ✅ 'sora-2' or 'sora-2-pro'
  duration: videoDuration,                                // ✅ 10 or 15
  quality: videoModel === 'sora-2-pro' ? videoQuality : 'standard', // ✅
})
```

**Status**: ✅ All parameters present, backend needs to transform

---

## 🎯 **Backend Transformation Checklist**

### Required Transformations

| Frontend Param | Frontend Value | KIE API Param | KIE API Value | Status |
|----------------|----------------|---------------|---------------|---------|
| `model` | 'sora-2' | `model` | 'sora-2-text-to-video' | ⚠️ Backend |
| `model` | 'sora-2-pro' | `model` | 'sora-2-pro-text-to-video' | ⚠️ Backend |
| `aspect_ratio` | '16:9' | `input.aspect_ratio` | 'landscape' | ⚠️ Backend |
| `aspect_ratio` | '9:16' | `input.aspect_ratio` | 'portrait' | ⚠️ Backend |
| `duration` | 10 (number) | `input.n_frames` | "10" (string) | ⚠️ Backend |
| `duration` | 15 (number) | `input.n_frames` | "15" (string) | ⚠️ Backend |
| `quality` | 'standard' | `input.size` | 'standard' | ✅ Direct |
| `quality` | 'high' | `input.size` | 'high' | ✅ Direct |
| `image` | base64 | `input.image_urls` | [URL] | ⚠️ Backend (upload first) |

---

## 📝 **Backend API Handler Example**

### Video Generation API Route
**File**: `src/app/api/v1/generate-video/route.ts`

```typescript
export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Parse frontend request
  const body = await request.json();
  const { 
    prompt, 
    model,          // 'sora-2' or 'sora-2-pro'
    aspect_ratio,   // '16:9' or '9:16'
    style,
    duration,       // 10 or 15
    quality,        // 'standard' or 'high'
    image           // Optional base64 for I2V
  } = body;
  
  // Determine mode (T2V or I2V)
  const isI2V = !!image;
  
  // Transform model name for KIE API
  const kieModel = model === 'sora-2'
    ? (isI2V ? 'sora-2-image-to-video' : 'sora-2-text-to-video')
    : (isI2V ? 'sora-2-pro-image-to-video' : 'sora-2-pro-text-to-video');
  
  // Transform aspect ratio
  const kieAspectRatio = aspect_ratio === '16:9' ? 'landscape' : 'portrait';
  
  // Transform duration to string
  const nFrames = String(duration);
  
  // Calculate credit cost
  let creditKey: string;
  if (model === 'sora-2') {
    creditKey = `sora-2-720p-${duration}s`;
  } else {
    const resolution = quality === 'standard' ? '720p' : '1080p';
    creditKey = `sora-2-pro-${resolution}-${duration}s`;
  }
  const creditCost = creditsConfig.consumption.videoGeneration[creditKey];
  
  // Deduct credits
  await creditService.deductCredits(session.user.id, creditCost);
  
  // Build KIE API request
  const kieRequestBody: any = {
    model: kieModel,
    input: {
      prompt: prompt,
      aspect_ratio: kieAspectRatio,
      n_frames: nFrames,
      size: quality,
      remove_watermark: true,
    }
  };
  
  // Handle image for I2V mode
  if (isI2V && image) {
    // Upload image to R2 or public storage
    const imageUrl = await uploadImageToStorage(image);
    kieRequestBody.input.image_urls = [imageUrl];
  }
  
  // Call KIE API
  const response = await kieApi.generateVideo(kieRequestBody);
  
  return NextResponse.json({
    success: true,
    data: {
      taskId: response.data.taskId,
      model: model,
      creditCost: creditCost,
    }
  });
}
```

---

## ✅ **Frontend Parameter Verification**

### Current Frontend Implementation

#### Single Video Generator ✅
```typescript
// src/components/video-generator.tsx (Lines 283-291)
const requestBody: any = {
  prompt: finalPrompt,
  model: model,                    // ✅ 'sora-2' or 'sora-2-pro'
  aspect_ratio: aspectRatio,       // ✅ '16:9' or '9:16'
  style: videoStyle,
  duration: duration,               // ✅ 10 or 15 (number)
  quality: quality,                 // ✅ 'standard' or 'high'
  output_format: 'mp4',
};
```

#### Batch Video Generator ✅
```typescript
// src/components/workflow/batch-generation-flow.tsx (Lines 537-541)
...(generationType === 'video' && {
  model: videoModel,                // ✅ 'sora-2' or 'sora-2-pro'
  duration: videoDuration,          // ✅ 10 or 15 (number)
  quality: videoQuality,            // ✅ 'standard' or 'high'
})
```

**Status**: ✅ Frontend sends correct parameters, backend handles transformation

---

## 🔧 **Backend Transformation Requirements**

### 1. Model Name Transformation
```typescript
// Input
model: 'sora-2' or 'sora-2-pro'
mode: 'text-to-video' or 'image-to-video'

// Output (for KIE API)
kieModel: 
  - 'sora-2-text-to-video'
  - 'sora-2-image-to-video'
  - 'sora-2-pro-text-to-video'
  - 'sora-2-pro-image-to-video'
```

### 2. Aspect Ratio Transformation
```typescript
// Input
aspect_ratio: '16:9' or '9:16'

// Output (for KIE API)
input.aspect_ratio:
  - '16:9' → 'landscape'
  - '9:16' → 'portrait'
```

### 3. Duration Transformation
```typescript
// Input
duration: 10 or 15 (number)

// Output (for KIE API)
input.n_frames: "10" or "15" (string)
```

### 4. Quality → Size Mapping
```typescript
// Input
quality: 'standard' or 'high'

// Output (for KIE API)
input.size: 'standard' or 'high'
```

### 5. Image Upload (I2V mode)
```typescript
// Input
image: "data:image/png;base64,..."

// Output (for KIE API)
input.image_urls: ["https://public-url/image.jpg"]

// Steps:
1. Decode base64
2. Upload to R2 or public storage
3. Get public URL
4. Pass URL array to KIE
```

---

## 📋 **Complete KIE API Request Examples**

### Example 1: Sora 2 Pro Text-to-Video (High Quality, 15s)

#### Frontend Request
```json
POST /api/v1/generate-video
{
  "prompt": "professional product video showcasing smartphone...",
  "model": "sora-2-pro",
  "aspect_ratio": "16:9",
  "style": "cinematic",
  "duration": 15,
  "quality": "high",
  "output_format": "mp4"
}
```

#### Backend → KIE API Request
```json
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "sora-2-pro-text-to-video",
  "input": {
    "prompt": "professional product video showcasing smartphone...",
    "aspect_ratio": "landscape",
    "n_frames": "15",
    "size": "high",
    "remove_watermark": true
  }
}
```

**Credit Cost**: 130 credits (Sora 2 Pro 1080P 15s)

---

### Example 2: Sora 2 Image-to-Video (Standard, 10s)

#### Frontend Request
```json
POST /api/v1/generate-video
{
  "prompt": "create dynamic motion from product image...",
  "model": "sora-2",
  "aspect_ratio": "9:16",
  "style": "professional",
  "duration": 10,
  "quality": "standard",
  "output_format": "mp4",
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

#### Backend → KIE API Request
```json
POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "sora-2-image-to-video",
  "input": {
    "prompt": "create dynamic motion from product image...",
    "image_urls": ["https://storage.viecom.ai/uploads/user123/image.jpg"],
    "aspect_ratio": "portrait",
    "n_frames": "10",
    "size": "standard",
    "remove_watermark": true
  }
}
```

**Credit Cost**: 15 credits (Sora 2 720P 10s)

---

## 🔄 **Complete Parameter Flow**

```
Frontend UI
    ↓
Frontend State
    ↓
Frontend API Call (/api/v1/generate-video)
    ↓
Backend Receives
    ↓
Backend Transforms Parameters
    ↓
Backend Calls KIE API (https://api.kie.ai/api/v1/jobs/createTask)
    ↓
KIE Generates Video
    ↓
Backend Polls KIE Status
    ↓
Backend Returns Result
    ↓
Frontend Displays Video
```

---

## ✅ **Frontend Status**

### All Parameters Sent ✅
- ✅ `prompt` - User input
- ✅ `model` - 'sora-2' or 'sora-2-pro'
- ✅ `aspect_ratio` - '16:9' or '9:16'
- ✅ `duration` - 10 or 15
- ✅ `quality` - 'standard' or 'high'
- ✅ `style` - Style ID (used for prompt enhancement)
- ✅ `image` - Base64 (for I2V mode)

### Frontend is Complete
- ✅ No changes needed to frontend
- ✅ All selectors implemented
- ✅ All parameters passed to backend
- ✅ Dynamic credit calculation working

---

## ⚠️ **Backend TODO**

### Implementation Checklist

- [ ] Update `src/lib/kie/kie-api.ts`:
  - [ ] Transform model name based on mode (T2V/I2V)
  - [ ] Convert aspect_ratio: '16:9' → 'landscape', '9:16' → 'portrait'
  - [ ] Convert duration number → string
  - [ ] Map quality → size
  - [ ] Upload image and get public URL for I2V
  - [ ] Build correct KIE API request body
  
- [ ] Update `src/app/api/v1/generate-video/route.ts`:
  - [ ] Extract all parameters from frontend request
  - [ ] Calculate correct credit cost
  - [ ] Deduct credits before generation
  - [ ] Call updated KIE API service
  - [ ] Handle polling and callbacks
  
- [ ] Test with KIE API:
  - [ ] Text-to-Video (Sora 2)
  - [ ] Text-to-Video (Sora 2 Pro Standard)
  - [ ] Text-to-Video (Sora 2 Pro High)
  - [ ] Image-to-Video (all variations)

---

## 📊 **Parameter Transformation Table**

| Frontend Param | Frontend Type | Frontend Value | KIE Param | KIE Type | KIE Value |
|----------------|---------------|----------------|-----------|----------|-----------|
| model | string | 'sora-2-pro' | model | string | 'sora-2-pro-text-to-video' |
| aspect_ratio | string | '16:9' | input.aspect_ratio | string | 'landscape' |
| aspect_ratio | string | '9:16' | input.aspect_ratio | string | 'portrait' |
| duration | number | 10 | input.n_frames | string | "10" |
| duration | number | 15 | input.n_frames | string | "15" |
| quality | string | 'standard' | input.size | string | 'standard' |
| quality | string | 'high' | input.size | string | 'high' |
| prompt | string | "..." | input.prompt | string | "..." |
| image | string | base64 | input.image_urls | array | [URL] |
| N/A | N/A | N/A | input.remove_watermark | boolean | true |

---

## 💡 **Important Notes**

### 1. Watermark Removal
```
Frontend: Not exposed to users
Backend: Always set to true for paid users
KIE API: remove_watermark: true
```

### 2. Image Upload for I2V
```
Frontend sends: base64 data URL
Backend must:
  1. Decode base64
  2. Upload to public storage (R2)
  3. Get public URL
  4. Pass URL to KIE API

KIE requires: Publicly accessible URL, not base64
```

### 3. n_frames Format
```
⚠️ IMPORTANT: KIE API expects STRING, not number
Frontend: duration: 10
Backend: n_frames: "10"
```

### 4. Model Name Suffix
```
Must append mode to model name:
- T2V: '-text-to-video'
- I2V: '-image-to-video'
```

---

## 🎯 **Credit Calculation Verification**

### Frontend Calculation (Display)
```typescript
const getVideoCreditCost = () => {
  if (model === 'sora-2') {
    return creditsConfig.consumption.videoGeneration[`sora-2-720p-${duration}s`];
  } else {
    const resolution = quality === 'standard' ? '720p' : '1080p';
    return creditsConfig.consumption.videoGeneration[`sora-2-pro-${resolution}-${duration}s`];
  }
};
```

### Backend Calculation (Deduction)
```typescript
let creditKey: string;
if (model === 'sora-2') {
  creditKey = `sora-2-720p-${duration}s`;
} else {
  const resolution = quality === 'standard' ? '720p' : '1080p';
  creditKey = `sora-2-pro-${resolution}-${duration}s`;
}
const creditCost = creditsConfig.consumption.videoGeneration[creditKey];
```

**Status**: ✅ Frontend and backend calculations match

---

## 🚀 **Summary**

### Frontend Status
✅ **Complete** - All parameters implemented and sent to backend

### Backend Status
⚠️ **Needs Implementation** - Transform parameters for KIE API

### Key Transformations Needed
1. ⚠️ Model name: Add mode suffix
2. ⚠️ Aspect ratio: Convert to landscape/portrait
3. ⚠️ Duration: Convert number to string
4. ✅ Quality: Direct mapping (no change)
5. ⚠️ Image: Upload and convert base64 to URL

---

**Documentation Date**: November 2024
**Status**: Frontend ✅ Complete | Backend ⚠️ Requires Implementation
**API Reference**: KIE.ai Sora 2 Pro Documentation

