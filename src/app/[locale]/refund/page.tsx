// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { DEFAULT_SEO_KEYWORDS } from '@/lib/seo/metadata';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - Viecom',
  description:
    'Refund policy for Viecom AI image and video generation services. Learn about our no-refund policy for digital services.',
  keywords: [
    ...DEFAULT_SEO_KEYWORDS,
    'Viecom refund policy',
    'AI service refunds',
    'digital product refund rules',
  ],
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Refund Policy</h1>

      <div className="space-y-6 text-gray-700">
        {/* Important Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2 text-lg">
                  Digital Services - No Refund Policy
                </h3>
                <p className="text-amber-800">
                  As a digital service provider, all purchases of credits, subscriptions, and credit
                  packs are final and non-refundable. Please carefully review your purchase before
                  completing the transaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-gray-500">Last updated: November 12, 2024</p>

            <p>
              This Refund Policy outlines our policies and procedures regarding refunds for Viecom's
              AI-powered image and video generation services. By making a purchase on our platform,
              you acknowledge and agree to this policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. General Policy</h2>

            <p>
              Due to the nature of digital services and AI-generated content,{' '}
              <strong>all sales are final and non-refundable</strong>. This includes but is not
              limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Credit purchases (one-time credit packs)</li>
              <li>Subscription plans (Pro, Pro+ monthly or yearly)</li>
              <li>AI-generated images and videos</li>
              <li>Brand analysis services</li>
              <li>Batch generation services</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Why No Refunds?</h2>

            <p>
              Our digital services involve the immediate consumption of computational resources and
              AI processing. Once you:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Generate an image or video using AI</li>
              <li>Use credits for content creation</li>
              <li>Access generated results</li>
              <li>Download or share generated content</li>
            </ul>
            <p className="mt-4">
              The service has been delivered and computational resources have been consumed.
              Therefore, we cannot offer refunds for digital services that have been accessed or
              utilized.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Subscription Cancellation</h2>

            <p>While we do not offer refunds, you can cancel your subscription at any time:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Cancellation:</strong> You can cancel your subscription from your account
                dashboard
              </li>
              <li>
                <strong>Access Period:</strong> After cancellation, you will retain access to your
                subscription benefits until the end of your current billing period
              </li>
              <li>
                <strong>Credits:</strong> Any unused monthly credits will expire at the end of the
                billing period
              </li>
              <li>
                <strong>No Partial Refunds:</strong> Cancelling mid-cycle does not entitle you to a
                partial refund
              </li>
              <li>
                <strong>Purchased Credits:</strong> One-time purchased credit packs never expire and
                remain in your account even after subscription cancellation
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Exceptions</h2>

            <p>We may consider refund requests only in the following exceptional circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Duplicate Charges:</strong> If you were charged multiple times for the same
                purchase due to a technical error
              </li>
              <li>
                <strong>Unauthorized Transactions:</strong> If your account was compromised and
                unauthorized purchases were made (subject to verification)
              </li>
              <li>
                <strong>Service Failure:</strong> If our platform experienced a complete service
                outage preventing you from using purchased credits (limited to the affected credits
                only)
              </li>
            </ul>

            <p className="mt-4">
              To request a refund review under these exceptional circumstances, please contact our
              support team at{' '}
              <a href="mailto:support@viecom.pro" className="text-teal-500 hover:underline">
                support@viecom.pro
              </a>{' '}
              within 7 days of the transaction with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your transaction ID</li>
              <li>Detailed description of the issue</li>
              <li>Supporting evidence (screenshots, error messages, etc.)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Free Trial and Testing</h2>

            <p>
              We encourage you to utilize our free tier to test our services before making a
              purchase:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Free Plan:</strong> All users receive 30 sign-up bonus credits
              </li>
              <li>
                <strong>Daily Rewards:</strong> Earn 2 credits per day through check-ins
              </li>
              <li>
                <strong>Referral Rewards:</strong> Earn 10 credits per successful referral
              </li>
              <li>
                <strong>Social Sharing:</strong> Earn 5 credits per share
              </li>
            </ul>

            <p className="mt-4">
              These free credits allow you to test image and video generation quality before
              committing to a paid plan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Chargebacks</h2>

            <p>If you file a chargeback or dispute a valid charge with your payment provider:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your account may be immediately suspended or terminated</li>
              <li>All generated content may become inaccessible</li>
              <li>You may be liable for chargeback fees and legal costs</li>
              <li>Future access to our services may be denied</li>
            </ul>

            <p className="mt-4">
              Please contact us directly to resolve any billing issues before initiating a
              chargeback.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Pricing Changes</h2>

            <p>We reserve the right to modify our pricing at any time. However:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Existing subscribers will be grandfathered at their current rate for the duration of
                their subscription
              </li>
              <li>Price changes will only apply to new subscriptions or renewals</li>
              <li>We will provide at least 30 days notice before any price changes take effect</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Contact Us</h2>

            <p>
              If you have questions about this Refund Policy or need assistance with your account,
              please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@viecom.pro" className="text-teal-500 hover:underline">
                  support@viecom.pro
                </a>
              </li>
              <li>
                <strong>Support:</strong>{' '}
                <Link href="/contact" className="text-teal-500 hover:underline">
                  Contact Page
                </Link>
              </li>
            </ul>

            <p className="mt-4">
              We are committed to providing excellent customer service and will work with you to
              resolve any legitimate issues with our services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">9. Policy Updates</h2>

            <p>
              We may update this Refund Policy from time to time. Any changes will be posted on this
              page with an updated "Last updated" date. Your continued use of our services after any
              changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Summary</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ All digital service purchases are final and non-refundable</li>
            <li>✓ Test our services using the free tier before purchasing</li>
            <li>✓ Cancel subscriptions anytime (access remains until end of billing period)</li>
            <li>✓ Contact support for exceptional circumstances within 7 days</li>
            <li>✓ Purchased credit packs never expire</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
