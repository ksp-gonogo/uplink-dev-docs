// #region result
import { CommandErrorCode } from "@ksp-gonogo/sitrep-sdk";
import type { SitrepStream } from "./stream";
import { EXAMPLE_SET_MODE_COMMAND, type SetModeArgs } from "./topics";

/** What a plugin's `CommandResult` looks like once it reaches the client. */
export interface UplinkCommandResult {
  success: boolean;
  errorCode: CommandErrorCode;
  detail?: string;
}

export async function setMode(
  stream: SitrepStream,
  mode: number,
): Promise<string | undefined> {
  const result = (await stream.command<SetModeArgs>(EXAMPLE_SET_MODE_COMMAND, {
    mode,
  })) as UplinkCommandResult;

  if (result.success) {
    return undefined;
  }
  return result.errorCode === CommandErrorCode.Range
    ? "That mode is out of range"
    : (result.detail ?? `Command failed (${CommandErrorCode[result.errorCode]})`);
}
// #endregion result
