import { DefaultThemeProvider, Stack, Text } from "@ksp-gonogo/ui-kit";

export function Provider() {
  return (
    <DefaultThemeProvider>
      <Stack gap="caption">
        <Text tone="go">GO</Text>
        <Text tone="warn">HOLD</Text>
        <Text tone="nogo">ABORT</Text>
      </Stack>
    </DefaultThemeProvider>
  );
}
