import { Copy, Download, Image, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { GenerationOutput } from '../App';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface OutputGalleryProps {
  outputs: GenerationOutput[];
  onDelete: (id: string) => void;
}

export function OutputGallery({ outputs, onDelete }: OutputGalleryProps) {
  const handleDownload = (output: GenerationOutput) => {
    toast.success(`Downloaded ${output.title}`);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copied to clipboard');
  };

  if (outputs.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <Image className="size-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-slate-900">No generations yet</h3>
          <p className="text-slate-600">Start generating images and videos to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Your Generations</h2>
          <p className="text-slate-600 text-sm">
            {outputs.length} {outputs.length === 1 ? 'item' : 'items'} generated
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outputs.map((output) => (
          <Card key={output.id} className="overflow-hidden group">
            <div className="aspect-square relative overflow-hidden bg-slate-100 card-image-container">
              <img
                src={output.url}
                alt={output.title}
                className="w-full h-full object-cover transition-transform duration-300"
              />
              <div className="absolute top-2 left-2">
                <Badge className="gap-1">
                  {output.type === 'image' ? (
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleDownload(output)}>
                  <Download className="size-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onDelete(output.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-slate-900 line-clamp-1">{output.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{output.prompt}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{output.settings.style}</span>
                <span>•</span>
                <span>{output.settings.aspectRatio}</span>
                <span>•</span>
                <span>{output.settings.quality}%</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => handleCopyPrompt(output.prompt)}
              >
                <Copy className="size-3" />
                Copy Prompt
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
