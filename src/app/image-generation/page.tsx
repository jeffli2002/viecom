import ImageGenerator from '@/components/image-generator';

export default function ImageGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">AI Image Generation</h1>
        <p className="text-gray-600">
          Create stunning images with AI. Enhance your prompts with brand analysis and product
          selling points.
        </p>
      </div>
      <ImageGenerator />
    </div>
  );
}


