# API Parameter Integration

## ✅ Changes Completed

Ensured output format and video duration are passed to generation APIs.

---

## 🎯 **Changes Summary**

### 1. **Image Generation API - Output Format** ✅

#### Request Body Update
```typescript
const requestBody: any = {
  prompt: finalPrompt,
  model: model,
  aspect_ratio: aspectRatio,
  style: imageStyle,
  output_format: outputFormat.toLowerCase(), // ✅ NEW: 'png' or 'jpeg'
};
```

**Details**:
- ✅ Passes user-selected output format to API
- ✅ Converts to lowercase ('PNG' → 'png', 'JPEG' → 'jpeg')
- ✅ API can use this to generate correct format
- ✅ State: `useState<'PNG' | 'JPEG'>('PNG')`

---

### 2. **Video Generation API - Duration & Format** ✅

#### Request Body Update
```typescript
const requestBody: any = {
  prompt: finalPrompt,
  model: model,
  aspect_ratio: aspectRatio,
  style: videoStyle,
  duration: duration,                        // ✅ NEW: 10 or 15 (seconds)
  output_format: outputFormat.toLowerCase(), // ✅ NEW: 'mp4'
};
```

**Details**:
- ✅ Passes user-selected duration to API (10 or 15 seconds)
- ✅ Passes output format (currently 'mp4')
- ✅ API can use duration for correct video length
- ✅ State: `useState<10 | 15>(10)`
- ✅ State: `useState<'MP4'>('MP4')`

---

## 📊 **Complete Request Bodies**

### Image Generation API

```typescript
// Text-to-Image Mode
POST /api/v1/generate-image
{
  "prompt": "enhanced prompt text...",
  "model": "nano-banana",
  "aspect_ratio": "1:1",
  "style": "studio-shot",
  "output_format": "png"  // ← User selected format
}

// Image-to-Image Mode
POST /api/v1/generate-image
{
  "prompt": "transformation prompt...",
  "model": "nano-banana",
  "aspect_ratio": "16:9",
  "style": "watercolor",
  "output_format": "jpeg",  // ← User selected format
  "image": "data:image/png;base64,..."  // Source image
}
```

---

### Video Generation API

```typescript
// Text-to-Video Mode
POST /api/v1/generate-video
{
  "prompt": "video description...",
  "model": "sora-2",
  "aspect_ratio": "16:9",
  "style": "spoken-script",
  "duration": 10,            // ← User selected duration (10 or 15)
  "output_format": "mp4"     // ← Output format
}

// Image-to-Video Mode
POST /api/v1/generate-video
{
  "prompt": "video transformation...",
  "model": "sora-2",
  "aspect_ratio": "9:16",
  "style": "cinematic",
  "duration": 15,            // ← User selected duration
  "output_format": "mp4",    // ← Output format
  "image": "data:image/png;base64,..."  // Source image
}
```

---

## 🔧 **Implementation Details**

### Image Generator

#### State Management
```typescript
const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPEG'>('PNG');
```

#### API Call
```typescript
const requestBody: any = {
  // ... other params
  output_format: outputFormat.toLowerCase(), // 'PNG' → 'png'
};

await fetch('/api/v1/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
});
```

---

### Video Generator

#### State Management
```typescript
const [duration, setDuration] = useState<10 | 15>(10);
const [outputFormat, setOutputFormat] = useState<'MP4'>('MP4');
```

#### API Call
```typescript
const requestBody: any = {
  // ... other params
  duration: duration,                        // 10 or 15
  output_format: outputFormat.toLowerCase(), // 'MP4' → 'mp4'
};

await fetch('/api/v1/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
});
```

---

## 📋 **Parameter Summary**

### Image Generation Parameters

| Parameter | Type | Values | Required | Description |
|-----------|------|--------|----------|-------------|
| `prompt` | string | any | ✅ Yes | Generation prompt |
| `model` | string | 'nano-banana' | ✅ Yes | AI model |
| `aspect_ratio` | string | '1:1', '16:9', etc. | ✅ Yes | Image dimensions |
| `style` | string | style ID | ✅ Yes | Visual style |
| `output_format` | string | 'png', 'jpeg' | ✅ Yes | Output format |
| `image` | string | base64 data | ⚪ Optional | For I2I mode |

---

### Video Generation Parameters

| Parameter | Type | Values | Required | Description |
|-----------|------|--------|----------|-------------|
| `prompt` | string | any | ✅ Yes | Generation prompt |
| `model` | string | 'sora-2' | ✅ Yes | AI model |
| `aspect_ratio` | string | '16:9', '9:16', etc. | ✅ Yes | Video dimensions |
| `style` | string | style ID | ✅ Yes | Video style |
| `duration` | number | 10, 15 | ✅ Yes | Video length (seconds) |
| `output_format` | string | 'mp4' | ✅ Yes | Output format |
| `image` | string | base64 data | ⚪ Optional | For I2V mode |

---

## 🎯 **Backend Integration Points**

### Image API Endpoint

```typescript
// src/app/api/v1/generate-image/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const {
    prompt,
    model,
    aspect_ratio,
    style,
    output_format,  // ← NEW: Use this for output
    image,          // Optional for I2I
  } = body;
  
  // Use output_format when calling KIE API or saving file
  const kieResponse = await kieApi.generateImage({
    prompt,
    model,
    aspectRatio: aspect_ratio,
    style,
    format: output_format,  // Pass to KIE
  });
  
  // ...
}
```

---

### Video API Endpoint

```typescript
// src/app/api/v1/generate-video/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const {
    prompt,
    model,
    aspect_ratio,
    style,
    duration,       // ← NEW: Use for video length
    output_format,  // ← NEW: Use for output
    image,          // Optional for I2V
  } = body;
  
  // Use duration for credit calculation
  const creditKey = `sora-2-720p-${duration}s`;
  const creditCost = creditsConfig.consumption.videoGeneration[creditKey];
  
  // Use duration and format when calling KIE API
  const kieResponse = await kieApi.generateVideo({
    prompt,
    model,
    aspectRatio: aspect_ratio,
    style,
    duration: duration,     // Pass to KIE
    format: output_format,  // Pass to KIE
  });
  
  // ...
}
```

---

## 💡 **Use Cases**

### Image Format Selection
```
User wants PNG (lossless):
  UI: Select "PNG"
  API: output_format = "png"
  Result: PNG file generated

User wants JPEG (smaller size):
  UI: Select "JPEG"
  API: output_format = "jpeg"
  Result: JPEG file generated
```

### Video Duration Selection
```
User wants shorter video (economical):
  UI: Select "10 seconds"
  API: duration = 10
  Credit Cost: 15 credits (Sora 2)
  Result: 10-second video

User wants longer video (more content):
  UI: Select "15 seconds"
  API: duration = 15
  Credit Cost: 20 credits (Sora 2)
  Result: 15-second video
```

---

## 🔄 **Data Flow**

### Image Generation Flow

```
User Interface
  ↓
[Select Output Format]
  ↓
outputFormat state ('PNG' or 'JPEG')
  ↓
handleGenerate()
  ↓
requestBody { output_format: 'png' }
  ↓
POST /api/v1/generate-image
  ↓
Backend processes format
  ↓
KIE API generates in correct format
  ↓
Image returned to frontend
```

---

### Video Generation Flow

```
User Interface
  ↓
[Select Duration: 10s or 15s]
  ↓
duration state (10 or 15)
  ↓
handleGenerate()
  ↓
requestBody { 
  duration: 10,
  output_format: 'mp4'
}
  ↓
POST /api/v1/generate-video
  ↓
Backend calculates credits based on duration
Backend passes duration to KIE
  ↓
KIE API generates video of correct length
  ↓
Video returned to frontend
```

---

## ✅ **Verification**

### Image Generation
- [x] `output_format` added to requestBody
- [x] Converts 'PNG'/'JPEG' to lowercase
- [x] Passed in both T2I and I2I modes
- [x] State properly managed
- [x] No linter errors

### Video Generation
- [x] `duration` added to requestBody
- [x] `output_format` added to requestBody
- [x] Duration is 10 or 15 (number type)
- [x] Format converts 'MP4' to lowercase
- [x] Passed in both T2V and I2V modes
- [x] State properly managed
- [x] No linter errors

---

## 📊 **Credit Cost by Duration**

### Sora 2 (720P)
```typescript
duration = 10 → 15 credits
duration = 15 → 20 credits
```

### Sora 2 Pro (720P)
```typescript
duration = 10 → 45 credits
duration = 15 → 60 credits
```

### Sora 2 Pro (1080P)
```typescript
duration = 10 → 100 credits
duration = 15 → 130 credits
```

**Backend should use**:
```typescript
const creditKey = `${model}-720p-${duration}s`;
const cost = creditsConfig.consumption.videoGeneration[creditKey];
```

---

## 🚀 **Next Steps for Backend**

### 1. Update Image API
```typescript
// Handle output_format parameter
const { output_format } = requestBody;

// Pass to KIE or image processing
if (output_format === 'jpeg') {
  // Generate JPEG
} else {
  // Generate PNG (default)
}
```

### 2. Update Video API
```typescript
// Handle duration parameter
const { duration, output_format } = requestBody;

// Calculate credits based on duration
const creditKey = `${model}-720p-${duration}s`;
const creditCost = creditsConfig.consumption.videoGeneration[creditKey];

// Pass duration to KIE
await kieApi.generateVideo({
  // ... other params
  duration: duration,
  nFrames: duration === 10 ? 240 : 360,  // 24 fps
});
```

### 3. Validate Parameters
```typescript
// Image API validation
if (!['png', 'jpeg'].includes(output_format)) {
  return NextResponse.json(
    { error: 'Invalid output format' },
    { status: 400 }
  );
}

// Video API validation
if (![10, 15].includes(duration)) {
  return NextResponse.json(
    { error: 'Invalid duration' },
    { status: 400 }
  );
}
```

---

## 💡 **Benefits**

### User Control
```
✅ Users choose image format (quality vs size)
✅ Users choose video length (cost vs content)
✅ Clear feedback in UI
✅ Transparent pricing
```

### Backend Flexibility
```
✅ APIs receive all necessary parameters
✅ Can calculate correct credit costs
✅ Can call KIE with proper settings
✅ Can validate user choices
```

### System Integration
```
✅ Frontend and backend aligned
✅ All user choices captured
✅ Ready for API implementation
✅ Type-safe parameters
```

---

**Status**: ✅ Complete
**Date**: November 2024
**Files Modified**: 2
- `src/components/image-generator.tsx`: Added output_format to API call
- `src/components/video-generator.tsx`: Added duration and output_format to API call
**Changes**: Ensured UI selections are passed to generation APIs

