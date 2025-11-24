import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildLocaleCanonicalMetadata } from '@/lib/seo/metadata';
import { Sparkles, Target, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleCanonicalMetadata(locale, '/about');
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">About Viecom</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">
          Empowering e-commerce businesses with AI-powered visual content generation
        </p>
      </div>

      <div className="space-y-8">
        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-500" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-slate-300 space-y-4">
            <p>
              At Viecom, we believe that every e-commerce business deserves access to high-quality
              visual content. Our mission is to democratize professional product photography and
              videography through cutting-edge AI technology.
            </p>
            <p>
              We help online retailers, marketers, and content creators produce stunning product
              images and videos at scale, without the need for expensive equipment or professional
              studios.
            </p>
          </CardContent>
        </Card>

        {/* What We Do */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              What We Do
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-slate-300 space-y-4">
            <p>
              Viecom is an AI-powered content generation platform specifically designed for
              e-commerce. Our platform offers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>AI Image Generation</strong> - Create professional product photos with
                customizable styles and backgrounds
              </li>
              <li>
                <strong>AI Video Generation</strong> - Produce engaging product showcase videos for
                social media and product pages
              </li>
              <li>
                <strong>Brand Analysis</strong> - Automatically analyze your brand tone and style
                from your website
              </li>
              <li>
                <strong>Batch Generation</strong> - Process multiple products at once with Excel/CSV
                upload
              </li>
              <li>
                <strong>Direct Publishing</strong> - Seamlessly publish to major e-commerce
                platforms
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Why Choose Us */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-teal-500" />
              Why Choose Viecom
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Cost-Effective</h4>
                <p className="text-sm">
                  Generate unlimited content at a fraction of the cost of traditional photography
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Fast & Scalable</h4>
                <p className="text-sm">Create hundreds of product visuals in minutes, not days</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Brand Consistency</h4>
                <p className="text-sm">
                  Maintain consistent brand aesthetics across all your product content
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">E-commerce Optimized</h4>
                <p className="text-sm">
                  Content specifically designed for Amazon, Shopee, TikTok, and other platforms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who We Serve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-500" />
              Who We Serve
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-slate-300 space-y-4">
            <p>Viecom is designed for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>E-commerce store owners and managers</li>
              <li>Digital marketing agencies</li>
              <li>Social media content creators</li>
              <li>Product photographers and designers</li>
              <li>Dropshipping and online retail businesses</li>
              <li>Brand managers and marketing teams</li>
            </ul>
          </CardContent>
        </Card>

        {/* Technology */}
        <Card>
          <CardHeader>
            <CardTitle>Our Technology</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-slate-300 space-y-4">
            <p>
              We leverage state-of-the-art AI models including Google's Nano Banana for image
              generation and Sora 2 for video generation. Our platform is built on modern web
              technologies to ensure fast, reliable, and scalable service.
            </p>
            <p>
              Every image and video is optimized for e-commerce use cases, with attention to product
              clarity, professional aesthetics, and platform-specific requirements.
            </p>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Get Started Today</h3>
          <p className="text-gray-700 dark:text-slate-300 mb-6">
            Join thousands of e-commerce businesses creating stunning product visuals with AI
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-teal-500 font-semibold rounded-lg hover:bg-teal-50 dark:bg-teal-900/20 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
