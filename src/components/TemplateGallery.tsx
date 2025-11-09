import { Image, Sparkles, Video } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'image' | 'video';
  category: string;
  prompt: string;
  thumbnail: string;
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Clean Product Shot',
    description: 'Professional product on white background',
    type: 'image',
    category: 'Product Photography',
    prompt:
      'Professional product photography on pure white background, centered, soft shadows, studio lighting, high resolution, commercial quality',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  },
  {
    id: '2',
    name: 'Lifestyle Scene',
    description: 'Product in real-life environment',
    type: 'image',
    category: 'Lifestyle',
    prompt:
      'Product in natural lifestyle setting, warm ambient lighting, cozy atmosphere, depth of field, lifestyle photography',
    thumbnail: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80',
  },
  {
    id: '3',
    name: '360° Product Spin',
    description: 'Rotating product showcase',
    type: 'video',
    category: 'Product Video',
    prompt:
      'Smooth 360-degree rotation of product, professional studio lighting, clean background, seamless loop, 4K quality',
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
  },
  {
    id: '4',
    name: 'Hero Banner',
    description: 'Eye-catching promotional image',
    type: 'image',
    category: 'Marketing',
    prompt:
      'Dramatic hero banner image, dynamic composition, bold lighting, high contrast, attention-grabbing, professional marketing photography',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  },
  {
    id: '5',
    name: 'Product Demo',
    description: 'Showcase product features',
    type: 'video',
    category: 'Product Video',
    prompt:
      'Product demonstration highlighting key features, close-up shots, smooth transitions, professional presentation, clear and engaging',
    thumbnail: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80',
  },
  {
    id: '6',
    name: 'Flat Lay',
    description: 'Top-down arranged composition',
    type: 'image',
    category: 'Product Photography',
    prompt:
      'Flat lay composition from above, products artfully arranged, minimalist aesthetic, balanced layout, soft natural lighting',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
  },
];

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-slate-900">Template Gallery</h2>
        <p className="text-slate-600">Start with pre-made templates optimized for e-commerce</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden group">
            <div className="aspect-video relative overflow-hidden bg-slate-100 card-image-container">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="gap-1">
                  {template.type === 'image' ? (
                    <>
                      <Image className="size-3" /> Image
                    </>
                  ) : (
                    <>
                      <Video className="size-3" /> Video
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {template.category}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" onClick={() => onSelectTemplate(template)}>
                <Sparkles className="size-4" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
