# Product Requirements Document: E-commerce AI Image and Video Generator

| Field | Value |
| :--- | :--- |
| **Product Name** | E-commerce AI Content Studio |
| **Version** | 1.0 |
| **Date** | November 7, 2025 |
| **Author** | Manus AI |
| **Status** | In Development |

---

## 1. Introduction

### 1.1. Goal

The primary goal of the E-commerce AI Content Studio is to provide a simple, elegant, and highly efficient tool for e-commerce businesses to generate high-quality, on-brand product images and videos at scale. The tool will leverage advanced AI models to transform product data and base images into diverse, engaging marketing assets, significantly reducing the time and cost associated with traditional content creation.

### 1.2. Target Audience

Small to Medium-sized E-commerce Businesses (SMBs), E-commerce Marketing Teams, and Independent Online Sellers who require a high volume of visual content for product listings, social media, and advertising campaigns.

### 1.3. Success Metrics

*   **User Adoption:** 500 registered users within the first 3 months.
*   **Batch Generation Rate:** 80% of generated content is created via the batch processing feature.
*   **Content Quality:** Average user rating of 4.5/5 stars for generated content.
*   **Brand Consistency:** 70% of users opt-in for the optional Brand Tone Analysis feature.

---

## 2. Implementation Status Summary

### ✅ Completed Features

#### 2.1. User Authentication System
- ✅ Email/Password registration and login
- ✅ Google OAuth authentication
- ✅ Session management (Better Auth)
- ✅ Password reset via email (Resend)
- ✅ Client-side auth state management (Zustand)

**Implementation Files:**
- `src/lib/auth/auth.ts` - Better Auth configuration
- `src/lib/auth/auth-client.ts` - Client-side auth instance
- `src/store/auth-store.ts` - Zustand auth store
- `src/app/api/auth/[...all]/route.ts` - Auth API routes
- `src/components/blocks/login/login-form.tsx` - Login form
- `src/components/blocks/signup/signup-form.tsx` - Signup form

#### 2.2. Credit System
- ✅ Credit account management (auto-creation on signup)
- ✅ Signup bonus (30 credits for free plan)
- ✅ Credit transactions (earn, spend, refund, freeze, unfreeze)
- ✅ Transaction history with idempotency
- ✅ Credit balance checking
- ✅ Admin credit adjustments

**Implementation Files:**
- `src/lib/credits/credit-service.ts` - Credit service
- `src/config/credits.config.ts` - Credit consumption rules
- `src/app/api/credits/initialize/route.ts` - Initialize credit account
- `src/app/api/credits/balance/route.ts` - Get balance
- `src/app/api/credits/history/route.ts` - Transaction history

**Database Tables:**
- `userCredits` - User credit accounts
- `creditTransactions` - Transaction records

#### 2.3. Subscription Plan System
- ✅ Creem payment integration
- ✅ Subscription creation, upgrade, downgrade, cancel, reactivate
- ✅ Automatic credit allocation on subscription creation/renewal
- ✅ Webhook handling for payment events
- ✅ Customer portal link generation
- ✅ Plan change credit adjustments

**Implementation Files:**
- `src/payment/creem/client.ts` - Creem client configuration
- `src/payment/creem/provider.ts` - Creem provider implementation
- `src/lib/creem/creem-service.ts` - Creem service
- `src/lib/creem/subscription-utils.ts` - Subscription utilities
- `src/lib/creem/plan-utils.ts` - Plan resolution utilities
- `src/server/db/repositories/payment-repository.ts` - Payment repository
- `src/app/api/creem/**/*` - Creem API routes
- `src/app/api/webhooks/creem/route.ts` - Webhook handler

**Subscription Plans:**
- **Free**: 30 credits signup bonus, 3 image extractions/day (10/month)
- **Pro ($14.9/month)**: 500 credits/month, 300 extractions/month
- **Pro+ ($24.9/month)**: 900 credits/month, 600 extractions/month

#### 2.4. Quota Management System
- ✅ Multi-dimensional quota tracking (API calls, storage, image/video generation, image extraction)
- ✅ Daily and monthly quota tracking
- ✅ Quota initialization for new users
- ✅ Quota reset functionality

**Implementation Files:**
- `src/lib/quota/quota-service.ts` - Quota service
- `src/server/db/schema.ts` - `userQuotaUsage` table

#### 2.5. Enhanced Image Generation Module
- ✅ Text-to-Image (T2I) generation
- ✅ Image-to-Image (I2I) generation
- ✅ **Brand Tone Analysis** - Company website URL analysis using DeepSeek AI
  - Brand personality keywords
  - Product features
  - Target audience
  - Color palette
  - Style keywords
- ✅ **Product Selling Points Input** - Optional input field for product selling points
- ✅ **Enhanced Prompt Enhancement** - AI-powered prompt optimization (DeepSeek AI)
  - Integrates brand tone context
  - Integrates product selling points
  - Optimizes artistic direction, lighting, composition
- ✅ Multiple model support (Nano Banana, Flux Pro, Flux Ultra)
- ✅ Multiple aspect ratios (1:1, 16:9, 9:16, 4:3, 3:2)
- ✅ Image preview, download, and share

**Implementation Files:**
- `src/components/image-generator.tsx` - Enhanced image generator component
- `src/lib/brand/brand-tone-analyzer.ts` - Brand analysis service
- `src/app/api/v1/analyze-brand-tone/route.ts` - Brand analysis API
- `src/app/api/v1/enhance-prompt/route.ts` - Enhanced prompt API
- `src/app/api/v1/generate-image/route.ts` - Image generation API

#### 2.6. Upgrade Prompt System
- ✅ Insufficient credits prompt
- ✅ Quota exceeded prompt
- ✅ Smart plan recommendations
- ✅ Plan comparison display

**Implementation Files:**
- `src/components/auth/UpgradePrompt.tsx` - Upgrade prompt component
- `src/hooks/use-upgrade-prompt.ts` - Upgrade prompt hook
- `src/server/actions/payment/get-billing-info.ts` - Billing info action

### 🚧 Pending Features

#### 2.7. Batch Generation (Excel/CSV Upload)
- ⏳ Excel/CSV upload and parsing
- ⏳ Row-by-row processing
- ⏳ Error handling and reporting
- ⏳ Batch job status tracking
- ⏳ ZIP download of generated assets

#### 2.8. Video Generation
- ⏳ Text-to-Video (T2V) generation
- ⏳ Image-to-Video (I2V) generation
- ⏳ Multiple video styles (9 styles as per PRD)
- ⏳ Script generation
- ⏳ Text-to-Speech (TTS) integration

#### 2.9. UI/UX Features
- ⏳ Homepage showcase gallery
- ⏳ Asset library/history page
- ⏳ Dashboard with credit/subscription view
- ⏳ Real-time batch job status updates

---

## 3. Product Features and Requirements

### 3.1. User Interface (UI) and Experience (UX)

**Requirement:** The home page and overall interface must be **simple, elegant, and specifically designed for e-commerce workflows**.

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UI-01** | Homepage Design Specification | The homepage design must be based on the following Figma community file: [AI Consulting & Email Marketing Landing Page](https://www.figma.com/community/file/1383394892639840258). The layout and aesthetic should be adapted for the e-commerce AI generation tool's specific features. | High | ⏳ Pending |
| **UI-02** | Intuitive Workflow | A clear, step-by-step process for batch generation: 1. Upload Data, 2. Select Styles, 3. Review & Generate. | High | ⏳ Pending |
| **UI-03** | Real-time Status Updates | A dedicated section to track the progress of ongoing batch generation jobs, including success/failure counts. | Medium | ⏳ Pending |
| **UI-04** | Homepage Showcase Gallery | A dedicated segment on the homepage to display a curated selection of sample images and videos, sourced directly from the online storage. | High | ⏳ Pending |
| **UI-05** | Generation History/Asset Library | A dedicated page for users to view all their generated assets. | High | ⏳ Pending |
| **UI-06** | Dashboard Credit/Subscription View | The user's main dashboard must clearly display their current **Credit Balance**, **Subscription Plan**, and a link to their **Usage History**. | High | ⏳ Pending |

### 3.2. Core Functionality: Generation Modes

**Requirement:** Users must be able to generate multiple images or videos by uploading a single data file.

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CG-01** | Excel/CSV Upload (Batch Mode) | Support for uploading a spreadsheet (Excel or CSV) where **each row represents a single generation request** (one product/asset). | High | ⏳ Pending |
| **CG-01.1** | Single-Asset Generation | Dedicated UI for generating a single image or video, separate from the batch upload workflow. | High | ✅ **Implemented** |
| **CG-01.2** | Image Generation Modes | Must support: **Text-to-Image (T2I)** and **Image-to-Image (I2I)**. | High | ✅ **Implemented** |
| **CG-01.3** | Video Generation Modes | Must support: **Text-to-Video (T2V)** and **Image-to-Video (I2V)**. | High | ⏳ Pending |
| **CG-01.4** | Feature Consistency | All single-asset generation modes must support **Prompt Enhancement (2.5)** and **Style Selection (2.3/2.4)**. | High | ✅ **Implemented** |
| **CG-02** | API-Driven Generation (Batch) | The system must process the spreadsheet row-by-row, calling the underlying AI generation API for each entry sequentially. | High | ⏳ Pending |
| **CG-03** | Product Information Mapping (Batch) | The system must allow users to map spreadsheet columns to required generation inputs (e.g., Product Name, Description, Base Image URL, Desired Style ID). | High | ⏳ Pending |
| **CG-04** | Error Handling and Reporting (Batch) | If a generation fails (e.g., invalid input, API error), the system must log the error and continue with the next row, providing a detailed error report upon job completion. | High | ⏳ Pending |
| **CG-05** | Download Generated Assets (Batch) | Upon completion, users must be able to download all generated assets in a single, organized ZIP file. | High | ⏳ Pending |

### 3.3. Image Generation Specifics

**Requirement:** Provide diverse, high-quality image generation with a focus on e-commerce display needs.

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **IMG-01** | Multiple Style Choices | Offer a curated list of image styles (e.g., Studio Shot, Lifestyle/Contextual, Minimalist, Seasonal Theme, Infographic Overlay). | High | ⏳ Pending |
| **IMG-02** | Product Background Replacement | Ability to remove the original background and place the product onto an AI-generated scene based on the selected style. | High | ⏳ Pending |
| **IMG-03** | Output Resolution | Generated images must meet common e-commerce platform standards (e.g., minimum 1080x1080 pixels, 300 DPI). | High | ✅ **Implemented** |
| **IMG-04** | Style Customization | Allow users to provide additional text prompts to fine-tune the selected style (e.g., "Lifestyle shot, but with a beach setting"). | Medium | ✅ **Implemented** (via prompt input) |
| **IMG-05** | Prompt Enhancement Integration | The Prompt Enhancement feature (see 2.5) must be available for all image generation prompts. | High | ✅ **Implemented** |

### 3.4. Video Generation Specifics

**Requirement:** Provide various video formats suitable for e-commerce marketing channels (e.g., product pages, social media).

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **VID-01** | Multiple Video Style Choices | Offer distinct video formats/styles for e-commerce, including: | High | ⏳ Pending |
| | - **口播文案型 (Spoken Script/Voiceover Type):** Focus on a voiceover reading a product script with dynamic text and product shots. | | | |
| | - **产品对比型 (Product Comparison Type):** Side-by-side comparison of the product with a competitor or a "before/after" scenario. | | | |
| | - **剧情/搞笑型 (Narrative/Comedy Type):** Short, engaging skits or stories that feature the product. | | | |
| | - **360° Showcase:** Simple, clean rotation of the product. | | | |
| | - **品牌广告大片型 (Brand Blockbuster Ad):** High-production value, cinematic style focusing on brand values and emotional connection. | High | ⏳ Pending |
| | - **开箱/测评型 (Unboxing/Review):** Simulates a user unboxing or reviewing the product, ideal for social proof. | High | ⏳ Pending |
| | - **使用教程型 (How-To/Tutorial):** Step-by-step guide on how to use the product or its key features. | High | ⏳ Pending |
| | - **限时促销型 (Limited-Time Offer/Sale):** Fast-paced, attention-grabbing video with clear call-to-action and urgency. | High | ⏳ Pending |
| | - **场景植入型 (Scene Integration/Contextual):** Product seamlessly integrated into a specific, aspirational lifestyle scene (e.g., product used on a mountain hike). | High | ⏳ Pending |
| **VID-01.1** | Prompt Enhancement Integration | The Prompt Enhancement feature (see 2.5) must be available for all video generation prompts and script inputs. | High | ⏳ Pending |
| **VID-02** | Script Generation | AI-powered script generation based on product information (name, description, key features) for Spoken Script/Narrative styles. | High | ⏳ Pending |
| **VID-03** | Text-to-Speech (TTS) | Integration of high-quality TTS for voiceovers in the Spoken Script style. | High | ⏳ Pending |
| **VID-04** | Output Format and Length | Generated videos must be in common formats (MP4) and optimized for social media (e.g., 9:16 vertical, 1:1 square) with a maximum length of 30 seconds. | High | ⏳ Pending |

### 3.5. Cross-Functional Feature: Prompt Enhancement

**Requirement:** Provide an AI-powered tool to refine and expand user-provided text prompts for better generation results.

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PF-01** | Enhancement Button | A clearly visible "Enhance Prompt" button next to all primary text input fields for image and video generation. | High | ✅ **Implemented** |
| **PF-02** | AI-Powered Refinement | The system will use an LLM to analyze the user's short/simple prompt and expand it into a detailed, technical prompt optimized for the underlying AI generation model (e.g., adding details about lighting, camera angle, texture, and style modifiers). | High | ✅ **Implemented** (DeepSeek AI) |
| **PF-03** | Brand Tone Integration | The enhancement process must incorporate the user's **Brand Tone Profile** (if available) to ensure the enhanced prompt aligns with the company's established style. | High | ✅ **Implemented** |
| **PF-04** | User Review and Edit | The enhanced prompt must be displayed to the user for review and final editing before the generation process begins. | High | ✅ **Implemented** |

**Implementation Details:**
- Uses DeepSeek AI for prompt enhancement
- Integrates brand tone analysis results (brandTone, styleKeywords, colorPalette)
- Integrates product selling points
- Supports multiple generation contexts (image, video)

### 3.6. Optional Feature: Brand Tone Analysis

**Requirement:** Provide an optional, guided process during user registration to analyze the user's brand for improved content generation.

| ID | Feature | Description | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **OPT-01** | Guided Onboarding Prompt | During registration, a prompt will ask the user for their company's website URL. | High | ✅ **Implemented** (in image generator) |
| **OPT-02** | Website Content Analysis | The system will analyze the website's text content (e.g., "About Us," product descriptions, mission statement) to **extract key brand attributes** (e.g., "Luxury," "Sustainable," "Playful," "Technical"). | High | ✅ **Implemented** (DeepSeek AI) |
| **OPT-03** | Brand Tone Profile Creation | The extracted attributes will be saved as a "Brand Tone Profile" linked to the user's account. | High | ⏳ Pending (analysis works, profile saving pending) |
| **OPT-04** | Tone Integration | The Brand Tone Profile will be used as an **additional, hidden input** to the AI generation models to influence the style, color palette, and overall mood of the generated images and videos. | High | ✅ **Implemented** (integrated into prompt enhancement) |
| **OPT-05** | User Review and Edit | Users must be able to review and manually edit the generated Brand Tone Profile. | Medium | ✅ **Implemented** (can review and toggle usage) |

**Implementation Details:**
- Website URL input in image generator (optional)
- DeepSeek AI analyzes website content
- Extracts: brandTone, productFeatures, targetAudience, colorPalette, styleKeywords
- Analysis results integrated into prompt enhancement
- User can toggle brand context usage

---

## 4. Technical Requirements

| ID | Requirement | Description | Status |
| :--- | :--- | :--- | :--- |
| **TECH-01** | API Integration | Must integrate with the **kie.ai API**. The default image generation model is **nano banana**, and the default video generation model is **sora 2**. | ✅ **Implemented** (image), ⏳ Pending (video) |
| **TECH-02** | Scalable Queue System | A robust queueing system (e.g., Redis, RabbitMQ) is required to manage the high volume of sequential API calls from batch processing. | ⏳ Pending |
| **TECH-03** | Data Security | All uploaded product data and generated assets must be stored securely and encrypted at rest. | ✅ **Implemented** (R2 storage) |
| **TECH-04** | File Storage | Utilize **Cloudflare R2** as the default scalable cloud storage solution for storing base images, uploaded spreadsheets, and final generated assets. All generated assets must be stored online. | ✅ **Implemented** |
| **TECH-05** | Web Crawler/Scraper | A secure, rate-limited web crawler is needed for the optional Brand Tone Analysis feature (OPT-02). | ✅ **Implemented** (basic web scraper) |
| **TECH-06** | Asset Retention Policy | Implement a configurable asset retention policy: **7 days** for free users and **90 days** for paid/subscribed users. The system must automatically delete assets after the retention period expires. | ⏳ Pending |
| **TECH-07** | Authentication System | Use **Better Auth** as the default authentication provider, supporting **Google OAuth** and **Email/Password** verification login. | ✅ **Implemented** |
| **TECH-08** | Credit-Based Usage System | Implement a credit system for usage tracking. Users purchase credits via subscription. Different generation types (e.g., T2I, I2V, video style) must consume a configurable amount of credits. | ✅ **Implemented** |
| **TECH-09** | Credit Consumption Configuration | A configuration file or database table must store the credit consumption rate for all generation types (e.g., Image T2I = 1 credit, Video I2V = 5 credits). This must be easily adjustable by an administrator. | ✅ **Implemented** (`src/config/credits.config.ts`) |

---

## 5. Key Implementation Details

### 5.1. Database Schema

**User & Authentication:**
- `user` - User information
- `session` - Session management
- `account` - OAuth accounts
- `verification` - Email verification

**Credit System:**
- `userCredits` - Credit accounts (balance, totalEarned, totalSpent, frozenBalance)
- `creditTransactions` - Transaction records (type, amount, source, referenceId for idempotency)

**Payment & Subscription:**
- `payment` - Payment records (subscriptions, one-time payments)
- `paymentEvent` - Payment event logs (Stripe/Creem events)

**Quota Management:**
- `userQuotaUsage` - Quota usage tracking (service type, period, usedAmount)

**Content Generation:**
- `batchGenerationJob` - Batch generation jobs
- `generatedAsset` - Generated assets (images/videos)
- `brandToneProfile` - Brand tone profiles
- `styleConfiguration` - Style configurations

### 5.2. API Endpoints

**Authentication:**
- `POST /api/auth/[...all]` - Better Auth endpoints

**Credits:**
- `POST /api/credits/initialize` - Initialize credit account
- `GET /api/credits/balance` - Get balance
- `GET /api/credits/history` - Transaction history

**Creem Payment:**
- `POST /api/creem/checkout` - Create checkout session
- `POST /api/creem/subscription/create` - Create subscription
- `GET /api/creem/subscription/[subscriptionId]` - Get subscription
- `PATCH /api/creem/subscription/[subscriptionId]` - Update subscription
- `DELETE /api/creem/subscription/[subscriptionId]` - Cancel subscription
- `POST /api/creem/subscription/[subscriptionId]/upgrade` - Upgrade subscription
- `POST /api/creem/subscription/[subscriptionId]/downgrade` - Downgrade subscription
- `POST /api/creem/subscription/[subscriptionId]/reactivate` - Reactivate subscription
- `POST /api/creem/customer-portal` - Generate customer portal link
- `POST /api/webhooks/creem` - Creem webhook handler

**Image Generation:**
- `POST /api/v1/analyze-brand-tone` - Analyze brand tone from website URL
- `POST /api/v1/enhance-prompt` - Enhance prompt with brand context
- `POST /api/v1/generate-image` - Generate image (T2I/I2I)

### 5.3. Credit Consumption Rules

**Image Generation:**
- Nano Banana: 5 credits
- Flux 1.1 Pro: 5 credits
- Flux 1.1 Ultra: 8 credits

**Video Generation:**
- Sora 2: 15 credits

**Free Quotas:**
- Image Generation: 1/day, 3/month
- Video Generation: 0/day, 0/month
- Image Extraction: 3/day, 10/month

### 5.4. Subscription Plans

**Free Plan:**
- 30 credits signup bonus (one-time)
- 3 image extractions/day (10/month)
- Unlimited text-to-prompt generation
- Personal use only

**Pro Plan ($14.9/month):**
- 500 credits/month
- 300 image extractions/month
- Commercial license
- No watermarks

**Pro+ Plan ($24.9/month):**
- 900 credits/month
- 600 image extractions/month
- Commercial license
- No watermarks
- Priority support

### 5.5. Brand Tone Analysis Workflow

1. User enters company website URL (optional)
2. System fetches website content
3. DeepSeek AI analyzes content and extracts:
   - Brand tone keywords
   - Product features
   - Target audience
   - Color palette
   - Style keywords
4. Analysis results displayed to user
5. User can toggle brand context usage
6. Brand context integrated into prompt enhancement

### 5.6. Prompt Enhancement Workflow

1. User enters base prompt
2. (Optional) User provides brand analysis or product selling points
3. System calls DeepSeek AI with:
   - Base prompt
   - Brand tone context (if available)
   - Product selling points (if provided)
4. AI returns enhanced prompt with:
   - Improved artistic direction
   - Lighting and composition details
   - Brand-aligned style modifiers
5. User reviews and edits enhanced prompt
6. Enhanced prompt used for image generation

---

## 6. Future Considerations (V2.0)

*   **Multi-language Support:** Generate content and scripts in multiple languages.
*   **A/B Testing Integration:** Tools to automatically generate variations of an asset for A/B testing on e-commerce platforms.
*   **Direct Platform Integration:** One-click publishing to Shopify, WooCommerce, or social media platforms.
*   **3D Model Generation:** Ability to generate simple 3D models of products from 2D images.
*   **Batch Generation:** Excel/CSV upload and batch processing
*   **Video Generation:** Full video generation with multiple styles
*   **Asset Library:** Complete asset management and history

---

## 7. Environment Variables

See `env.example` for complete list. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET` - Creem payment
- `DEEPSEEK_API_KEY` - DeepSeek AI for prompt enhancement and brand analysis
- `OPENROUTER_API_KEY` - OpenRouter for image generation (Gemini)
- `KIE_API_KEY` - KIE API for image/video generation
- `R2_*` - Cloudflare R2 storage configuration

---

## 8. Development Status

**Current Phase:** Core Infrastructure & Image Generation ✅

**Completed:**
- ✅ User authentication system
- ✅ Credit system
- ✅ Subscription plan system (Creem)
- ✅ Quota management
- ✅ Enhanced image generation (T2I/I2I)
- ✅ Brand tone analysis
- ✅ Prompt enhancement with brand context
- ✅ Upgrade prompt system

**In Progress:**
- ⏳ Batch generation (Excel/CSV upload)
- ⏳ Video generation
- ⏳ Homepage UI
- ⏳ Asset library

**Next Steps:**
1. Implement batch generation workflow
2. Implement video generation module
3. Create homepage with showcase gallery
4. Build asset library/history page
5. Add dashboard with credit/subscription view
