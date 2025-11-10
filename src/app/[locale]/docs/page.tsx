import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Image as ImageIcon,
  Video,
  Sparkles,
  Upload,
  Wand2,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Documentation</h1>
        <p className="text-lg text-gray-600">
          Learn how to make the most of Viecom's AI-powered content generation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Getting Started */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/quickstart"
                className="text-purple-600 hover:underline font-medium"
              >
                Quick Start Guide
              </Link>
              <p className="text-sm text-gray-600">Set up your account and generate your first content in 5 minutes</p>
            </div>
            <div>
              <Link
                href="/docs/credits"
                className="text-purple-600 hover:underline font-medium"
              >
                Understanding Credits
              </Link>
              <p className="text-sm text-gray-600">Learn how the credit system works</p>
            </div>
            <div>
              <Link href="/docs/plans" className="text-purple-600 hover:underline font-medium">
                Choosing the Right Plan
              </Link>
              <p className="text-sm text-gray-600">Compare features and find the best plan for your needs</p>
            </div>
          </CardContent>
        </Card>

        {/* Image Generation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Image Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/text-to-image"
                className="text-purple-600 hover:underline font-medium"
              >
                Text-to-Image Guide
              </Link>
              <p className="text-sm text-gray-600">Create images from text descriptions</p>
            </div>
            <div>
              <Link
                href="/docs/image-to-image"
                className="text-purple-600 hover:underline font-medium"
              >
                Image-to-Image Guide
              </Link>
              <p className="text-sm text-gray-600">Transform existing images with AI</p>
            </div>
            <div>
              <Link
                href="/docs/image-styles"
                className="text-purple-600 hover:underline font-medium"
              >
                Image Styles Reference
              </Link>
              <p className="text-sm text-gray-600">Explore available styles and use cases</p>
            </div>
          </CardContent>
        </Card>

        {/* Video Generation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Video Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/text-to-video"
                className="text-purple-600 hover:underline font-medium"
              >
                Text-to-Video Guide
              </Link>
              <p className="text-sm text-gray-600">Create product videos from descriptions</p>
            </div>
            <div>
              <Link
                href="/docs/image-to-video"
                className="text-purple-600 hover:underline font-medium"
              >
                Image-to-Video Guide
              </Link>
              <p className="text-sm text-gray-600">Animate your product images</p>
            </div>
            <div>
              <Link
                href="/docs/video-styles"
                className="text-purple-600 hover:underline font-medium"
              >
                Video Styles Reference
              </Link>
              <p className="text-sm text-gray-600">Learn about different video styles</p>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Enhancement */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              Prompt Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/prompt-basics"
                className="text-purple-600 hover:underline font-medium"
              >
                Prompt Writing Basics
              </Link>
              <p className="text-sm text-gray-600">Learn how to write effective prompts</p>
            </div>
            <div>
              <Link
                href="/docs/ai-enhancement"
                className="text-purple-600 hover:underline font-medium"
              >
                AI Prompt Enhancement
              </Link>
              <p className="text-sm text-gray-600">Automatically improve your prompts with AI</p>
            </div>
            <div>
              <Link
                href="/docs/prompt-tips"
                className="text-purple-600 hover:underline font-medium"
              >
                Advanced Tips & Tricks
              </Link>
              <p className="text-sm text-gray-600">Pro techniques for better results</p>
            </div>
          </CardContent>
        </Card>

        {/* Brand Analysis */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Brand Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/brand-analysis-guide"
                className="text-purple-600 hover:underline font-medium"
              >
                Brand Analysis Guide
              </Link>
              <p className="text-sm text-gray-600">Analyze your brand tone and style automatically</p>
            </div>
            <div>
              <Link
                href="/docs/brand-consistency"
                className="text-purple-600 hover:underline font-medium"
              >
                Maintaining Brand Consistency
              </Link>
              <p className="text-sm text-gray-600">Use brand data across all generations</p>
            </div>
          </CardContent>
        </Card>

        {/* Batch Generation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              Batch Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/batch-images"
                className="text-purple-600 hover:underline font-medium"
              >
                Batch Image Generation
              </Link>
              <p className="text-sm text-gray-600">Generate multiple images from CSV/Excel</p>
            </div>
            <div>
              <Link
                href="/docs/batch-videos"
                className="text-purple-600 hover:underline font-medium"
              >
                Batch Video Generation
              </Link>
              <p className="text-sm text-gray-600">Create multiple product videos at once</p>
            </div>
            <div>
              <Link
                href="/docs/template-format"
                className="text-purple-600 hover:underline font-medium"
              >
                Template File Format
              </Link>
              <p className="text-sm text-gray-600">Learn about the CSV/Excel template structure</p>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" />
              Publishing & Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Link
                href="/docs/publishing-guide"
                className="text-purple-600 hover:underline font-medium"
              >
                Publishing Guide
              </Link>
              <p className="text-sm text-gray-600">Publish content directly to e-commerce platforms</p>
            </div>
            <div>
              <Link
                href="/docs/platform-integration"
                className="text-purple-600 hover:underline font-medium"
              >
                Platform Integration
              </Link>
              <p className="text-sm text-gray-600">Connect your store accounts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help CTA */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h3>
        <p className="text-gray-700 mb-6">
          Our support team is here to help. Contact us anytime.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Contact Support
          </Link>
          <a
            href="mailto:support@viecom.ai"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
          >
            Email Us
          </a>
        </div>
      </div>

      {/* Note */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This documentation is continuously updated. For the most
          up-to-date information, please check back regularly or contact our support team.
        </p>
      </div>
    </div>
  );
}

