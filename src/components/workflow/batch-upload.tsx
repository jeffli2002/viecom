'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileText, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BatchResults } from './batch-results';

export function BatchUpload() {
  const t = useTranslations('batchGeneration');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const response = await fetch(`/api/v1/workflow/template/download?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-generation-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
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
      formData.append('autoPublish', 'true'); // Enable auto-publish

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
          <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
          <p className="text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
        </div>

        {/* Template Download Section */}
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
          <Label className="text-sm font-medium mb-3 block">{t('downloadTemplate')}</Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('excel')}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('downloadExcel')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('csv')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {t('downloadCSV')}
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Template includes all required fields: generation parameters, product information,
            pricing, inventory, and publishing options
          </p>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input" className="text-sm font-medium mb-2 block">
              {t('uploadFile')}
            </Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('uploading')} {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t('startProcessing')}
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        {!jobId && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">{t('instructions')}：</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>{t('instruction1')}</li>
              <li>{t('instruction2')}</li>
              <li>{t('instruction3')}</li>
              <li>{t('instruction4')}</li>
              <li>{t('instruction5')}</li>
              <li>{t('instruction6')}</li>
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
