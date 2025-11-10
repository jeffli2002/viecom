import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Globe,
  Sparkles,
  Loader2,
  CheckCircle2,
  Palette,
  Tag,
  Zap,
  Eye,
  TrendingUp,
  Copy,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface BrandAnalysisResult {
  brandName: string;
  productCategory: string[];
  brandTone: string;
  colors: {
    primary: string;
    secondary: string[];
  };
  styleKeywords: string[];
  targetAudience: string;
  brandPersonality: string[];
  contentThemes: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
}

export function BrandAnalysis() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<BrandAnalysisResult | null>(null);

  const analysisSteps = [
    { label: '正在抓取网站内容...', progress: 25 },
    { label: '提取元数据...', progress: 50 },
    { label: 'AI 分析品牌特征...', progress: 75 },
    { label: '生成分析报告...', progress: 100 }
  ];

  const handleAnalyze = async () => {
    if (!url) {
      toast.error('请输入网站 URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error('请输入有效的 URL');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisStep(0);

    // Simulate analysis steps
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Mock analysis result
    const mockResult: BrandAnalysisResult = {
      brandName: 'StyleCraft',
      productCategory: ['时尚服装', '生活方式', '配饰'],
      brandTone: '现代、优雅、可持续',
      colors: {
        primary: '#2D3436',
        secondary: ['#6C5CE7', '#FDCB6E', '#00B894']
      },
      styleKeywords: [
        '极简主义',
        '现代设计',
        '环保',
        '高品质',
        '都市风格',
        '可持续时尚'
      ],
      targetAudience: '25-40岁追求品质生活的都市专业人士',
      brandPersonality: ['专业', '创新', '环保意识', '注重细节'],
      contentThemes: ['可持续时尚', '都市生活方式', '设计故事', '品质工艺'],
      metadata: {
        title: 'StyleCraft - 可持续都市时尚品牌',
        description: '探索现代可持续时尚，为都市生活带来优雅与品质',
        language: 'zh-CN'
      }
    };

    setResult(mockResult);
    setIsAnalyzing(false);
    toast.success('品牌分析完成！');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const downloadReport = () => {
    if (!result) return;
    
    const report = JSON.stringify(result, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analysis-${result.brandName}.json`;
    a.click();
    toast.success('报告已下载');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700">
          <Sparkles className="size-4" />
          <span className="text-sm">AI 品牌分析</span>
        </div>
        <h1 className="text-4xl md:text-5xl text-slate-900">
          品牌智能分析
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          输入品牌网站 URL，AI 自动分析品牌定位、视觉风格、色彩方案等关键信息
        </p>
      </div>

      {/* Input Section */}
      <Card className="max-w-3xl mx-auto border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-violet-600" />
            输入品牌网站
          </CardTitle>
          <CardDescription>
            输入品牌官网 URL，系统将自动抓取并分析品牌信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">网站 URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url}
                className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    分析品牌
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Analysis Progress */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {analysisSteps[analysisStep].label}
                    </span>
                    <span className="text-slate-600">
                      {analysisSteps[analysisStep].progress}%
                    </span>
                  </div>
                  <Progress value={analysisSteps[analysisStep].progress} />
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {analysisSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`
                        p-2 rounded-lg text-center text-xs transition-colors
                        ${index <= analysisStep
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-slate-100 text-slate-400'
                        }
                      `}
                    >
                      {index < analysisStep ? (
                        <CheckCircle2 className="size-4 mx-auto" />
                      ) : index === analysisStep ? (
                        <Loader2 className="size-4 mx-auto animate-spin" />
                      ) : (
                        <div className="size-4 mx-auto rounded-full border-2 border-current" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Integration Note */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>提示：</strong> 真实环境中，需要在后端集成 Firecrawl API 和 DeepSeek AI API。
              当前展示为模拟数据。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-slate-900">分析结果</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                >
                  <Copy className="size-4" />
                  复制
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={downloadReport}
                >
                  <Download className="size-4" />
                  下载报告
                </Button>
              </div>
            </div>

            {/* Metadata Card */}
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="size-5 text-violet-600" />
                  {result.brandName}
                </CardTitle>
                <CardDescription className="text-base">
                  {result.metadata.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">网站标题</div>
                  <div className="text-slate-900">{result.metadata.title}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">语言</div>
                  <Badge variant="secondary">{result.metadata.language}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-600">产品类别</div>
                  <div className="flex flex-wrap gap-1">
                    {result.productCategory.map((cat, index) => (
                      <Badge key={index} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Analysis Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brand Tone */}
              <Card className="border-2 hover:border-violet-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="size-5 text-amber-600" />
                    品牌调性
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-slate-900">{result.brandTone}</p>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-slate-600">品牌性格</div>
                    <div className="flex flex-wrap gap-2">
                      {result.brandPersonality.map((trait, index) => (
                        <Badge key={index} className="bg-amber-100 text-amber-800 border-amber-200">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card className="border-2 hover:border-fuchsia-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="size-5 text-fuchsia-600" />
                    目标受众
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-slate-900">{result.targetAudience}</p>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="size-5 text-purple-600" />
                    品牌色彩
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">主色调</div>
                    <div className="flex items-center gap-3">
                      <div
                        className="size-12 rounded-xl border-2 border-slate-200 shadow-sm"
                        style={{ backgroundColor: result.colors.primary }}
                      />
                      <div>
                        <div className="text-slate-900">{result.colors.primary}</div>
                        <button
                          onClick={() => copyToClipboard(result.colors.primary)}
                          className="text-sm text-violet-600 hover:underline"
                        >
                          复制
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">辅助色</div>
                    <div className="flex flex-wrap gap-2">
                      {result.colors.secondary.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="size-10 rounded-lg border-2 border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color)}
                            title={`点击复制 ${color}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Style Keywords */}
              <Card className="border-2 hover:border-green-200 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="size-5 text-green-600" />
                    风格关键词
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.styleKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-base py-1.5 px-3 border-2"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Themes */}
              <Card className="border-2 hover:border-blue-200 transition-colors md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="size-5 text-blue-600" />
                    内容主题
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {result.contentThemes.map((theme, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center"
                      >
                        <div className="text-slate-900">{theme}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Use This Analysis */}
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg text-slate-900">使用此分析生成内容</h3>
                    <p className="text-sm text-slate-600">
                      基于品牌分析结果，自动生成符合品牌调性的产品图片和视频
                    </p>
                  </div>
                  <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                    <Sparkles className="size-4" />
                    开始创作
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integration Guide */}
      {!result && !isAnalyzing && (
        <Card className="max-w-3xl mx-auto border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-violet-600" />
              如何集成 API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="space-y-2">
              <h4 className="text-slate-900">1. Firecrawl API 集成</h4>
              <p>在后端使用 Firecrawl 抓取网站内容：</p>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto">
{`// Backend API endpoint
const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: websiteUrl,
    formats: ['markdown', 'html']
  })
});`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-900">2. DeepSeek AI 分析</h4>
              <p>使用 DeepSeek AI 分析品牌内容：</p>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto">
{`// Backend API endpoint
const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_DEEPSEEK_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: '分析以下品牌网站内容...'
    }]
  })
});`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
