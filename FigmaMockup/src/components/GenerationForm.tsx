import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Loader2, Image, Video, Wand2 } from 'lucide-react';
import type { GenerationOutput, GenerationType } from '../App';

interface GenerationFormProps {
  onGenerate: (output: GenerationOutput) => void;
}

export function GenerationForm({ onGenerate }: GenerationFormProps) {
  const [generationType, setGenerationType] = useState<GenerationType>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form fields
  const [productName, setProductName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState([80]);
  const [enhance, setEnhance] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockOutput: GenerationOutput = {
      id: Date.now().toString(),
      type: generationType,
      title: productName || `${generationType === 'image' ? 'Product Image' : 'Product Video'}`,
      prompt: prompt,
      url: '', // Will be set based on type below
      timestamp: new Date(),
      settings: {
        style,
        aspectRatio,
        quality: quality[0],
        enhance
      }
    };

    // Set appropriate mock URL based on generation type
    if (generationType === 'image') {
      mockOutput.url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
    } else {
      mockOutput.url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';
    }

    onGenerate(mockOutput);
    setIsGenerating(false);
    
    // Reset form
    setProductName('');
    setPrompt('');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generate AI Content</CardTitle>
        <CardDescription>
          Create professional product images or videos for your e-commerce store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Tabs value={generationType} onValueChange={(v) => setGenerationType(v as GenerationType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="gap-2">
                  <Image className="size-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2">
                  <Video className="size-4" />
                  Video
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g., Wireless Headphones"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Description / Prompt</Label>
            <Textarea
              id="prompt"
              placeholder={generationType === 'image' 
                ? "e.g., Modern wireless headphones on a clean white background with soft shadows, product photography, high quality, professional lighting"
                : "e.g., Smooth rotation of wireless headphones showcasing all angles, professional studio lighting, clean background"}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger id="aspectRatio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quality</Label>
              <span className="text-sm text-slate-600">{quality[0]}%</span>
            </div>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={50}
              max={100}
              step={10}
            />
          </div>

          {/* AI Enhancement */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enhance">AI Enhancement</Label>
              <p className="text-sm text-slate-600">
                Apply automatic upscaling and quality improvements
              </p>
            </div>
            <Switch
              id="enhance"
              checked={enhance}
              onCheckedChange={setEnhance}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gap-2"
            size="lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Generate {generationType === 'image' ? 'Image' : 'Video'}
              </>
            )}
          </Button>

          {/* API Note */}
          <p className="text-sm text-slate-500 text-center">
            Note: Connect your AI API keys (OpenAI, Stability AI, Runway ML, etc.) in your backend to enable real generation
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
