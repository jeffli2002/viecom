import { BatchVideoUpload } from '@/components/workflow/batch-video-upload';

export default function BatchVideoGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">批量视频生成</h1>
        <p className="text-gray-600">上传Excel/CSV文件，批量生成产品视频</p>
      </div>
      <BatchVideoUpload />
    </div>
  );
}



