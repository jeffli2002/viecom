'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runBackfill = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/admin/backfill-purchases', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fixAmounts = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('/api/admin/fix-purchase-amounts', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
      <div className="space-y-4">
        <button
          type="button"
          onClick={runMigration}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Running...' : 'Create credit_pack_purchase Table'}
        </button>
        <button
          type="button"
          onClick={runBackfill}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 ml-4"
        >
          {loading ? 'Running...' : 'Backfill Credit Pack Purchases'}
        </button>
        <button
          type="button"
          onClick={fixAmounts}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 ml-4"
        >
          {loading ? 'Running...' : 'Fix Purchase Amounts (Fetch from Creem)'}
        </button>
      </div>
      {result && <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">{result}</pre>}
    </div>
  );
}
