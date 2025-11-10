import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-700">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-gray-500">Last updated: November 10, 2024</p>
            
            <p>
              At Viecom, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our AI-powered
              e-commerce content generation platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4">1.1 Account Information</h3>
            <p>
              When you create an account, we collect your email address, name, and password.
              If you sign up using a social provider (Google), we receive basic profile
              information from that provider.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">1.2 Content and Usage Data</h3>
            <p>
              We collect the prompts, images, and videos you create or upload to our platform.
              This includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Text prompts for image and video generation</li>
              <li>Uploaded images for image-to-image or image-to-video generation</li>
              <li>Generated images and videos</li>
              <li>Brand analysis data from websites you analyze</li>
              <li>Usage statistics and generation history</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">1.3 Payment Information</h3>
            <p>
              Payment processing is handled by our third-party payment processor (Creem). We do
              not store your full credit card information. We only retain transaction records
              and subscription status.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">1.4 Technical Data</h3>
            <p>
              We automatically collect certain information about your device and how you interact
              with our service, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and features used</li>
              <li>Timestamps and interaction patterns</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. How We Use Your Information</h2>
            
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and maintain our AI content generation services</li>
              <li>Process your image and video generation requests</li>
              <li>Manage your account and subscription</li>
              <li>Send you service updates and important notifications</li>
              <li>Improve our AI models and service quality</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Data Storage and Security</h2>
            
            <p>
              Your generated content is stored securely on Cloudflare R2 storage. We implement
              industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication and session management</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            
            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. While we
              strive to protect your data, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Data Sharing and Disclosure</h2>
            
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>AI Service Providers:</strong> We use KIE.ai and DeepSeek APIs to process
                your generation requests. Your prompts are sent to these services for processing.
              </li>
              <li>
                <strong>Payment Processors:</strong> Creem handles payment processing and may
                access transaction data.
              </li>
              <li>
                <strong>Cloud Infrastructure:</strong> We use Vercel for hosting and Cloudflare
                for storage and CDN services.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information if required by
                law or to protect our rights.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Your Rights</h2>
            
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your generated content</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
            
            <p className="mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@viecom.ai" className="text-purple-600 hover:underline">
                privacy@viecom.ai
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Cookies and Tracking</h2>
            
            <p>
              We use cookies and similar tracking technologies to enhance your experience. These
              include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Essential Cookies:</strong> Required for authentication and basic
                functionality
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how you use our platform
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and preferences
              </li>
            </ul>
            
            <p className="mt-4">
              You can control cookie settings through your browser preferences.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Data Retention</h2>
            
            <p>
              We retain your data for as long as your account is active or as needed to provide
              services. Generated content is stored for the duration of your subscription plus 30
              days. You can delete your content at any time through your account dashboard.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Children's Privacy</h2>
            
            <p>
              Our service is not intended for users under 18 years of age. We do not knowingly
              collect personal information from children. If you believe we have collected data
              from a child, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">9. International Users</h2>
            
            <p>
              Your information may be transferred to and processed in countries other than your
              country of residence. These countries may have different data protection laws. By
              using our service, you consent to such transfers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">10. Changes to This Policy</h2>
            
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by email or through a prominent notice on our platform. Your
              continued use of the service after changes constitutes acceptance of the updated
              policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">11. Contact Us</h2>
            
            <p>
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <div className="mt-4 space-y-1">
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@viecom.ai" className="text-purple-600 hover:underline">
                  privacy@viecom.ai
                </a>
              </p>
              <p>
                <strong>Website:</strong>{' '}
                <a href="https://viecom.ai" className="text-purple-600 hover:underline">
                  https://viecom.ai
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

