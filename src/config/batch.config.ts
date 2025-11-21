/**
 * 批量处理配置
 * 双层架构：用户友好的简单配置 + 底层智能调整
 */

export interface QualityConfig {
  timeout: number;        // 轮询超时（毫秒）
  interval: number;       // 轮询间隔（毫秒）
  adaptivePolling?: {
    enabled: boolean;
    stages: Array<{ until: number; interval: number }>;
  };
}

export interface InternalConfig {
  // 基于模型类型的并发调整
  modelConcurrency: {
    'sora-2': number;
    'sora-2-pro': number;
  };
  
  // 基于分辨率的权重（乘数）
  resolutionWeight: {
    '720p': number;
    '1080p': number;
  };
  
  // 基于时长的权重（乘数）
  durationWeight: {
    10: number;
    15: number;
  };
  
  // 轮询配置
  polling: {
    '720p': QualityConfig;
    '1080p': QualityConfig;
  };
}

export interface VideoBatchConfig {
  // 用户看到的配置（简单）
  userFacing: {
    concurrency: number;    // 并发数
    batchSize: number;      // 批次大小
    description: string;    // 描述
  };
  
  // 底层实际使用的配置（智能）
  internal: InternalConfig;
}

/**
 * 批量处理配置
 */
export const BATCH_CONFIG: Record<string, VideoBatchConfig> = {
  free: {
    userFacing: {
      concurrency: 1,
      batchSize: 3,
      description: 'Free用户：每批3个任务，单个处理',
    },
    
    internal: {
      modelConcurrency: {
        'sora-2': 1,
        'sora-2-pro': 1,
      },
      
      resolutionWeight: {
        '720p': 1.0,
        '1080p': 1.0,
      },
      
      durationWeight: {
        10: 1.0,
        15: 1.0,
      },
      
      polling: {
        '720p': {
          timeout: 300000,      // 5分钟
          interval: 3000,       // 3秒
        },
        '1080p': {
          timeout: 900000,      // 15分钟
          interval: 5000,       // 5秒
        },
      },
    },
  },
  
  pro: {
    userFacing: {
      concurrency: 3,
      batchSize: 15,
      description: 'Pro套餐：每批15个任务，最多3个同时进行',
    },
    
    internal: {
      modelConcurrency: {
        'sora-2': 4,           // Sora 2 实际可以4个并发
        'sora-2-pro': 3,       // Sora 2 Pro 保守3个
      },
      
      resolutionWeight: {
        '720p': 1.0,           // 720P不降速
        '1080p': 0.65,         // 1080P降速35%（因为7-13分钟 vs 2-3分钟）
      },
      
      durationWeight: {
        10: 1.3,               // 10秒视频快30%
        15: 1.0,               // 15秒视频基准
      },
      
      polling: {
        '720p': {
          timeout: 300000,     // 5分钟
          interval: 3000,      // 3秒
          adaptivePolling: {
            enabled: true,
            stages: [
              { until: 90000, interval: 3000 },   // 前1.5分钟：3秒
              { until: 180000, interval: 5000 },  // 1.5-3分钟：5秒
              { until: 999999, interval: 8000 },  // 3分钟后：8秒
            ],
          },
        },
        '1080p': {
          timeout: 900000,     // 15分钟
          interval: 5000,      // 5秒
          adaptivePolling: {
            enabled: true,
            stages: [
              { until: 300000, interval: 5000 },   // 前5分钟：5秒
              { until: 600000, interval: 8000 },   // 5-10分钟：8秒
              { until: 999999, interval: 12000 },  // 10分钟后：12秒
            ],
          },
        },
      },
    },
  },
  
  proplus: {
    userFacing: {
      concurrency: 5,
      batchSize: 25,
      description: 'Pro+套餐：每批25个任务，最多5个同时进行',
    },
    
    internal: {
      modelConcurrency: {
        'sora-2': 7,           // Sora 2 实际可以7个并发
        'sora-2-pro': 5,       // Sora 2 Pro 保守5个
      },
      
      resolutionWeight: {
        '720p': 1.0,
        '1080p': 0.65,
      },
      
      durationWeight: {
        10: 1.3,
        15: 1.0,
      },
      
      polling: {
        '720p': {
          timeout: 300000,
          interval: 3000,
          adaptivePolling: {
            enabled: true,
            stages: [
              { until: 90000, interval: 3000 },
              { until: 180000, interval: 5000 },
              { until: 999999, interval: 8000 },
            ],
          },
        },
        '1080p': {
          timeout: 900000,
          interval: 5000,
          adaptivePolling: {
            enabled: true,
            stages: [
              { until: 300000, interval: 5000 },
              { until: 600000, interval: 8000 },
              { until: 999999, interval: 12000 },
            ],
          },
        },
      },
    },
  },
};

/**
 * 获取用户套餐的批量配置
 */
export function getBatchConfig(userPlan: string): VideoBatchConfig {
  const plan = ['pro', 'proplus'].includes(userPlan) ? userPlan : 'free';
  return BATCH_CONFIG[plan];
}

/**
 * 计算实际并发数（智能调整）
 */
export function calculateActualConcurrency(
  userPlan: 'free' | 'pro' | 'proplus',
  model: 'sora-2' | 'sora-2-pro',
  resolution: '720p' | '1080p',
  duration: 10 | 15
): number {
  const config = BATCH_CONFIG[userPlan];
  
  // 基础并发
  let concurrency = config.internal.modelConcurrency[model];
  
  // 应用分辨率权重
  concurrency *= config.internal.resolutionWeight[resolution];
  
  // 应用时长权重
  concurrency *= config.internal.durationWeight[duration];
  
  // 向下取整并确保至少1个
  return Math.max(1, Math.floor(concurrency));
}

/**
 * 获取轮询配置（支持智能间隔）
 */
export function getPollingConfig(
  userPlan: 'free' | 'pro' | 'proplus',
  resolution: '720p' | '1080p',
  elapsedMs?: number
): { timeout: number; interval: number } {
  const config = BATCH_CONFIG[userPlan];
  const pollConfig = config.internal.polling[resolution];
  
  // 如果启用了自适应轮询且提供了已用时间
  if (pollConfig.adaptivePolling?.enabled && elapsedMs !== undefined) {
    const stage = pollConfig.adaptivePolling.stages.find(
      s => elapsedMs < s.until
    );
    if (stage) {
      return {
        timeout: pollConfig.timeout,
        interval: stage.interval,
      };
    }
  }
  
  return {
    timeout: pollConfig.timeout,
    interval: pollConfig.interval,
  };
}
