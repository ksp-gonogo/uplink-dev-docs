import { useState } from "react";
import { AudioInputPicker, Text } from "@ksp-gonogo/ui-kit";

export function VoiceInput() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  return (
    <>
      <AudioInputPicker label="Voice loop input" onStream={setStream} />
      <Text>{stream ? "Capturing" : "Not capturing"}</Text>
    </>
  );
}
