#if SITREP_CODEGEN
using Reinforced.Typings.Attributes;
#endif
using Sitrep.Contract;

namespace GonogoExampleUplink;

#region heartbeat
/// <summary>
/// What <c>example.heartbeat</c> carries: a count of the samples this Uplink has
/// published and the game time of the latest. Nothing is published until a save
/// is loaded.
/// <internal>
/// The wire is written from the dictionary ExampleUplink.Sample returns, and this
/// type is what the client's TypeScript is generated from, so the two are kept
/// in step by hand. Prose inside this element stays in the C# and never reaches
/// the generated types.
/// </internal>
/// </summary>
[SitrepContract]
[SitrepTopic("example.heartbeat")]
#if SITREP_CODEGEN
[TsInterface]
#endif
public sealed class ExampleHeartbeat
{
    /// <summary>The game's universal time when the sample was taken. Never null in a published sample.</summary>
    [SitrepUnit(Units.UniversalTime)]
    public double? Ut { get; set; }

    /// <summary>How many samples this Uplink has published since the game started, this one included. It starts again from 1 when the game restarts.</summary>
    [SitrepUnit(Units.Count)]
    public double? Ticks { get; set; }
}
#endregion heartbeat

#region reset
/// <summary>
/// The arguments of <c>example.reset</c>, which starts the heartbeat's count again.
/// The command takes none, so this class carries only its tag.
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
