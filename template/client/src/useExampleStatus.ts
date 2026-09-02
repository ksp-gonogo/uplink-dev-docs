// #region hook
import { useEffect, useState } from "react";
import type { SitrepStream } from "./stream";
import { EXAMPLE_STATUS_TOPIC, type ExampleStatus } from "./topics";

/** Subscribes to `example.status` for as long as the component is mounted. */
export function useExampleStatus(
  stream: SitrepStream,
): ExampleStatus | undefined {
  const [status, setStatus] = useState<ExampleStatus>();

  useEffect(
    () =>
      stream.subscribe(EXAMPLE_STATUS_TOPIC, (frame) => {
        setStatus(frame.payload as ExampleStatus);
      }),
    [stream],
  );

  return status;
}
// #endregion hook
