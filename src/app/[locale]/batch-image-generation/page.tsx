import { BatchImageUpload } from '@/components/workflow/batch-image-upload';

export default function BatchImageGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">批量图片生成</h1>
        <p className="text-gray-600">上传Excel/CSV文件，批量生成产品图片</p>
      </div>
      <BatchImageUpload />
    </div>
  );
}



