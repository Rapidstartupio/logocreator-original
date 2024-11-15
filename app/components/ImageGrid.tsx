import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageGridProps {
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ImageGrid({ images, selectedIndex, onSelect }: ImageGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      images.length === 3 && "grid-cols-3",
      images.length === 6 && "grid-cols-3 grid-rows-2"
    )}>
      {images.map((image, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-lg border",
            index === selectedIndex && "ring-2 ring-primary"
          )}
        >
          <Image
            src={`data:image/png;base64,${image}`}
            alt={`Generated logo variation ${index + 1}`}
            fill
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );
} 