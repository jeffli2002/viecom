'use client';

import { Button } from '@/components/ui/button';
import { useCreemPayment } from '@/hooks/use-creem-payment';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreditPackPurchaseButtonProps {
  packId: string;
  credits: number;
  price: number;
  creemProductKey?: string;
  popular?: boolean;
}

export function CreditPackPurchaseButton({
  packId,
  credits: _credits,
  price: _price,
  creemProductKey,
  popular = false,
}: CreditPackPurchaseButtonProps) {
  const router = useRouter();
  const pathname = (usePathname() as string | null) ?? '';
  const { isAuthenticated } = useAuthStore();
  const { createCheckoutSession } = useCreemPayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    if (!creemProductKey) {
      toast.error('This credit pack is not yet available for purchase');
      console.error(`Credit pack ${packId} missing creemProductKey configuration`);
      return;
    }

    try {
      setIsProcessing(true);

      const result = await createCheckoutSession({
        productKey: creemProductKey,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
      });

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Credit pack purchase error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={isProcessing}
      className={`w-full ${
        popular ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-800 hover:bg-gray-900'
      }`}
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Purchase Now'
      )}
    </Button>
  );
}
