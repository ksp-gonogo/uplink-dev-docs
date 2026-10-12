import { registerUplinkTopic } from "@ksp-gonogo/sitrep-sdk";

// Whether the wrapped mod is installed: a bare boolean, so it has no generated type to name.
declare module "@ksp-gonogo/sitrep-sdk" {
  interface TopicPayloadMap {
    "clock.available": boolean;
  }
}

registerUplinkTopic("clock.available");
