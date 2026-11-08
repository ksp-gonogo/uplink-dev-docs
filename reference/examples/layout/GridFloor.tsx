import { Box, gridToPixels, Stack, Text } from "@ksp-gonogo/ui-kit";

export function GridFloor() {
  // A 6 by 4 tile is 226 by 112 pixels: 6 columns of 21 and 5 gaps of 20, by 4 rows of 13 and 3 gaps of 20.
  const { pxW, pxH } = gridToPixels(6, 4);
  return (
    <Box surface="sunken" pad="surface" radius="regular" bordered>
      <Stack gap="caption">
        <Text>A 6 by 4 tile</Text>
        <Text level="muted">
          {pxW} by {pxH} px
        </Text>
      </Stack>
    </Box>
  );
}
