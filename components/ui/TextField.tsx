import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { brand, fonts, glass } from "../../lib/theme/brand";

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={brand.dark.muted}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    color: brand.white,
    fontFamily: fonts.body,
    fontSize: 16,
  },
});
