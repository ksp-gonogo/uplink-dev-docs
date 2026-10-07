#if SITREP_CODEGEN
using Reinforced.Typings.Attributes;
#endif
using Sitrep.Contract;

namespace GonogoExampleUplink;

#region heartbeat
/// <summary>
/// The <c>example.heartbeat</c> channel. A wire type belongs in the Uplink's own contract
/// slice, never in <c>Sitrep.Contract</c>.
/// </summary>
[SitrepContract]
[SitrepTopic("example.heartbeat")]
#if SITREP_CODEGEN
[TsInterface]
#endif
public sealed class ExampleHeartbeat
{
    /// <summary>Universal time the sample was captured at.</summary>
    [SitrepUnit(Units.UniversalTime)]
    public double? Ut { get; set; }

    /// <summary>How many times this Uplink has published, since load.</summary>
    [SitrepUnit(Units.Count)]
    public double? Ticks { get; set; }
}
#endregion heartbeat

#region reset
/// <summary>
/// The <c>example.reset</c> command, which starts the heartbeat's count again. It
/// takes no arguments, so this class exists to carry the command's tag.
/// </summary>
[SitrepContract]
[SitrepCommand("example.reset", Delay = DelayRole.TrueNow)]
#if SITREP_CODEGEN
[TsInterface]
#endif
public sealed class ExampleResetArgs
{
}
#endregion reset
