// #region example
import { Box, Value } from "@ksp-gonogo/ui-kit";

export function ReadoutTile({ label, value }: { label: string; value: string }) {
  return (
    <Box surface="sunken" pad={["sm", "md"]} radius="sm" bordered>
      {label} <Value spaced>{value}</Value>
    </Box>
  );
}
// #endregion example
