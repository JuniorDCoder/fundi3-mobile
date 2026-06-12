import { Stack } from "expo-router";
import { brand } from "../../lib/theme/brand";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: brand.dark.bg },
      }}
    />
  );
}
