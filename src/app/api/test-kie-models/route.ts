/**
 * KIE API 模型测试端点
 * 用于查询 KIE API 可用的模型列表
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const kieApiKey = process.env.KIE_API_KEY;

  if (!kieApiKey) {
    return NextResponse.json({
      success: false,
      error: 'KIE_API_KEY not configured',
    });
  }

  const results: {
    timestamp: string;
    tests: Array<Record<string, unknown>>;
  } = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // 测试 1: 查询用户信息（可能包含可用模型信息）
  try {
    console.log('[test-kie-models] Fetching user info...');
    const userInfoResponse = await fetch('https://api.kie.ai/api/v1/user/info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kieApiKey}`,
      },
    });

    const userInfoText = await userInfoResponse.text();
    let userInfoData: Record<string, unknown> = {};
    try {
      userInfoData = JSON.parse(userInfoText) as Record<string, unknown>;
    } catch (_e) {
      userInfoData = { rawText: userInfoText };
    }

    results.tests.push({
      name: 'User Info',
      status: userInfoResponse.ok ? 'PASS' : 'FAIL',
      data: userInfoData,
    });
  } catch (error: unknown) {
    results.tests.push({
      name: 'User Info',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // 测试 2: 尝试不同的模型名称创建任务
  const testModels = [
    'nano-banana',
    'nano-banana-text-to-image',
    'nano-banana-image-to-image',
    'nano-banana-t2i',
    'nano-banana-i2i',
  ];

  const modelTestResults: Array<Record<string, unknown>> = [];

  for (const model of testModels) {
    try {
      console.log(`[test-kie-models] Testing model: ${model}`);
      const testResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kieApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: {
            prompt: 'test prompt',
            aspect_ratio: 'square',
            quality: 'standard',
          },
        }),
      });

      const responseText = await testResponse.text();
      let responseData: Record<string, unknown> = {};
      try {
        responseData = JSON.parse(responseText) as Record<string, unknown>;
      } catch (_e) {
        responseData = { rawText: responseText };
      }

      modelTestResults.push({
        model,
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok,
        response: responseData,
      });
    } catch (error: unknown) {
      modelTestResults.push({
        model,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  results.tests.push({
    name: 'Model Name Tests',
    models: modelTestResults,
  });

  return NextResponse.json({
    success: true,
    results,
  });
}
