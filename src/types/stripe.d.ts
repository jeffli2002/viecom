declare module 'stripe' {
  export interface Stripe {
    [key: string]: unknown;
  }

  const StripeConstructor: {
    new (...args: unknown[]): Stripe;
  };

  export default StripeConstructor;
}
