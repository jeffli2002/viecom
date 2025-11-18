'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BatchGenerationFlow } from './batch-generation-flow';
import { BatchResults } from './batch-results';

export function BatchImageUpload() {
  return <BatchGenerationFlow generationType="image" />;
}

// Legacy component - keeping for backward compatibility
export function BatchImageUploadLegacy() {
  const _t = useTranslations('batchGeneration');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [generationMode, setGenerationMode] = useState<'t2i' | 'i2i'>('t2i');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageStyle, setImageStyle] = useState<string>('studio-shot');

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const response = await fetch(
        `/api/v1/workflow/template/download?format=${format}&generationType=image`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-image-generation-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template error:', error);
      alert('下载模板失败');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf('.'))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert('请上传 CSV 或 Excel 文件');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('generationType', 'image');
      formData.append('mode', generationMode);
      formData.append('aspectRatio', aspectRatio);
      formData.append('style', imageStyle);

      const response = await fetch('/api/v1/workflow/batch', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      setJobId(data.data.jobId);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Start polling for results
      startPolling(data.data.jobId);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : '上传失败');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const startPolling = (jobId: string) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/workflow/batch/${jobId}/results`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success && data.data.jobStatus === 'completed') {
          setIsUploading(false);
          setUploadProgress(0);
          clearInterval(interval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">批量图片生成</h2>
          <p className="text-gray-600">上传Excel/CSV文件，批量生成产品图片</p>
        </div>

        {/* Generation Settings */}
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">生成模式</Label>
              <Select
                value={generationMode}
                onValueChange={(value) => setGenerationMode(value as 't2i' | 'i2i')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="t2i">Text-to-Image (文本生图)</SelectItem>
                  <SelectItem value="i2i">Image-to-Image (图生图)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">宽高比</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                  <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                  <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="3:4">3:4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">图片风格</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id} title={style.description}>
                    {style.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template Download Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <Label className="text-sm font-medium mb-3 block">下载模板</Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('excel')}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              下载 Excel 模板
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('csv')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              下载 CSV 模板
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            模板包含字段：prompt（必需）,
            baseImageUrl（可选，用于图生图，支持URL、base64或Excel中直接插入图片）, model（可选）,
            productSellingPoints（可选）
          </p>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input" className="text-sm font-medium mb-2 block">
              上传文件
            </Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中 {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                开始批量生成
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        {!jobId && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">使用说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>下载模板文件，填写生成提示词（prompt）</li>
              <li>
                如果选择图生图模式，需要填写 baseImageUrl
                字段（支持URL、base64或Excel中直接插入图片）
              </li>
              <li>model 和 productSellingPoints 为可选字段</li>
              <li>上传填写好的文件开始批量生成</li>
              <li>生成完成后可以预览和下载结果</li>
            </ul>
          </div>
        )}

        {/* Results */}
        {jobId && (
          <div className="border-t pt-4">
            <BatchResults jobId={jobId} />
          </div>
        )}
      </div>
    </Card>
  );
}
