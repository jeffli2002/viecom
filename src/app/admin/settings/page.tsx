'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="container-base py-12 space-y-6">
      <h1 className="h2-section">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body">Settings page - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
