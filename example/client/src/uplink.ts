// #region client
import { defineUplinkClient } from "@ksp-gonogo/sitrep-sdk";

/** Must equal package.json's version: gonogo-uplink.json is generated from this. */
const UPLINK_VERSION = "0.0.1";

/**
 * This Uplink's client, as the dashboard lists it. Every widget names it as its
 * `owner`. The description opens the generated page, so it says what the Uplink
 * is for in a sentence someone deciding whether to install it can use.
 */
export const EXAMPLE = defineUplinkClient({
  id: "example",
  version: UPLINK_VERSION,
  name: "Example",
  description:
    "The Uplink the Gonogo Uplink Guide builds: a heartbeat it publishes, a command that starts its count again, and a forward model that carries the count between samples.",
});
// #endregion client
