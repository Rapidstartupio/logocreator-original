import { HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface NumberSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function NumberSelector({ value, onValueChange }: NumberSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium leading-none">Number</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>SELECT NUMBER OF IMAGES TO PRODUCE</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select number of images" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Single Image</SelectItem>
          <SelectItem value="3">Three Images</SelectItem>
          <SelectItem value="6">Six Images</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 