export type ShareRewardKey = 'copyLink' | 'publishViecom' | 'socialShare';

export interface ShareRewardConfigItem {
  credits: number;
  platform: string;
  referencePrefix: string;
}

export const SHARE_REWARD_CONFIG: Record<ShareRewardKey, ShareRewardConfigItem> = {
  copyLink: {
    credits: 0,
    platform: 'copy',
    referencePrefix: 'copy_link',
  },
  publishViecom: {
    credits: 2,
    platform: 'viecom_publish',
    referencePrefix: 'publish_viecom',
  },
  socialShare: {
    credits: 5,
    platform: 'social_share',
    referencePrefix: 'social_share',
  },
};
