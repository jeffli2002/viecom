'use client';

import { useState } from 'react';

interface UseUpgradePromptReturn {
  showUpgradePrompt: boolean;
  openUpgradePrompt: () => void;
  closeUpgradePrompt: () => void;
}

/**
 * Hook for managing upgrade prompt visibility
 * Use this when user has insufficient credits or quota
 */
export function useUpgradePrompt(): UseUpgradePromptReturn {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const openUpgradePrompt = () => {
    setShowUpgradePrompt(true);
  };

  const closeUpgradePrompt = () => {
    setShowUpgradePrompt(false);
  };

  return {
    showUpgradePrompt,
    openUpgradePrompt,
    closeUpgradePrompt,
  };
}
