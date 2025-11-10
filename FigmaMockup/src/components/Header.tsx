import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900">E-Commerce AI Studio</h1>
              <p className="text-slate-600 text-sm">Generate stunning product images & videos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm text-slate-600">API Credits</span>
              <span className="text-slate-900">1,250 remaining</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
