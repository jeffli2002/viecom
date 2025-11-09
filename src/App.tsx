import { useState } from 'react';
import { GenerationForm } from './components/GenerationForm';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { OutputGallery } from './components/OutputGallery';
import { TemplateGallery } from './components/TemplateGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

export type GenerationType = 'image' | 'video';

export interface GenerationOutput {
  id: string;
  type: GenerationType;
  title: string;
  prompt: string;
  url: string;
  timestamp: Date;
  settings: Record<string, unknown>;
}

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [outputs, setOutputs] = useState<GenerationOutput[]>([]);
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerate = (output: GenerationOutput) => {
    setOutputs([output, ...outputs]);
    setActiveTab('gallery');
  };

  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="gallery">Gallery ({outputs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-8">
            <GenerationForm onGenerate={handleGenerate} />
          </TabsContent>

          <TabsContent value="templates" className="mt-8">
            <TemplateGallery
              onSelectTemplate={() => {
                setActiveTab('generate');
              }}
            />
          </TabsContent>

          <TabsContent value="gallery" className="mt-8">
            <OutputGallery
              outputs={outputs}
              onDelete={(id) => {
                setOutputs(outputs.filter((o) => o.id !== id));
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
