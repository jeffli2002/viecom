import VideoGenerator from '@/components/video-generator';

export default function VideoGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">AI Video Generation</h1>
        <p className="text-gray-600">
          创建专业的电商产品视频。支持Text-to-Video和Image-to-Video模式。
        </p>
      </div>
      <VideoGenerator />
    </div>
  );
}
