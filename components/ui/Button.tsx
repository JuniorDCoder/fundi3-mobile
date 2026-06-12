import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { brand, fonts } from "../../lib/theme/brand";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Button({ label, onPress, variant = "primary", loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? brand.green[400] : brand.dark.bg} />
      ) : (
        <Text style={[styles.label, variant === "ghost" ? styles.labelGhost : styles.labelSolid]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
  labelSolid: {
    color: brand.dark.bg,
  },
  labelGhost: {
    color: brand.white,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: brand.green[400] },
  secondary: { backgroundColor: brand.amber[400] },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
};
