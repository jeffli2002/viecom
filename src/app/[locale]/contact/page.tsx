import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { creditsConfig } from '@/config/credits.config';
import { Clock, Globe, Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const dailyCheckinCredits = creditsConfig.rewards.checkin.dailyCredits;
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Contact Us</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">
          Have questions? We're here to help. Reach out to our team.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Email Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-500" />
              Email Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">General Inquiries</p>
              <a
                href="mailto:support@viecom.pro"
                className="text-teal-500 hover:underline font-medium"
              >
                support@viecom.pro
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sales & Enterprise</p>
              <a
                href="mailto:sales@viecom.pro"
                className="text-teal-500 hover:underline font-medium"
              >
                sales@viecom.pro
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Technical Support</p>
              <a
                href="mailto:tech@viecom.pro"
                className="text-teal-500 hover:underline font-medium"
              >
                tech@viecom.pro
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-500" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Free Users</p>
              <p className="font-medium">Within 48 hours</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pro Users</p>
              <p className="font-medium">Within 24 hours</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pro+ Users</p>
              <p className="font-medium">Priority support within 4 hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-500" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How quickly can I generate images and videos?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              Images typically generate in 20-30 seconds. Videos take 2-5 minutes depending on
              complexity and server load. Batch generations process multiple items in parallel.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What happens if I run out of credits?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              You have several options: (1) Upgrade to a higher plan for more monthly credits, (2)
              Purchase one-time credit packs starting at $9.90 for 300 credits (packs never expire),
              or (3) Earn credits through daily check-ins ({dailyCheckinCredits} credits/day),
              referrals (10 credits per referral), and social sharing (5 credits per share). Credit
              packs are perfect if you need extra credits without committing to a subscription.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Can I use generated content commercially?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              Yes! Pro and Pro+ subscribers receive full commercial usage rights for all generated
              content. Free users have limited commercial use rights. Please review your plan
              details for specifics.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Which e-commerce platforms do you support?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              Our content is optimized for all major platforms including Amazon, Shopee, TikTok
              Shop, Shopify, Taobao, Douyin, and Tmall. We provide platform-specific formatting and
              optimization.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How do I cancel my subscription?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              You can cancel anytime through your account settings. Your access continues until the
              end of your billing period. No refunds for partial months.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-700 dark:text-slate-300 text-sm">
              We offer a 7-day satisfaction guarantee for new subscriptions. If you're not satisfied
              within the first 7 days, contact us for a full refund. After 7 days, all fees are
              non-refundable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-500" />
            Connect With Us
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-slate-300 mb-4">
            Follow us on social media for updates, tips, and inspiration:
          </p>
          <div className="flex gap-4">
            <a
              href="https://twitter.com/viecom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-slate-700 dark:text-slate-300 font-medium"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com/company/viecom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-slate-700 dark:text-slate-300 font-medium"
            >
              LinkedIn
            </a>
            <a
              href="https://discord.gg/viecom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-500 hover:text-slate-700 dark:text-slate-300 font-medium"
            >
              Discord Community
            </a>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Get Started?
        </h3>
        <p className="text-gray-700 dark:text-slate-300 mb-6">
          Create your free account and start generating stunning product visuals today
        </p>
        <a
          href="/signup"
          className="inline-flex items-center justify-center px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors"
        >
          Start Free Trial
        </a>
      </div>
    </div>
  );
}
