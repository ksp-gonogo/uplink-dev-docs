import { registerUplinkCommand } from "@ksp-gonogo/sitrep-sdk";
import {
  GENERATED_COMMAND_IDS,
  GENERATED_COMMAND_RAIL,
  type GeneratedCommandArgsMap,
  type GeneratedCommandReplyMap,
} from "./__generated__/command-map.js";

// #region commandmaps
// Types this Uplink's commands: useCommand("<id>") resolves its args and its reply from the maps codegen writes. index.ts re-exports this module so the augmentation reaches dist/index.d.ts.
declare module "@ksp-gonogo/sitrep-sdk" {
  interface CommandArgsMap extends GeneratedCommandArgsMap {}
  interface CommandReplyMap extends GeneratedCommandReplyMap {}
}
// #endregion commandmaps

// #region command
// Tells the app whether each command is held for the signal delay, off the declaration in the contract slice. Nothing to add by hand: a command you declare joins after codegen.
for (const id of GENERATED_COMMAND_IDS) {
  registerUplinkCommand(id, GENERATED_COMMAND_RAIL[id]);
}
// #endregion command

/** This Uplink's own command ids, as the generated map declares them. */
export { GENERATED_COMMAND_IDS as UPLINK_COMMAND_IDS };
