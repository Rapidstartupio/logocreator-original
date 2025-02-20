import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/app/components/ui/button';
import { MinimizeIcon, MaximizeIcon } from 'lucide-react';

interface BootcampPopupProps {
  isFirstGeneration: boolean;
}

export default function BootcampPopup({ isFirstGeneration }: BootcampPopupProps) {
  const [isMinimized, setIsMinimized] = useState(!isFirstGeneration);

  if (!isFirstGeneration && !isMinimized) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-[#2C2C2C] hover:bg-[#343434] text-white"
        >
          <MaximizeIcon size={16} />
          <span>Open Bootcamp Info</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] bg-[#2C2C2C] rounded-lg shadow-xl p-6 text-white">
      <Button
        onClick={() => setIsMinimized(true)}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-[#343434]"
      >
        <MinimizeIcon size={16} />
      </Button>

      <div className="space-y-4">
        <p className="text-sm text-blue-400 font-medium">Your Logo Is Created, What&apos;s Next?</p>
        
        <h2 className="text-xl font-bold leading-tight">
          Instantly Launch Your Business Together (Even if You&apos;re Starting From Zero)
        </h2>
        
        <p className="text-sm text-gray-300">
          Join Our Free Live Bootcamp Where We&apos;ll Help You Copy & Paste Your Way to a Complete Business Setup in 48 Minutes
        </p>

        <div className="relative w-full h-[200px] my-4">
          <Image
            src="/proof.jpeg"
            alt="Bootcamp proof"
            fill
            className="object-cover rounded-lg"
          />
        </div>

        <a 
          href="https://www.gohighlevel.com/highlevel-bootcamp?fp_ref=optimized&fp_sid=logox"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Join The Free Bootcamp Now
          </Button>
        </a>
      </div>
    </div>
  );
} 