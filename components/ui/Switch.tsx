import { Switch as RNSwitch } from "react-native";
import { brand } from "../../lib/theme/brand";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: brand.dark.border, true: brand.green[600] }}
      thumbColor={brand.white}
    />
  );
}
