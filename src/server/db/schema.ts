import { boolean, decimal, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// User and Auth tables (from Better Auth)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// Credit system
export const userCredits = pgTable('user_credits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),
  totalEarned: integer('total_earned').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  frozenBalance: integer('frozen_balance').notNull().default(0),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: ['earn', 'spend', 'refund', 'admin_adjust', 'freeze', 'unfreeze'],
    }).notNull(),
    amount: integer('amount').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    source: text('source', {
      enum: [
        'subscription',
        'purchase',
        'api_call',
        'admin',
        'storage',
        'bonus',
        'checkin',
        'referral',
        'social_share',
      ],
    }).notNull(),
    description: text('description'),
    referenceId: text('reference_id'),
    metadata: text('metadata'), // JSON string
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Ensure idempotency: prevent duplicate non-null referenceId per user
    userReferenceUnique: {
      name: 'credit_user_reference_unique',
      columns: [table.userId, table.referenceId],
      unique: true,
    },
  })
);

export const creditPackPurchase = pgTable('credit_pack_purchase', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  creditPackId: text('credit_pack_id').notNull(),
  credits: integer('credits').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  provider: text('provider', { enum: ['stripe', 'creem'] })
    .notNull()
    .default('creem'),
  orderId: text('order_id'),
  checkoutId: text('checkout_id'),
  creditTransactionId: text('credit_transaction_id').references(() => creditTransactions.id, {
    onDelete: 'set null',
  }),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Payment and Subscription
export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['stripe', 'creem'] })
    .notNull()
    .default('stripe'),
  priceId: text('price_id').notNull(),
  productId: text('product_id'),
  type: text('type').notNull(),
  interval: text('interval'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  status: text('status').notNull(),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  // Scheduled upgrade fields (方案2: 单条记录+字段)
  scheduledPlanId: text('scheduled_plan_id'),
  scheduledInterval: text('scheduled_interval'),
  scheduledPeriodStart: timestamp('scheduled_period_start'),
  scheduledPeriodEnd: timestamp('scheduled_period_end'),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const paymentEvent = pgTable('payment_event', {
  id: text('id').primaryKey(),
  paymentId: text('payment_id')
    .notNull()
    .references(() => payment.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  stripeEventId: text('stripe_event_id').unique(),
  creemEventId: text('creem_event_id').unique(),
  eventData: text('event_data'), // JSON string
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Quota Usage Tracking
export const userQuotaUsage = pgTable(
  'user_quota_usage',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    service: text('service', {
      enum: [
        'api_call',
        'storage',
        'custom',
        'image_generation',
        'video_generation',
        'image_extraction',
      ],
    }).notNull(),
    period: text('period').notNull(), // Format: YYYY-MM or YYYY-MM-DD
    usedAmount: integer('used_amount').notNull().default(0),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Composite unique index for user, service, and period
    userServicePeriodIdx: {
      name: 'user_service_period_idx',
      columns: [table.userId, table.service, table.period],
      unique: true,
    },
  })
);

export const publishSubmissions = pgTable('publish_submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  assetId: text('asset_id'),
  assetUrl: text('asset_url').notNull(),
  previewUrl: text('preview_url'),
  assetType: text('asset_type').notNull().default('image'),
  title: text('title'),
  prompt: text('prompt'),
  category: text('category'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  publishToLanding: boolean('publish_to_landing').notNull().default(false),
  publishToShowcase: boolean('publish_to_showcase').notNull().default(false),
  tags: jsonb('tags').$type<string[] | null>(),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  landingOrder: integer('landing_order'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const landingShowcaseEntries = pgTable('landing_showcase_entries', {
  id: text('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  category: text('category'),
  ctaUrl: text('cta_url'),
  isVisible: boolean('is_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Brand Tone Profile (Optional feature)
export const brandToneProfile = pgTable('brand_tone_profile', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  websiteUrl: text('website_url'),
  brandAttributes: jsonb('brand_attributes'), // Array of attributes like ["Luxury", "Sustainable", "Playful"]
  colorPalette: jsonb('color_palette'), // Array of colors
  toneDescription: text('tone_description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Batch Generation Jobs
export const batchGenerationJob = pgTable('batch_generation_job', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  jobName: text('job_name'),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  totalRows: integer('total_rows').notNull(),
  processedRows: integer('processed_rows').notNull().default(0),
  successfulRows: integer('successful_rows').notNull().default(0),
  failedRows: integer('failed_rows').notNull().default(0),
  csvFileKey: text('csv_file_key'), // R2 key for uploaded CSV/Excel
  columnMapping: jsonb('column_mapping'), // Maps CSV columns to generation inputs
  errorReport: text('error_report'), // JSON string with detailed errors
  zipFileKey: text('zip_file_key'), // R2 key for final ZIP download
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
  completedAt: timestamp('completed_at'),
});

// Generated Assets (Images and Videos)
export const generatedAsset = pgTable('generated_asset', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  batchJobId: text('batch_job_id').references(() => batchGenerationJob.id, {
    onDelete: 'set null',
  }),
  assetType: text('asset_type', {
    enum: ['image', 'video'],
  }).notNull(),
  generationMode: text('generation_mode', {
    enum: ['t2i', 'i2i', 't2v', 'i2v'],
  }).notNull(),
  // Product information
  productName: text('product_name'),
  productDescription: text('product_description'),
  baseImageUrl: text('base_image_url'), // For I2I and I2V
  // Generation parameters
  prompt: text('prompt').notNull(),
  enhancedPrompt: text('enhanced_prompt'), // After prompt enhancement
  negativePrompt: text('negative_prompt'),
  styleId: text('style_id'), // Reference to style configuration
  styleCustomization: text('style_customization'), // Additional style text
  // Video specific
  videoStyle: text('video_style'), // For video generation styles
  script: text('script'), // Generated script for video
  scriptAudioUrl: text('script_audio_url'), // TTS audio URL
  // Output
  r2Key: text('r2_key').notNull(), // R2 storage key
  publicUrl: text('public_url').notNull(), // Public accessible URL
  thumbnailUrl: text('thumbnail_url'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // For videos, in seconds
  fileSize: integer('file_size'), // In bytes
  // Status and metadata
  status: text('status', {
    enum: ['processing', 'completed', 'failed'],
  })
    .notNull()
    .default('processing'),
  errorMessage: text('error_message'),
  creditsSpent: integer('credits_spent').notNull().default(0),
  generationParams: jsonb('generation_params'), // Full generation parameters
  metadata: jsonb('metadata'), // Additional metadata
  // Retention policy
  expiresAt: timestamp('expires_at'), // For auto-deletion based on subscription tier
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Style Configurations (for image and video styles)
export const styleConfiguration = pgTable('style_configuration', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['image', 'video'],
  }).notNull(),
  // Image styles: Studio Shot, Lifestyle, Minimalist, Seasonal, Infographic
  // Video styles: Spoken Script, Product Comparison, Narrative/Comedy, 360 Showcase, etc.
  styleType: text('style_type').notNull(), // Specific style identifier
  promptTemplate: text('prompt_template'), // Template for prompt enhancement
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Credit Consumption Configuration
export const creditConsumptionConfig = pgTable('credit_consumption_config', {
  id: text('id').primaryKey(),
  generationType: text('generation_type', {
    enum: ['t2i', 'i2i', 't2v', 'i2v'],
  }).notNull(),
  styleId: text('style_id').references(() => styleConfiguration.id, {
    onDelete: 'set null',
  }), // Optional: specific style may cost more
  credits: integer('credits').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Subscription Plans
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  planType: text('plan_type', {
    enum: ['free', 'pro', 'enterprise'],
  })
    .notNull()
    .default('free'),
  status: text('status', {
    enum: ['active', 'cancelled', 'expired', 'trial'],
  })
    .notNull()
    .default('active'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Homepage Showcase Gallery (curated samples)
export const showcaseGallery = pgTable('showcase_gallery', {
  id: text('id').primaryKey(),
  assetId: text('asset_id')
    .notNull()
    .references(() => generatedAsset.id, { onDelete: 'cascade' }),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// E-commerce Platform Publishing
export const platformPublish = pgTable('platform_publish', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  assetId: text('asset_id')
    .notNull()
    .references(() => generatedAsset.id, { onDelete: 'cascade' }),
  platform: text('platform', {
    enum: ['tiktok', 'amazon', 'shopify', 'taobao', 'douyin', 'temu', 'other'],
  }).notNull(),
  platformAccountId: text('platform_account_id'), // User's account ID on the platform
  // Product Information
  productId: text('product_id'), // Platform-specific product ID (if updating existing product)
  productName: text('product_name'), // Product title/name
  productDescription: text('product_description'), // Product description
  productCategory: text('product_category'), // Product category
  productBrand: text('product_brand'), // Brand name
  productModel: text('product_model'), // Model number
  productSku: text('product_sku'), // SKU
  productUpc: text('product_upc'), // UPC/EAN/ISBN code (for Amazon)
  productCountryOfOrigin: text('product_country_of_origin'), // COO (for Amazon)
  // Pricing Information
  standardPrice: decimal('standard_price', { precision: 10, scale: 2 }), // Standard price
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }), // Sale/promotional price (for TikTok)
  currency: text('currency').default('USD'), // Currency code
  // Inventory Information
  inventoryQuantity: integer('inventory_quantity'), // Stock quantity
  minPurchaseQuantity: integer('min_purchase_quantity').default(1),
  maxPurchaseQuantity: integer('max_purchase_quantity'),
  // Media Information
  imageId: text('image_id'), // Platform-specific image ID
  videoId: text('video_id'), // Platform-specific video ID
  thumbnailId: text('thumbnail_id'), // Thumbnail ID
  // Publishing Status
  publishStatus: text('publish_status', {
    enum: ['pending', 'publishing', 'published', 'failed'],
  })
    .notNull()
    .default('pending'),
  publishUrl: text('publish_url'), // URL of the published content
  publishId: text('publish_id'), // Platform-specific publish ID
  errorMessage: text('error_message'),
  publishMetadata: jsonb('publish_metadata'), // Platform-specific metadata
  scheduledAt: timestamp('scheduled_at'), // For scheduled publishing
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Platform Account Connections (OAuth tokens, API keys, etc.)
export const platformAccount = pgTable('platform_account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  platform: text('platform', {
    enum: ['tiktok', 'amazon', 'shopify', 'taobao', 'douyin', 'temu', 'other'],
  }).notNull(),
  accountName: text('account_name'), // Display name
  accountId: text('account_id'), // Platform account ID
  accessToken: text('access_token'), // Encrypted OAuth token or API key
  refreshToken: text('refresh_token'), // For OAuth refresh
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  connectionMetadata: jsonb('connection_metadata'), // Additional connection info
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// Reward System Tables

// Daily Check-in tracking
export const userDailyCheckin = pgTable(
  'user_daily_checkin',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    checkinDate: text('checkin_date').notNull(), // Format: YYYY-MM-DD
    consecutiveDays: integer('consecutive_days').notNull().default(1),
    creditsEarned: integer('credits_earned').notNull().default(0),
    weeklyBonusEarned: boolean('weekly_bonus_earned').notNull().default(false),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    // One checkin per user per day
    userDateUnique: {
      name: 'user_daily_checkin_user_date_unique',
      columns: [table.userId, table.checkinDate],
      unique: true,
    },
    userIdIdx: {
      name: 'user_daily_checkin_user_id_idx',
      columns: [table.userId],
    },
  })
);

// User Referrals tracking
export const userReferrals = pgTable(
  'user_referrals',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    referredId: text('referred_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    referralCode: text('referral_code').notNull(), // Unique code for referrer
    creditsAwarded: boolean('credits_awarded').notNull().default(false),
    referredUserFirstGenerationCompleted: boolean('referred_user_first_generation_completed')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    creditsAwardedAt: timestamp('credits_awarded_at'),
  },
  (table) => ({
    referrerIdIdx: {
      name: 'user_referrals_referrer_id_idx',
      columns: [table.referrerId],
    },
    referralCodeIdx: {
      name: 'user_referrals_referral_code_idx',
      columns: [table.referralCode],
      unique: true,
    },
  })
);

// Social Media Shares tracking
export const socialShares = pgTable(
  'social_shares',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assetId: text('asset_id'), // Reference to generated asset
    platform: text('platform', {
      enum: ['twitter', 'facebook', 'instagram', 'linkedin', 'pinterest', 'tiktok', 'other'],
    }).notNull(),
    shareUrl: text('share_url'), // URL of the shared content
    creditsEarned: integer('credits_earned').notNull().default(0),
    referenceId: text('reference_id'), // For idempotency (e.g., platform post ID)
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: {
      name: 'social_shares_user_id_idx',
      columns: [table.userId],
    },
    // Prevent duplicate rewards for same share
    userReferenceUnique: {
      name: 'social_shares_user_reference_unique',
      columns: [table.userId, table.referenceId],
      unique: true,
    },
  })
);

// Admin users table
export const admins = pgTable('admins', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'), // admin, super_admin
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// Export aliases for admin API compatibility
export const users = user;
export const creditBalances = userCredits;
