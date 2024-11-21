'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface PendingLogoData {
  companyName: string;
  numberImages: string;
  layout: string;
  style: string;
  primaryColor: string;
  backgroundColor: string;
  additionalInfo: string;
  generatedLogoUrl?: string;
  timestamp: number;
}

export function useAuthInit() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const pendingLogoData = localStorage.getItem('pendingLogoData');
      if (pendingLogoData && userId) {
        const logoData = JSON.parse(pendingLogoData) as PendingLogoData;
        
        // Here you can process the logo data if needed
        console.log('Processing saved logo data:', logoData);
        
        // Clear the pending data
        localStorage.removeItem('pendingLogoData');
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [isLoaded, userId, router]);
} 