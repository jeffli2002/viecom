'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AdminTopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search email..."
            className="pl-10 w-64"
          />
        </div>
        
        <Button onClick={handleLogout} variant="destructive" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

