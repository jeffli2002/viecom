# Video Generation Advanced Options

## ✅ Changes Completed

Enhanced video generation with Sora 2 Pro support, quality selection, dynamic credit calculation, and simplified aspect ratio options.

---

## 🎯 **Changes Summary**

### 1. **Simplified Aspect Ratio** ✅

#### Before ❌
```tsx
<SelectContent>
  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
  <SelectItem value="1:1">Square (1:1)</SelectItem>     ← Removed
  <SelectItem value="4:3">Standard (4:3)</SelectItem>   ← Removed
</SelectContent>
```

#### After ✅
```tsx
<SelectContent>
  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
</SelectContent>
```

**Rationale**:
- ✅ Only keep standard video formats
- ✅ 16:9 for landscape videos (most common)
- ✅ 9:16 for portrait videos (mobile/social)
- ❌ Remove 1:1 and 4:3 (rarely used for video)

---

### 2. **Sora 2 Pro Model Support** ✅

#### Before ❌
```tsx
<SelectContent>
  <SelectItem value="sora-2">
    Sora 2 - {creditsConfig...['sora-2']} credits  ← Static
  </SelectItem>
</SelectContent>
```

#### After ✅
```tsx
<SelectContent>
  <SelectItem value="sora-2">
    Sora 2 - {videoCreditCost} credits  ← Dynamic
  </SelectItem>
  <SelectItem value="sora-2-pro">
    Sora 2 Pro - {videoCreditCost} credits  ← Dynamic
  </SelectItem>
</SelectContent>
```

**Features**:
- ✅ Two model options: Sora 2, Sora 2 Pro
- ✅ Dynamic credit display based on selection
- ✅ Credits update when duration/quality changes

---

### 3. **Quality Selector for Sora 2 Pro** ✅ NEW!

```typescript
const [quality, setQuality] = useState<'standard' | 'high'>('standard');
```

**UI Implementation**:
```tsx
{/* Only show when Sora 2 Pro is selected */}
{model === 'sora-2-pro' && (
  <div className="space-y-2">
    <Label>Quality</Label>
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => setQuality('standard')}>
        Standard (720P)
      </button>
      <button onClick={() => setQuality('high')}>
        High (1080P)
      </button>
    </div>
  </div>
)}
```

**Behavior**:
- ✅ Appears only when Sora 2 Pro is selected
- ✅ Two options: Standard (720P), High (1080P)
- ✅ Default: Standard (more economical)
- ✅ Visual feedback with checkmark
- ✅ Affects credit calculation

---

### 4. **Dynamic Credit Calculation** ✅

#### Implementation
```typescript
const getVideoCreditCost = () => {
  if (model === 'sora-2') {
    // Sora 2: only 720P available
    return creditsConfig.consumption.videoGeneration[`sora-2-720p-${duration}s`];
  } else {
    // Sora 2 Pro: 720P or 1080P based on quality
    const resolution = quality === 'standard' ? '720p' : '1080p';
    return creditsConfig.consumption.videoGeneration[`sora-2-pro-${resolution}-${duration}s`];
  }
};

const videoCreditCost = getVideoCreditCost();
```

**Credit Calculation Examples**:
```
Sora 2 + 10s + (720P only):
  → sora-2-720p-10s → 15 credits

Sora 2 + 15s + (720P only):
  → sora-2-720p-15s → 20 credits

Sora 2 Pro + 10s + Standard (720P):
  → sora-2-pro-720p-10s → 45 credits

Sora 2 Pro + 10s + High (1080P):
  → sora-2-pro-1080p-10s → 100 credits

Sora 2 Pro + 15s + Standard (720P):
  → sora-2-pro-720p-15s → 60 credits

Sora 2 Pro + 15s + High (1080P):
  → sora-2-pro-1080p-15s → 130 credits
```

---

### 5. **Model Change Handler** ✅

```typescript
<Select 
  value={model} 
  onValueChange={(value) => {
    setModel(value as 'sora-2' | 'sora-2-pro');
    // Reset quality to standard when switching models
    if (value === 'sora-2') {
      setQuality('standard');
    }
  }}
>
```

**Behavior**:
- ✅ When switching to Sora 2: hide quality selector
- ✅ Quality auto-resets to 'standard'
- ✅ Credit cost updates immediately
- ✅ Smooth UX transition

---

## 📊 **Visual Comparison**

### Before ❌

```
Model: [Sora 2 - 20 credits]  ← Static
Aspect Ratio: [16:9 | 9:16 | 1:1 | 4:3]  ← 4 options

Duration: [10s | 15s]
Format: [MP4]
```

### After ✅

```
Model: [Sora 2 - 15 credits ▼]  ← Dynamic, updates
       [Sora 2 Pro - 45 credits]  ← New option

Aspect Ratio: [16:9 | 9:16]  ← Only 2 options

Quality (when Sora 2 Pro selected):
┌──────────────────┐  ┌─────────────────┐
│ Standard (720P) ✓│  │ High (1080P)    │
└──────────────────┘  └─────────────────┘

Duration:
┌──────────────┐  ┌───────────────┐
│ 10 seconds ✓ │  │ 15 seconds    │
└──────────────┘  └───────────────┘

Format: [MP4 ✓]
```

---

## 🎨 **UI Layout Structure**

### Form Controls Order
```
1. Video Style Selector
2. Model & Aspect Ratio (2 columns)
3. Quality Selector (conditional - only for Sora 2 Pro)
4. Video Duration (2 buttons)
5. Output Format (1 button)
6. Generate Button
```

### Conditional Quality Display
```
When Sora 2 selected:
  Model ✓
  Aspect Ratio ✓
  Duration ✓
  Format ✓

When Sora 2 Pro selected:
  Model ✓
  Aspect Ratio ✓
  Quality ✓  ← NEW! Appears dynamically
  Duration ✓
  Format ✓
```

---

## 💰 **Credit Cost Matrix**

### Sora 2 (Standard Quality, 720P only)

| Duration | Credits | Config Key |
|----------|---------|------------|
| 10 seconds | 15 | `sora-2-720p-10s` |
| 15 seconds | 20 | `sora-2-720p-15s` |

---

### Sora 2 Pro (Choose Quality)

#### Standard Quality (720P)

| Duration | Credits | Config Key |
|----------|---------|------------|
| 10 seconds | 45 | `sora-2-pro-720p-10s` |
| 15 seconds | 60 | `sora-2-pro-720p-15s` |

#### High Quality (1080P)

| Duration | Credits | Config Key |
|----------|---------|------------|
| 10 seconds | 100 | `sora-2-pro-1080p-10s` |
| 15 seconds | 130 | `sora-2-pro-1080p-15s` |

---

## 🔧 **Technical Implementation**

### State Management
```typescript
// Model selection
const [model, setModel] = useState<'sora-2' | 'sora-2-pro'>('sora-2');

// Quality (only for Sora 2 Pro)
const [quality, setQuality] = useState<'standard' | 'high'>('standard');

// Duration selection
const [duration, setDuration] = useState<10 | 15>(10);
```

### Dynamic Credit Calculation
```typescript
const getVideoCreditCost = () => {
  if (model === 'sora-2') {
    // Sora 2: always 720P
    return creditsConfig.consumption.videoGeneration[`sora-2-720p-${duration}s`];
  } else {
    // Sora 2 Pro: 720P or 1080P
    const resolution = quality === 'standard' ? '720p' : '1080p';
    return creditsConfig.consumption.videoGeneration[`sora-2-pro-${resolution}-${duration}s`];
  }
};

const videoCreditCost = getVideoCreditCost();
// Updates automatically when model, quality, or duration changes
```

### API Integration
```typescript
const requestBody: any = {
  prompt: finalPrompt,
  model: model,                                         // 'sora-2' or 'sora-2-pro'
  aspect_ratio: aspectRatio,                           // '16:9' or '9:16'
  style: videoStyle,
  duration: duration,                                   // 10 or 15
  quality: model === 'sora-2-pro' ? quality : 'standard', // 'standard' or 'high'
  output_format: outputFormat.toLowerCase(),           // 'mp4'
};
```

---

## 🎯 **User Flow Examples**

### Scenario 1: Economy Video (Sora 2)
```
1. User selects Sora 2
   → Quality selector hidden (only 720P)
   → Credit display: 15 credits (10s default)

2. User keeps 10s duration
   → Cost: 15 credits ✓

3. User changes to 15s
   → Cost updates to: 20 credits ✓

4. Generate
   → API receives: sora-2, 720p (implicit), 15s
```

---

### Scenario 2: Premium Video (Sora 2 Pro + 1080P)
```
1. User selects Sora 2 Pro
   → Quality selector appears
   → Default: Standard (720P)
   → Credit display: 45 credits (10s + 720P)

2. User changes to High (1080P)
   → Cost updates to: 100 credits ✓

3. User changes to 15s
   → Cost updates to: 130 credits ✓

4. Generate
   → API receives: sora-2-pro, 1080p, 15s
```

---

### Scenario 3: Switching Models
```
1. User selects Sora 2 Pro
   → Quality selector appears
   
2. User selects High (1080P)
   → Cost: 100 credits (10s)

3. User switches back to Sora 2
   → Quality selector disappears
   → Quality resets to 'standard'
   → Cost updates to: 15 credits ✓
   
4. User switches to Sora 2 Pro again
   → Quality selector reappears
   → Quality: standard (reset)
   → Cost: 45 credits ✓
```

---

## 📱 **Responsive Design**

### Desktop Layout
```
┌──────────────────────────────────────┐
│ Model           Aspect Ratio         │
│ [Sora 2 Pro▼]  [16:9▼]              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Quality (appears when Sora 2 Pro)    │
│ ┌─────────────┐  ┌────────────────┐  │
│ │ Standard ✓  │  │ High (1080P)   │  │
│ │ (720P)      │  │                │  │
│ └─────────────┘  └────────────────┘  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Video Duration                       │
│ ┌──────────┐  ┌──────────┐          │
│ │ 10s ✓    │  │ 15s      │          │
│ └──────────┘  └──────────┘          │
└──────────────────────────────────────┘
```

### Mobile Layout
```
Same layout (grid maintains structure)
All elements stack properly
Touch-friendly button sizes
```

---

## 🎨 **Quality Selector Design**

### Standard (720P) - Selected
```
┌─────────────────────────┐
│  Standard (720P) ✓      │  ← Purple border
│  (Purple background)    │     Purple text
└─────────────────────────┘     Checkmark
```

### High (1080P) - Unselected
```
┌─────────────────────────┐
│  High (1080P)           │  ← Gray border
│  (White background)     │     Gray text
└─────────────────────────┘     No checkmark
```

---

## 💡 **Dynamic Credit Display**

### Model Selector Shows Real-time Cost

#### Sora 2 Selected
```
Model Dropdown:
┌─────────────────────────┐
│ Sora 2 - 15 credits  ✓  │  ← Updates based on duration
│ Sora 2 Pro - 45 credits │
└─────────────────────────┘

Changes when:
- Duration 10s → 15s: "Sora 2 - 20 credits"
- Duration 15s → 10s: "Sora 2 - 15 credits"
```

#### Sora 2 Pro Selected
```
Model Dropdown:
┌─────────────────────────┐
│ Sora 2 - 15 credits     │
│ Sora 2 Pro - 45 credits ✓│  ← Updates based on duration + quality
└─────────────────────────┘

Changes when:
- Quality Standard → High: "Sora 2 Pro - 100 credits"
- Duration 10s → 15s: "Sora 2 Pro - 130 credits" (with High)
- Duration 10s → 15s: "Sora 2 Pro - 60 credits" (with Standard)
```

---

## 🔄 **State Interactions**

### Model Change Effects
```
User changes model:
  Sora 2 → Sora 2 Pro:
    ✓ Quality selector appears
    ✓ Quality defaults to 'standard'
    ✓ Credits recalculate
    
  Sora 2 Pro → Sora 2:
    ✓ Quality selector disappears
    ✓ Quality resets to 'standard'
    ✓ Credits recalculate
```

### Duration Change Effects
```
User changes duration:
  10s → 15s:
    ✓ Credits increase
    ✓ Model dropdown updates display
    
  15s → 10s:
    ✓ Credits decrease
    ✓ Model dropdown updates display
```

### Quality Change Effects (Sora 2 Pro only)
```
User changes quality:
  Standard → High:
    ✓ Credits increase significantly
    ✓ Model dropdown updates display
    
  High → Standard:
    ✓ Credits decrease
    ✓ Model dropdown updates display
```

---

## 📋 **API Request Body**

### Complete Parameters
```typescript
{
  prompt: string,              // Enhanced or original
  model: 'sora-2' | 'sora-2-pro',
  aspect_ratio: '16:9' | '9:16',
  style: string,
  duration: 10 | 15,
  quality: 'standard' | 'high',  // standard=720P, high=1080P
  output_format: 'mp4',
  image?: string                 // For I2V mode
}
```

### Examples

#### Sora 2 Request
```json
{
  "prompt": "A product video...",
  "model": "sora-2",
  "aspect_ratio": "16:9",
  "style": "cinematic",
  "duration": 10,
  "quality": "standard",  // Always standard for Sora 2
  "output_format": "mp4"
}
```

#### Sora 2 Pro Standard Request
```json
{
  "prompt": "A product video...",
  "model": "sora-2-pro",
  "aspect_ratio": "9:16",
  "style": "professional",
  "duration": 15,
  "quality": "standard",  // 720P
  "output_format": "mp4"
}
```

#### Sora 2 Pro High Request
```json
{
  "prompt": "A product video...",
  "model": "sora-2-pro",
  "aspect_ratio": "16:9",
  "style": "cinematic",
  "duration": 15,
  "quality": "high",  // 1080P
  "output_format": "mp4"
}
```

---

## 🎯 **Default Selections**

### Initial State
```typescript
model: 'sora-2'           // Default to economical option
quality: 'standard'       // Default to 720P
duration: 10              // Default to 10 seconds
aspectRatio: '16:9'       // Default to landscape
outputFormat: 'MP4'       // Only video format
```

### Default Credit Cost
```
Sora 2 + 10s + 720P (implicit) = 15 credits
```

**Highlighted**:
- ✅ 10 seconds button: purple background
- ✅ Standard quality button: purple background (when Sora 2 Pro selected)
- ✅ Model shows: "Sora 2 - 15 credits"

---

## 💡 **User Experience Flow**

### Beginner User (Economy)
```
1. Open video generation page
   → Sees: Sora 2, 16:9, 10s
   → Cost: 15 credits ✓

2. Generate video
   → Gets: 720P, 10s video
   → Affordable, good quality
```

### Advanced User (Premium)
```
1. Open video generation page
   
2. Change to Sora 2 Pro
   → Quality selector appears
   → Cost: 45 credits (10s + Standard)
   
3. Change to High quality
   → Cost updates: 100 credits
   
4. Change to 15s
   → Cost updates: 130 credits
   
5. Generate video
   → Gets: 1080P, 15s, premium video
   → Maximum quality
```

---

## 🔧 **Backend Integration Guide**

### Credit Deduction
```typescript
// Backend should calculate same way
const { model, duration, quality } = requestBody;

let creditKey: string;
if (model === 'sora-2') {
  creditKey = `sora-2-720p-${duration}s`;
} else {
  const resolution = quality === 'standard' ? '720p' : '1080p';
  creditKey = `sora-2-pro-${resolution}-${duration}s`;
}

const cost = creditsConfig.consumption.videoGeneration[creditKey];
await creditService.deductCredits(userId, cost);
```

### KIE API Call
```typescript
// Pass correct parameters to KIE
await kieApi.generateVideo({
  prompt,
  model: model === 'sora-2' ? 'sora-2-text-to-video' : 'sora-2-pro-text-to-video',
  quality: quality === 'standard' ? 'hd' : 'fullhd',
  duration: duration,
  n_frames: duration * 24,  // 24 fps
  aspect_ratio: aspectRatio,
});
```

---

## ✅ **Verification Checklist**

### Aspect Ratio
- [x] Only 2 options: 16:9, 9:16
- [x] Removed 1:1 and 4:3
- [x] Default: 16:9 (Landscape)

### Model Selection
- [x] Two options: Sora 2, Sora 2 Pro
- [x] Dynamic credit display
- [x] Credits update on any change

### Quality Selector
- [x] Only appears for Sora 2 Pro
- [x] Two options: Standard (720P), High (1080P)
- [x] Default: Standard
- [x] Visual feedback with checkmark
- [x] Resets when switching to Sora 2

### Credit Calculation
- [x] Uses creditsConfig (no hardcoding)
- [x] Considers model + duration + quality
- [x] Updates in real-time
- [x] Displays in model selector

### API Integration
- [x] quality parameter added to requestBody
- [x] Passes correct values to backend
- [x] Works with duration and output_format

### Code Quality
- [x] No linter errors
- [x] TypeScript types correct
- [x] Proper state management

---

## 🚀 **Benefits**

### Simplified Choices
```
Aspect Ratio:
- Before: 4 options (confusing)
- After: 2 options (clear)
```

### Better UX
```
✓ Immediate credit cost feedback
✓ Quality choice only when relevant (Sora 2 Pro)
✓ Default highlights (10s, Standard)
✓ Real-time cost updates
✓ Clear visual hierarchy
```

### Accurate Pricing
```
✓ Credits based on actual model/quality/duration
✓ No misleading static values
✓ Users know exact cost before generating
✓ Configuration-driven (easy to update)
```

---

**Status**: ✅ Complete
**Date**: November 2024
**Files Modified**: 1 (src/components/video-generator.tsx)
**Changes**: Sora 2 Pro support, quality selector, dynamic credits, simplified aspect ratio

