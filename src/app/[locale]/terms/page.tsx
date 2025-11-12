import { Card, CardContent } from '@/components/ui/card';
import { creditsConfig } from '@/config/credits.config';
import { paymentConfig } from '@/config/payment.config';

export default function TermsPage() {
  // Get configuration values
  const imageCost = creditsConfig.consumption.imageGeneration['nano-banana'];
  const videoCostMin = creditsConfig.consumption.videoGeneration['sora-2-720p-10s'];
  const videoCostMax = creditsConfig.consumption.videoGeneration['sora-2-pro-1080p-15s'];
  const freePlan = paymentConfig.plans.find(p => p.id === 'free');
  const freeSignupBonus = freePlan?.credits.onSignup || 30;
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-700">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-gray-500">Last updated: November 10, 2024</p>
            
            <p>
              Welcome to Viecom. By accessing or using our AI-powered e-commerce content
              generation platform, you agree to be bound by these Terms of Service. Please read
              them carefully.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            
            <p>
              By creating an account or using Viecom's services, you agree to these Terms of
              Service and our Privacy Policy. If you do not agree, please do not use our
              services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Service Description</h2>
            
            <p>
              Viecom provides AI-powered image and video generation services for e-commerce
              businesses. Our services include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Text-to-image and image-to-image generation</li>
              <li>Text-to-video and image-to-video generation</li>
              <li>Brand tone and style analysis</li>
              <li>Batch content generation</li>
              <li>Asset management and storage</li>
              <li>Direct publishing to e-commerce platforms (where available)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Account Registration</h2>
            
            <p>To use our services, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            
            <p className="mt-4">
              You are responsible for all activities that occur under your account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Subscription and Payment</h2>
            
            <h3 className="text-lg font-semibold text-gray-800">4.1 Plans and Pricing</h3>
            <p>
              We offer various subscription plans with different features and credit allocations.
              Pricing and features are subject to change with 30 days notice.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">4.2 Billing</h3>
            <p>
              Subscriptions are billed monthly or yearly in advance. Payment is processed through
              our payment partner Creem. All fees are non-refundable except as required by law or
              as explicitly stated in your subscription agreement.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">4.3 Credits System</h3>
            <p>
              Our platform uses a credit-based system. Credits are consumed when generating
              images or videos:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Image generation: {imageCost} credits per image</li>
              <li>Video generation: {videoCostMin}-{videoCostMax} credits per video (depending on model, resolution, and duration)</li>
            </ul>
            <p className="mt-2">
              Free plan users receive {freeSignupBonus} credits as a sign-up bonus. Credits are valid for the 
              duration of your subscription period and do not roll over to the next billing cycle unless 
              otherwise specified. Credits earned through rewards (check-ins, referrals, sharing) remain 
              active as long as your account is in good standing.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">4.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings. Your
              access will continue until the end of your current billing period.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Acceptable Use</h2>
            
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Generate illegal, harmful, or offensive content</li>
              <li>Violate any intellectual property rights</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Attempt to reverse engineer or hack our services</li>
              <li>Share your account credentials with others</li>
              <li>Use our services to spam or harass others</li>
              <li>Generate content that violates third-party rights</li>
              <li>Exceed rate limits or abuse our API</li>
            </ul>
            
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-semibold text-gray-800">6.1 Your Content</h3>
            <p>
              You retain all rights to the prompts, images, and other content you create using
              our platform. By using our service, you grant us a limited license to process and
              store your content solely for the purpose of providing our services.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">6.2 Generated Content</h3>
            <p>
              Subject to your subscription plan, you own the rights to images and videos generated
              using our platform, including commercial use rights. However, you are responsible
              for ensuring your use of generated content does not infringe on third-party rights.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">6.3 Platform Content</h3>
            <p>
              All content on our platform (excluding user-generated content), including software,
              text, graphics, logos, and trademarks, is the property of Viecom or its licensors
              and is protected by intellectual property laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Service Limitations</h2>
            
            <p>
              Our services are provided "as is" without warranties of any kind. We do not
              guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Uninterrupted or error-free service</li>
              <li>Specific quality or results of generated content</li>
              <li>That generated content will meet your specific requirements</li>
              <li>That our services will always be available</li>
            </ul>
            
            <p className="mt-4">
              We may modify, suspend, or discontinue any part of our services at any time with
              reasonable notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Limitation of Liability</h2>
            
            <p>
              To the maximum extent permitted by law, Viecom shall not be liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from use or inability to use our services</li>
              <li>Third-party actions or content</li>
            </ul>
            
            <p className="mt-4">
              Our total liability shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">9. Indemnification</h2>
            
            <p>
              You agree to indemnify and hold harmless Viecom, its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use of our services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Content you generate or upload</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">10. Termination</h2>
            
            <p>
              We may suspend or terminate your account at any time for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activities</li>
              <li>Non-payment of fees</li>
              <li>Extended periods of inactivity</li>
            </ul>
            
            <p className="mt-4">
              Upon termination, your right to use the service will cease immediately. You may
              download your content within 30 days of termination.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">11. Dispute Resolution</h2>
            
            <p>
              Any disputes arising from these Terms shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association, except where
              prohibited by law.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">12. Governing Law</h2>
            
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">13. Changes to Terms</h2>
            
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of
              material changes at least 30 days in advance. Your continued use after changes
              constitutes acceptance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">14. Contact Information</h2>
            
            <div className="space-y-2">
              <p>For questions about these Terms of Service, contact us at:</p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:legal@viecom.pro" className="text-purple-600 hover:underline">
                  legal@viecom.pro
                </a>
              </p>
              <p>
                <strong>Support:</strong>{' '}
                <a href="mailto:support@viecom.pro" className="text-purple-600 hover:underline">
                  support@viecom.pro
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-gray-700">
            By using Viecom, you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service and our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

