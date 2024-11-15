import * as RadioGroup from "@radix-ui/react-radio-group";
import InfoTooltip from "./InfoToolTip";

interface NumberSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const numbers = [
  { value: "1", icon: "/single.svg" },
  { value: "3", icon: "/triple.svg" },
  { value: "6", icon: "/six.svg" },
];

export function NumberSelector({ value, onValueChange }: NumberSelectorProps) {
  return (
    <div className="mb-6">
      <label className="mb-2 flex items-center text-xs font-bold uppercase text-[#6F6F6F]">
        Number
        <InfoTooltip content="SELECT NUMBER OF IMAGES TO PRODUCE" />
      </label>
      <RadioGroup.Root
        value={value}
        onValueChange={onValueChange}
        className="group/root grid grid-cols-3 gap-3"
      >
        {numbers.map((number) => (
          <RadioGroup.Item
            value={number.value}
            key={number.value}
            className="group text-[#6F6F6F] focus-visible:outline-none data-[state=checked]:text-white"
          >
            <div className="flex aspect-square w-full items-center justify-center rounded-md border border-transparent bg-[#343434] group-focus-visible:outline group-focus-visible:outline-offset-2 group-focus-visible:outline-gray-400 group-data-[state=checked]:border-white">
              <span className="text-2xl font-bold">{number.value}</span>
            </div>
            <span className="text-xs">
              {number.value === "1" ? "Single" : `${number.value} Images`}
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
} 