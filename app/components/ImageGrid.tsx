import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageGridProps {
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ImageGrid({ images, selectedIndex, onSelect }: ImageGridProps) {
  // Function to format image source correctly
  const formatImageSrc = (imageData: string): string => {
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
            src={formatImageSrc(image)}
            alt={`Generated logo variation ${index + 1}`}
            fill
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );
}