import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Download,
  FileText,
  Users,
  Target,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  Star,
  Lightbulb,
  Award,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface BrandAnalysisResult {
  brandName: string;
  website: string;
  productCategory: string[];
  brandTone: string;
  brandVoice: string;
  colors: {
    primary: string;
    secondary: string[];
    accent?: string;
  };
  styleKeywords: string[];
  targetAudience: string;
  audienceAge: string;
  audienceIncome: string;
  brandPersonality: string[];
  contentThemes: string[];
  visualStyle: {
    photography: string;
    layout: string;
    typography: string;
  };
  competitiveAdvantage: string[];
  recommendedImageStyles: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  socialMediaTone: string;
  marketingFocus: string[];
}

const mockBrands = {
  'https://apple.com': {
    brandName: 'Apple',
    website: 'https://apple.com',
    productCategory: ['科技产品', '消费电子', '软件服务'],
    brandTone: '创新、极简、高端',
    brandVoice: '自信、鼓舞人心、简洁明了',
    colors: {
      primary: '#000000',
      secondary: ['#FFFFFF', '#F5F5F7', '#86868B'],
      accent: '#0071E3'
    },
    styleKeywords: ['极简主义', '创新设计', '高端品质', '用户友好', '现代感', '精致工艺'],
    targetAudience: '25-45岁追求创新和品质的专业人士及创意工作者',
    audienceAge: '25-45岁',
    audienceIncome: '中高收入',
    brandPersonality: ['创新', '精致', '优雅', '前卫', '可靠'],
    contentThemes: ['产品创新', '用户体验', '设计美学', '生态系统', '隐私安全'],
    visualStyle: {
      photography: '简洁的产品摄影，干净的白色或灰色背景，专业的光影效果',
      layout: '大量留白，对称和平衡的布局，清晰的视觉层次',
      typography: 'San Francisco 字体，简洁的标题，清晰易读的正文'
    },
    competitiveAdvantage: ['创新设计', '生态系统整合', '高端品质', '品牌忠诚度'],
    recommendedImageStyles: [
      '极简产品摄影 - 纯白背景',
      '生活方式场景 - 专业人士使用',
      '特写细节 - 展示工艺',
      '现代办公环境',
      '创意工作场景'
    ],
    metadata: {
      title: 'Apple',
      description: 'Discover the innovative world of Apple',
      language: 'en-US'
    },
    socialMediaTone: '鼓舞人心、展示用户创作、强调创新功能',
    marketingFocus: ['产品功能', '用户故事', '创新技术', '生态系统']
  },
  'https://nike.com': {
    brandName: 'Nike',
    website: 'https://nike.com',
    productCategory: ['运动服饰', '运动鞋', '运动装备'],
    brandTone: '激励、活力、胜利',
    brandVoice: '鼓舞人心、充满激情、直接有力',
    colors: {
      primary: '#111111',
      secondary: ['#FFFFFF', '#FA5400', '#FFC72C'],
      accent: '#FA5400'
    },
    styleKeywords: ['运动', '活力', '胜利', '激励', '创新', '突破'],
    targetAudience: '18-35岁热爱运动和健康生活方式的年轻人',
    audienceAge: '18-35岁',
    audienceIncome: '中等收入',
    brandPersonality: ['激励', '创新', '勇敢', '竞争', '包容'],
    contentThemes: ['运动表现', '突破极限', '运动员故事', '创新科技', '社会责任'],
    visualStyle: {
      photography: '动态运动场景，充满能量的人物摄影，戏剧性的光影',
      layout: '动感的对角线构图，大胆的文字排版，高对比度',
      typography: 'Futura 字体，大胆的标题，有力的口号'
    },
    competitiveAdvantage: ['品牌影响力', '运动员代言', '创新科技', '情感连接'],
    recommendedImageStyles: [
      '运动场景 - 动态捕捉',
      '运动员肖像 - 充满力量',
      '产品特写 - 展示科技',
      '城市运动 - 街头风格',
      '团队精神 - 群体运动'
    ],
    metadata: {
      title: 'Nike. Just Do It',
      description: 'Inspiring athletes worldwide',
      language: 'en-US'
    },
    socialMediaTone: '激励人心、展示运动精神、鼓励行动',
    marketingFocus: ['运动员故事', '产品创新', '社会影响', '运动文化']
  },
  'https://starbucks.com': {
    brandName: 'Starbucks',
    website: 'https://starbucks.com',
    productCategory: ['咖啡', '饮品', '食品', '咖啡周边'],
    brandTone: '温暖、社区、品质',
    brandVoice: '友好、热情、关怀',
    colors: {
      primary: '#00704A',
      secondary: ['#FFFFFF', '#D4AF37', '#E4C6A7'],
      accent: '#D4AF37'
    },
    styleKeywords: ['温暖', '舒适', '社区', '手工', '品质', '可持续'],
    targetAudience: '25-50岁注重生活品质和社交体验的都市人群',
    audienceAge: '25-50岁',
    audienceIncome: '中高收入',
    brandPersonality: ['温暖', '友好', '可靠', '责任', '社区导向'],
    contentThemes: ['咖啡文化', '社区连接', '可持续发展', '手工制作', '温暖时刻'],
    visualStyle: {
      photography: '温暖的色调，自然光线，生活化场景，人文关怀',
      layout: '平衡温馨的布局，大量绿色元素，温暖的氛围',
      typography: 'Sodo Sans 字体，友好易读的风格'
    },
    competitiveAdvantage: ['品牌认知度', '店铺体验', '产品多样性', '会员系统'],
    recommendedImageStyles: [
      '温暖的店内场景',
      '手工制作过程',
      '咖啡特写 - 拉花艺术',
      '社交聚会场景',
      '舒适的阅读时光'
    ],
    metadata: {
      title: 'Starbucks Coffee Company',
      description: 'More than just great coffee',
      language: 'en-US'
    },
    socialMediaTone: '温暖友好、分享美好时刻、展示社区连接',
    marketingFocus: ['客户体验', '产品品质', '社会责任', '季节饮品']
  }
};

export function BrandAnalysisPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<BrandAnalysisResult | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  const analysisSteps = [
    { label: '正在连接网站...', progress: 20 },
    { label: '抓取网站内容（Firecrawl）', progress: 40 },
    { label: '提取品牌元素...', progress: 60 },
    { label: 'AI 深度分析（DeepSeek）', progress: 80 },
    { label: '生成品牌报告...', progress: 100 }
  ];

  const quickExamples = [
    { name: 'Apple', url: 'https://apple.com', icon: '🍎' },
    { name: 'Nike', url: 'https://nike.com', icon: '👟' },
    { name: 'Starbucks', url: 'https://starbucks.com', icon: '☕' }
  ];

  const handleAnalyze = async (inputUrl?: string) => {
    const targetUrl = inputUrl || url;
    
    if (!targetUrl) {
      toast.error('请输入网站 URL');
      return;
    }

    // Validate URL
    try {
      new URL(targetUrl);
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
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Get mock result based on URL
    let mockResult: BrandAnalysisResult;
    if (mockBrands[targetUrl as keyof typeof mockBrands]) {
      mockResult = mockBrands[targetUrl as keyof typeof mockBrands];
    } else {
      // Default mock result
      mockResult = {
        brandName: '品牌名称',
        website: targetUrl,
        productCategory: ['产品类别 1', '产品类别 2'],
        brandTone: '专业、现代、创新',
        brandVoice: '自信、专业、易于理解',
        colors: {
          primary: '#3B82F6',
          secondary: ['#8B5CF6', '#EC4899', '#10B981']
        },
        styleKeywords: ['现代', '专业', '创新', '简洁', '用户友好'],
        targetAudience: '25-40岁的专业人士',
        audienceAge: '25-40岁',
        audienceIncome: '中等收入',
        brandPersonality: ['专业', '创新', '可靠', '友好'],
        contentThemes: ['产品创新', '用户体验', '行业领导', '客户成功'],
        visualStyle: {
          photography: '现代专业的产品摄影，清晰的背景',
          layout: '简洁明了的布局，良好的视觉层次',
          typography: '现代无衬线字体，清晰易读'
        },
        competitiveAdvantage: ['产品质量', '用户体验', '创新能力'],
        recommendedImageStyles: [
          '专业产品摄影',
          '现代办公场景',
          '用户使用场景',
          '简洁产品特写'
        ],
        metadata: {
          title: '品牌网站',
          description: '品牌描述',
          language: 'en-US'
        },
        socialMediaTone: '专业且易于理解',
        marketingFocus: ['产品特性', '用户价值', '品牌故事']
      };
    }

    setResult(mockResult);
    setIsAnalyzing(false);
    setSelectedTab('overview');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl">
                  <Sparkles className="size-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-slate-900">品牌智能分析</h1>
                <p className="text-sm text-slate-600">AI-Powered Brand Analysis</p>
              </div>
            </div>
            {result && (
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
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        {!result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700">
              <Sparkles className="size-4" />
              <span className="text-sm">Powered by Firecrawl + DeepSeek AI</span>
            </div>
            <h2 className="text-4xl md:text-6xl text-slate-900 max-w-3xl mx-auto leading-tight">
              深度解析品牌
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                洞察市场机会
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              输入任何品牌网站 URL，AI 自动分析品牌定位、视觉风格、目标受众、竞争优势等 20+ 维度数据
            </p>
          </motion.div>
        )}

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto border-2 shadow-xl mb-12">
          <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-fuchsia-50">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-6 text-violet-600" />
              输入品牌网站 URL
            </CardTitle>
            <CardDescription className="text-base">
              支持任何公开访问的品牌官网，系统将自动抓取并进行深度分析
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-base">网站地址</Label>
              <div className="flex gap-3">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-lg"
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !url}
                  className="gap-2 h-12 px-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Examples */}
            {!isAnalyzing && !result && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">快速尝试：</p>
                <div className="grid grid-cols-3 gap-3">
                  {quickExamples.map((example, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setUrl(example.url);
                        handleAnalyze(example.url);
                      }}
                      className="p-4 rounded-xl border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{example.icon}</div>
                        <div className="flex-1">
                          <div className="text-slate-900 group-hover:text-violet-900">
                            {example.name}
                          </div>
                          <div className="text-xs text-slate-500">{example.url}</div>
                        </div>
                        <ChevronRight className="size-5 text-slate-400 group-hover:text-violet-600" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Progress */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-6 border-t"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900">
                        {analysisSteps[analysisStep].label}
                      </span>
                      <span className="text-violet-600">
                        {analysisSteps[analysisStep].progress}%
                      </span>
                    </div>
                    <Progress value={analysisSteps[analysisStep].progress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {analysisSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`
                          p-3 rounded-xl text-center transition-all
                          ${index < analysisStep
                            ? 'bg-green-100 border-2 border-green-300'
                            : index === analysisStep
                              ? 'bg-violet-100 border-2 border-violet-300'
                              : 'bg-slate-100 border-2 border-slate-200'
                          }
                        `}
                      >
                        {index < analysisStep ? (
                          <CheckCircle2 className="size-6 mx-auto text-green-600" />
                        ) : index === analysisStep ? (
                          <Loader2 className="size-6 mx-auto text-violet-600 animate-spin" />
                        ) : (
                          <div className="size-6 mx-auto rounded-full border-2 border-slate-400" />
                        )}
                        <p className="text-xs mt-2 text-slate-600">{step.label.split('...')[0]}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="space-y-6"
            >
              {/* Brand Header */}
              <Card className="border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-4xl text-slate-900">{result.brandName}</h2>
                        <Badge className="gap-1 bg-green-100 text-green-700 border-green-300">
                          <CheckCircle2 className="size-3" />
                          已分析
                        </Badge>
                      </div>
                      <p className="text-lg text-slate-600">{result.metadata.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Globe className="size-4" />
                        {result.website}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600 mb-1">分析完成度</div>
                      <div className="text-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        98%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="size-4 text-violet-600" />
                        <span className="text-sm text-slate-600">产品类别</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.productCategory.slice(0, 2).map((cat, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-fuchsia-600" />
                        <span className="text-sm text-slate-600">目标年龄</span>
                      </div>
                      <div className="text-slate-900">{result.audienceAge}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="size-4 text-green-600" />
                        <span className="text-sm text-slate-600">收入水平</span>
                      </div>
                      <div className="text-slate-900">{result.audienceIncome}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/80 border border-violet-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="size-4 text-amber-600" />
                        <span className="text-sm text-slate-600">语言</span>
                      </div>
                      <div className="text-slate-900">{result.metadata.language}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for detailed analysis */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                  <TabsTrigger value="overview" className="gap-2 py-3">
                    <BarChart3 className="size-4" />
                    <span className="hidden md:inline">总览</span>
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="gap-2 py-3">
                    <Palette className="size-4" />
                    <span className="hidden md:inline">视觉风格</span>
                  </TabsTrigger>
                  <TabsTrigger value="audience" className="gap-2 py-3">
                    <Target className="size-4" />
                    <span className="hidden md:inline">受众分析</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="gap-2 py-3">
                    <MessageSquare className="size-4" />
                    <span className="hidden md:inline">内容策略</span>
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="gap-2 py-3">
                    <Lightbulb className="size-4" />
                    <span className="hidden md:inline">创作建议</span>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Brand Tone */}
                    <Card className="border-2 hover:border-violet-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-violet-600" />
                          品牌调性
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-2xl text-slate-900 mb-3">{result.brandTone}</p>
                          <p className="text-slate-600">{result.brandVoice}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-slate-600">品牌性格</div>
                          <div className="flex flex-wrap gap-2">
                            {result.brandPersonality.map((trait, index) => (
                              <Badge
                                key={index}
                                className="bg-violet-100 text-violet-800 border-violet-200"
                              >
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitive Advantage */}
                    <Card className="border-2 hover:border-green-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Award className="size-5 text-green-600" />
                          竞争优势
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.competitiveAdvantage.map((advantage, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                              <Star className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-900">{advantage}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Style Keywords */}
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="size-5 text-fuchsia-600" />
                        风格关键词
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {result.styleKeywords.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-lg py-2 px-4 border-2 hover:bg-fuchsia-50 hover:border-fuchsia-300 cursor-pointer transition-colors"
                            onClick={() => copyToClipboard(keyword)}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Visual Tab */}
                <TabsContent value="visual" className="space-y-6 mt-6">
                  {/* Colors */}
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="size-5 text-purple-600" />
                        品牌色彩方案
                      </CardTitle>
                      <CardDescription>
                        从网站中提取的主要颜色，可直接用于内容创作
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">主色调</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.colors.primary)}
                          >
                            <Copy className="size-3 mr-1" />
                            复制
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className="size-20 rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: result.colors.primary }}
                            onClick={() => copyToClipboard(result.colors.primary)}
                          />
                          <div>
                            <div className="text-2xl text-slate-900 mb-1">
                              {result.colors.primary}
                            </div>
                            <p className="text-sm text-slate-600">
                              品牌主色，用于关键元素和 CTA
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-slate-600">辅助色彩</div>
                        <div className="grid grid-cols-3 gap-4">
                          {result.colors.secondary.map((color, index) => (
                            <div
                              key={index}
                              className="space-y-2 p-4 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-purple-300 transition-colors cursor-pointer"
                              onClick={() => copyToClipboard(color)}
                            >
                              <div
                                className="aspect-square rounded-xl border-2 border-white shadow-lg hover:scale-105 transition-transform"
                                style={{ backgroundColor: color }}
                              />
                              <div className="text-center">
                                <div className="text-sm text-slate-900">{color}</div>
                                <div className="text-xs text-slate-500">点击复制</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {result.colors.accent && (
                        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                          <div className="flex items-center gap-3">
                            <div
                              className="size-12 rounded-xl border-2 border-white shadow-lg"
                              style={{ backgroundColor: result.colors.accent }}
                            />
                            <div>
                              <div className="text-sm text-slate-600">强调色</div>
                              <div className="text-slate-900">{result.colors.accent}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Visual Style */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ImageIcon className="size-5 text-blue-600" />
                          摄影风格
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-700">{result.visualStyle.photography}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="size-5 text-green-600" />
                          布局设计
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-700">{result.visualStyle.layout}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="size-5 text-purple-600" />
                          字体排版
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-700">{result.visualStyle.typography}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Audience Tab */}
                <TabsContent value="audience" className="space-y-6 mt-6">
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="size-5 text-blue-600" />
                        目标受众画像
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 rounded-xl bg-blue-50 border-2 border-blue-200">
                        <p className="text-xl text-slate-900">{result.targetAudience}</p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="size-5 text-violet-600" />
                            <span className="text-sm text-slate-600">年龄段</span>
                          </div>
                          <div className="text-2xl text-slate-900">{result.audienceAge}</div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="size-5 text-green-600" />
                            <span className="text-sm text-slate-600">收入水平</span>
                          </div>
                          <div className="text-2xl text-slate-900">{result.audienceIncome}</div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="size-5 text-fuchsia-600" />
                            <span className="text-sm text-slate-600">品牌偏好</span>
                          </div>
                          <div className="text-2xl text-slate-900">品质优先</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="size-5 text-amber-600" />
                          内容主题
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.contentThemes.map((theme, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-amber-600" />
                                <span className="text-slate-900">{theme}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="size-5 text-purple-600" />
                          社交媒体调性
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg text-slate-900 mb-4">{result.socialMediaTone}</p>
                        <div className="space-y-2">
                          <div className="text-sm text-slate-600">营销重点</div>
                          <div className="flex flex-wrap gap-2">
                            {result.marketingFocus.map((focus, index) => (
                              <Badge key={index} variant="secondary">
                                {focus}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6 mt-6">
                  <Card className="border-2 border-violet-200">
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="size-5 text-violet-600" />
                        推荐图片/视频风格
                      </CardTitle>
                      <CardDescription>
                        基于品牌分析，为您推荐最适合的创作风格
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {result.recommendedImageStyles.map((style, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl bg-gradient-to-br from-white to-violet-50 border-2 border-violet-200 hover:border-violet-400 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="size-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="size-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-slate-900 mb-1 group-hover:text-violet-900">
                                  {style}
                                </div>
                                <div className="text-xs text-slate-600">
                                  点击使用此风格生成内容
                                </div>
                              </div>
                              <ChevronRight className="size-5 text-slate-400 group-hover:text-violet-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CTA */}
                  <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="text-2xl">立即使用品牌分析生成内容</h3>
                          <p className="text-violet-100">
                            基于 AI 分析结果，自动生成符合品牌风格的产品图片和视频
                          </p>
                        </div>
                        <Button
                          size="lg"
                          className="bg-white text-violet-600 hover:bg-slate-50 shadow-xl gap-2"
                        >
                          <Sparkles className="size-5" />
                          开始创作
                          <ChevronRight className="size-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
