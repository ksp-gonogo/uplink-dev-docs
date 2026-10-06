export default {
  kind: "contract",
  title: "ISitrepUplink",
  types: [
    "ISitrepUplink",
    "SitrepUplinkAttribute",
    "UplinkManifest",
    "UplinkClientSource",
    "Availability",
    "UplinkHealth",
    "UplinkHealthState",
    "UplinkHealthFact",
    "IUplinkCapabilityDeclarer",
  ],
  examples: {
    UplinkManifest: "template/mod/ExampleUplink/ExampleUplink.cs#manifest",
    Availability: "template/mod/ExampleUplink/HostSurface.cs#availability",
    UplinkHealth: "template/mod/ExampleUplink/ExampleUplink.cs#health",
  },
};
