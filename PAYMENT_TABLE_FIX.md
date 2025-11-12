# Payment Table Missing Amount Column

## Problem

The `payment` table doesn't have an `amount` column to store payment amounts, causing the admin dashboard revenue stats to fail.

## Current Schema

```typescript
export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['stripe', 'creem'] }).notNull().default('stripe'),
  priceId: text('price_id').notNull(),
  productId: text('product_id'),
  type: text('type').notNull(),
  interval: text('interval'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  status: text('status').notNull(),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
});
```

**Missing**: `amount` column

## Solution 1: Add amount column (Recommended)

### Step 1: Update schema.ts

```typescript
export const payment = pgTable('payment', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['stripe', 'creem'] }).notNull().default('stripe'),
  priceId: text('price_id').notNull(),
  productId: text('product_id'),
  type: text('type').notNull(),
  interval: text('interval'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // ADD THIS
  currency: text('currency').notNull().default('usd'), // ADD THIS
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull(),
  subscriptionId: text('subscription_id'),
  status: text('status').notNull(),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
});
```

### Step 2: Generate and run migration

```bash
pnpm db:generate
pnpm db:push
```

### Step 3: Update dashboard API

Restore the revenue query in `src/app/api/admin/dashboard/stats/route.ts`:

```typescript
// Get today's revenue
const todayRevenue = await db
  .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
  .from(payment)
  .where(gte(payment.createdAt, today));
```

## Solution 2: Calculate from subscription plans

Keep the current workaround and calculate revenue based on subscription plans:

```typescript
// Get today's revenue from subscriptions
const todaySubscriptions = await db
  .select({ 
    plan: subscription.planType,
    count: sql<number>`count(*)`
  })
  .from(subscription)
  .where(gte(subscription.createdAt, today))
  .groupBy(subscription.planType);

// Calculate revenue based on plan prices
const revenue = todaySubscriptions.reduce((total, sub) => {
  const planPrice = sub.plan === 'pro' ? 14.9 : sub.plan === 'enterprise' ? 24.9 : 0;
  return total + (planPrice * Number(sub.count));
}, 0);
```

## Recommendation

**Use Solution 1**: Add `amount` and `currency` columns to the `payment` table.

This is more accurate and flexible for:
- One-time payments (credit packs)
- Different pricing tiers
- Discounts and promotions
- Multiple currencies
- Historical accuracy

## TODO

- [ ] Add amount and currency columns to payment schema
- [ ] Generate and run migration
- [ ] Update all payment creation logic to include amount
- [ ] Update dashboard stats API to use amount
- [ ] Test revenue calculations

