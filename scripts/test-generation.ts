/**
 * Test script for image generation only
 * Tests single and batch image generation using KIE API
 *
 * Usage:
 *   npx tsx scripts/test-generation.ts
 *   or
 *   npm run test:generation
 */

import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_MODE_HEADER = { 'x-test-mode': 'true' };

// Wait for server to be ready
async function waitForServer(maxAttempts = 20, delay = 2000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Try root path as fallback
      try {
        const response = await fetch(BASE_URL, {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        if (response.status < 500) {
          console.log('✅ Server is ready!');
          return true;
        }
      } catch (e) {
        // Server not ready yet
      }
    }

    if (i < maxAttempts - 1) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log('❌ Server not ready. Please start it with: pnpm dev');
  return false;
}

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
  duration?: number;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const data = await testFn();
    const duration = Date.now() - start;
    results.push({ name, success: true, data, duration });
    console.log(`✅ Success (${duration}ms)`);
    if (data) {
      console.log(`   Result:`, JSON.stringify(data, null, 2).substring(0, 200));
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ name, success: false, error: error.message, duration });
    console.log(`❌ Failed (${duration}ms): ${error.message}`);
  }
}

// Test 1: Prompt Enhancement (DeepSeek)
async function testPromptEnhancement() {
  const response = await fetch(`${BASE_URL}/api/v1/enhance-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TEST_MODE_HEADER,
    },
    body: JSON.stringify({
      prompt: 'A beautiful sunset over the ocean',
      context: 'image',
      productSellingPoints: ['Eco-friendly', 'Premium quality'],
      styleKeywords: ['Modern', 'Minimalist'],
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = `API error: ${JSON.stringify(error)}`;
      } catch (e) {
        // Ignore JSON parse error
      }
    } else {
      const text = await response.text();
      errorMessage = `API error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

// Test 2: Single Image Generation - Text to Image (KIE API)
async function testSingleImageT2I() {
  const response = await fetch(`${BASE_URL}/api/v1/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TEST_MODE_HEADER,
    },
    body: JSON.stringify({
      prompt:
        'A serene Japanese garden with cherry blossoms in full bloom, koi fish swimming in a crystal-clear pond',
      model: 'nano-banana',
      aspect_ratio: '1:1',
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = `API error: ${JSON.stringify(error)}`;
      } catch (e) {
        // Ignore JSON parse error
      }
    } else {
      const text = await response.text();
      errorMessage = `API error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

// Test 3: Single Image Generation - Image to Image (KIE API)
async function testSingleImageI2I() {
  // First, we need a base image URL for I2I
  // For testing, we'll use a placeholder or generate one first
  const baseImageUrl = 'https://via.placeholder.com/1024x1024.jpg';

  const response = await fetch(`${BASE_URL}/api/v1/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TEST_MODE_HEADER,
    },
    body: JSON.stringify({
      prompt: 'Transform this image into a watercolor painting style, soft pastel colors',
      model: 'nano-banana',
      image: baseImageUrl,
      aspect_ratio: '1:1',
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = `API error: ${JSON.stringify(error)}`;
      } catch (e) {
        // Ignore JSON parse error
      }
    } else {
      const text = await response.text();
      errorMessage = `API error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

// Test 4: Single Video Generation - Text to Video (KIE API)
async function testSingleVideoT2V() {
  const response = await fetch(`${BASE_URL}/api/v1/generate-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TEST_MODE_HEADER,
    },
    body: JSON.stringify({
      prompt:
        'A peaceful morning scene with birds flying over a calm lake, gentle sunlight filtering through trees',
      mode: 't2v',
      aspect_ratio: '16:9',
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = `API error: ${JSON.stringify(error)}`;
      } catch (e) {
        // Ignore JSON parse error
      }
    } else {
      const text = await response.text();
      errorMessage = `API error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

// Test 5: Single Video Generation - Image to Video (KIE API)
async function testSingleVideoI2V() {
  const baseImageUrl = 'https://via.placeholder.com/1024x1024.jpg';

  const response = await fetch(`${BASE_URL}/api/v1/generate-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...TEST_MODE_HEADER,
    },
    body: JSON.stringify({
      prompt: 'Animate this image with gentle movement, birds flying in the background',
      mode: 'i2v',
      image: baseImageUrl,
      aspect_ratio: '16:9',
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `API error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = `API error: ${JSON.stringify(error)}`;
      } catch (e) {
        // Ignore JSON parse error
      }
    } else {
      const text = await response.text();
      errorMessage = `API error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

// Test 6: Batch Image Generation
async function testBatchImageGeneration() {
  // Create a test CSV file
  const csvContent = `prompt,generationMode,model,aspectRatio
"A beautiful sunset over mountains","t2i","nano-banana","16:9"
"A modern office space with plants","t2i","nano-banana","1:1"
"A cozy coffee shop interior","t2i","nano-banana","4:3"`;

  // Use formdata-node for Node.js compatibility
  const { FormData: NodeFormData } = await import('formdata-node');
  const { Blob } = await import('formdata-node');

  const csvFile = new Blob([csvContent], { type: 'text/csv' });
  const formData = new NodeFormData();
  formData.set('file', csvFile, 'test-batch-images.csv');
  formData.set('generationType', 'image');
  formData.set('mode', 't2i');

  const response = await fetch(`${BASE_URL}/api/v1/workflow/batch`, {
    method: 'POST',
    headers: {
      ...TEST_MODE_HEADER,
      // FormData will set Content-Type automatically with boundary
    },
    body: formData as any, // formdata-node is compatible with fetch
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();

  // Poll for job status
  if (result.data?.jobId) {
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 5 minutes

    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(
        `${BASE_URL}/api/v1/workflow/status/${result.data.jobId}`,
        {
          headers: TEST_MODE_HEADER,
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.status;
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error('Batch job timeout');
        }
      } else {
        throw new Error('Failed to get batch job status');
      }
    }

    // Get results
    const resultsResponse = await fetch(
      `${BASE_URL}/api/v1/workflow/batch/${result.data.jobId}/results`,
      {
        headers: TEST_MODE_HEADER,
      }
    );

    if (resultsResponse.ok) {
      return await resultsResponse.json();
    }
  }

  return result;
}

// Test 7: Batch Video Generation
async function testBatchVideoGeneration() {
  // Create a test CSV file
  const csvContent = `prompt,generationMode,aspectRatio
"A peaceful forest scene with birds","t2v","16:9"
"A busy city street at night","t2v","16:9"`;

  // Use formdata-node for Node.js compatibility
  const { FormData: NodeFormData } = await import('formdata-node');
  const { Blob } = await import('formdata-node');

  const csvFile = new Blob([csvContent], { type: 'text/csv' });
  const formData = new NodeFormData();
  formData.set('file', csvFile, 'test-batch-videos.csv');
  formData.set('generationType', 'video');
  formData.set('mode', 't2v');

  const response = await fetch(`${BASE_URL}/api/v1/workflow/batch`, {
    method: 'POST',
    headers: {
      ...TEST_MODE_HEADER,
      // FormData will set Content-Type automatically with boundary
    },
    body: formData as any, // formdata-node is compatible with fetch
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();

  // Poll for job status (similar to batch images)
  if (result.data?.jobId) {
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 60;

    while (status === 'pending' || status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `${BASE_URL}/api/v1/workflow/status/${result.data.jobId}`,
        {
          headers: TEST_MODE_HEADER,
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.status;
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error('Batch job timeout');
        }
      }
    }

    const resultsResponse = await fetch(
      `${BASE_URL}/api/v1/workflow/batch/${result.data.jobId}/results`,
      {
        headers: TEST_MODE_HEADER,
      }
    );

    if (resultsResponse.ok) {
      return await resultsResponse.json();
    }
  }

  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Image Generation Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 KIE API Key: ${process.env.KIE_API_KEY ? '✅ Set' : '❌ Missing'}`);

  // Wait for server to be ready
  console.log('\n⏳ Checking if server is running...');
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('\n❌ Cannot proceed without server. Please start it with: pnpm dev');
    process.exit(1);
  }

  console.log('');

  // Test single image generation only
  await test('Single Image - Text to Image (KIE)', testSingleImageT2I);
  await test('Single Image - Image to Image (KIE)', testSingleImageI2I);

  // Test batch image generation
  await test('Batch Image Generation', testBatchImageGeneration);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Time: ${totalDuration}ms`);

  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name} (${result.duration}ms)`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Exit with error code if any test failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
