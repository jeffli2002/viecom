import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/Header';
import { GenerationForm } from './components/GenerationForm';
import { TemplateGallery } from './components/TemplateGallery';
import { OutputGallery } from './components/OutputGallery';
import { DailyCheckIn } from './components/DailyCheckIn';
import { BrandAnalysis } from './components/BrandAnalysis';
import { BrandAnalysisPage } from './components/BrandAnalysisPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { toast } from 'sonner@2.0.3';

export type GenerationType = 'image' | 'video';

export interface GenerationOutput {
  id: string;
  type: GenerationType;
  title: string;
  prompt: string;
  url: string;
  timestamp: Date;
  settings: Record<string, any>;
}

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [showBrandAnalysis, setShowBrandAnalysis] = useState(false);
  const [outputs, setOutputs] = useState<GenerationOutput[]>([]);
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerate = (output: GenerationOutput) => {
    setOutputs([output, ...outputs]);
    setActiveTab('gallery');
  };

  const handleCheckIn = (credits: number) => {
    toast.success(`Earned ${credits} credits!`, {
      description: credits > 2 ? '🎉 7-day streak bonus!' : 'Come back tomorrow for more!'
    });
  };

  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  // Show standalone Brand Analysis Page
  if (showBrandAnalysis) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            onClick={() => setShowBrandAnalysis(false)}
          >
            ← 返回主应用
          </Button>
        </div>
        <BrandAnalysisPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Daily Check-in Widget */}
        <div className="mb-8 max-w-2xl mx-auto">
          <DailyCheckIn onCheckIn={handleCheckIn} />
        </div>

        {/* Quick Access to Brand Analysis */}
        <div className="mb-6 max-w-2xl mx-auto">
          <Button
            onClick={() => setShowBrandAnalysis(true)}
            variant="outline"
            className="w-full gap-2 py-6 border-2 border-violet-200 hover:bg-violet-50"
          >
            🔍 打开品牌分析完整页面
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analysis">Brand Analysis</TabsTrigger>
            <TabsTrigger value="gallery">Gallery ({outputs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-8">
            <GenerationForm onGenerate={handleGenerate} />
          </TabsContent>

          <TabsContent value="templates" className="mt-8">
            <TemplateGallery onSelectTemplate={(template) => {
              setActiveTab('generate');
            }} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-8">
            <BrandAnalysis />
          </TabsContent>

          <TabsContent value="gallery" className="mt-8">
            <OutputGallery outputs={outputs} onDelete={(id) => {
              setOutputs(outputs.filter(o => o.id !== id));
            }} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}