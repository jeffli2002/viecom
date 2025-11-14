import { BatchUpload } from '@/components/workflow/batch-upload';

export default function BatchGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">批量生成</h1>
        <p className="text-gray-600">上传Excel/CSV文件，批量生成图片和视频，并自动发布到电商平台</p>
      </div>
      <BatchUpload />
    </div>
  );
}
