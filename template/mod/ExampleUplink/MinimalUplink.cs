using System.Collections.Generic;
using Sitrep.Contract;

namespace ExampleUplink
{
    // #region minimal
    /// <summary>The smallest Uplink that compiles, loads, and publishes.</summary>
    [SitrepUplink("minimal")]
    public sealed class MinimalUplink : ISitrepUplink
    {
        public UplinkManifest Manifest { get; } = new UplinkManifest
        {
            Id = "minimal",
            Version = "0.1.0",
            Channels = new List<ChannelDeclaration>
            {
                new ChannelDeclaration
                {
                    Topic = "minimal.tick",
                    Emission = new EmissionPolicy(
                        keyframeIntervalUt: 1,
                        quantum: EmissionQuantum.Absolute(0)),
                },
            },
        };

        public void Register(IUplinkHost host) =>
            host.AddChannelSource("minimal.tick", snapshot =>
                new Dictionary<string, object?> { ["ut"] = snapshot?.Ut ?? 0.0 });

        public UplinkHealth Health() => UplinkHealth.Healthy;
    }
    // #endregion minimal
}
