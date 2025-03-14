import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet";
import { History } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export interface LogoHistory {
  id: string;
  timestamp: string;
  images: string[];
  settings: {
    companyName: string;
    layout: string;
    style: string;
    primaryColor: string;
    backgroundColor: string;
    additionalInfo?: string;
  };
  companyName: string;
  layout: string;
  style: string;
  primaryColor: string;
  backgroundColor: string;
  additionalInfo?: string;
}

interface HistoryDrawerProps {
  onSelectHistory: (history: LogoHistory) => void;
}

export function HistoryDrawer({ onSelectHistory }: HistoryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const logoHistory = useQuery(api.logoHistory.list);
  
  // Function to format image source correctly
  const formatImageSrc = (imageData: string): string => {
    if (!imageData) return "/placeholder.svg";
    
    // Check if the image is already a URL (starts with http or https)
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return imageData;
    }
    
    // Check if it's a base64 string in JSON format (starts with [" and contains 4QC8R)
    if (imageData.startsWith('["') && imageData.includes('4QC8R')) {
      try {
        // Try to extract the base64 data from the string format
        const cleanedData = imageData.replace(/\[|"|\]/g, '');
        return `data:image/png;base64,${cleanedData}`;
      } catch (error) {
        console.error('Error formatting image data:', error);
        return '/placeholder.svg'; // Fallback to placeholder
      }
    }
    
    // If it's already a properly formatted base64 string
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // Assume it's a base64 string without the data:image prefix
    return `data:image/png;base64,${imageData}`;
  };
  
  const handleSelectHistory = (item: LogoHistory) => {
    onSelectHistory(item);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-gray-900 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Logo History</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {logoHistory && logoHistory.length > 0 ? (
            logoHistory.map((item) => (
              <div 
                key={item._id} 
                className="border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => handleSelectHistory({
                  id: item._id,
                  timestamp: String(item.timestamp),
                  images: item.images,
                  settings: {
                    companyName: item.companyName,
                    layout: item.layout,
                    style: item.style,
                    primaryColor: item.primaryColor,
                    backgroundColor: item.backgroundColor,
                    additionalInfo: item.additionalInfo,
                  },
                  companyName: item.companyName,
                  layout: item.layout,
                  style: item.style,
                  primaryColor: item.primaryColor,
                  backgroundColor: item.backgroundColor,
                  additionalInfo: item.additionalInfo
                })}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">{item.companyName}</h3>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {item.images.map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-md">
                      <Image
                        src={formatImageSrc(image)}
                        alt={`Generated logo ${index + 1}`}
                        width={100}
                        height={100}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-700 px-2 py-1 text-xs">
                    {item.style}
                  </span>
                  <span className="rounded-full bg-gray-700 px-2 py-1 text-xs">
                    {item.layout}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              No logo history found
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}