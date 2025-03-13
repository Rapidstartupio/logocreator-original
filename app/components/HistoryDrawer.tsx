import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet";
import { History } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

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
}

interface HistoryDrawerProps {
  onSelectHistory: (history: LogoHistory) => void;
}

export default function HistoryDrawer({ onSelectHistory }: HistoryDrawerProps) {
  const history = useQuery(api.logoHistory.list) || [];

  const transformToLogoHistory = (item: Doc<"logoHistory">): LogoHistory => ({
    id: item._id,
    timestamp: new Date(item.timestamp).toISOString(),
    images: item.images,
    settings: {
      companyName: item.companyName,
      layout: item.layout,
      style: item.style,
      primaryColor: item.primaryColor,
      backgroundColor: item.backgroundColor,
      additionalInfo: item.additionalInfo,
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white">
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] bg-[#2C2C2C] text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Logo History</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4">
          {history.length === 0 ? (
            <p className="text-gray-400">No history yet</p>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                className="group cursor-pointer rounded-lg border border-gray-700 p-4 hover:border-gray-500"
                onClick={() => onSelectHistory(transformToLogoHistory(item))}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{item.companyName}</h3>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {item.images.map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-md">
                      <Image
                        src={`data:image/png;base64,${image}`}
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 