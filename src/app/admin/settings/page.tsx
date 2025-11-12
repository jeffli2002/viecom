'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Settings page - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

