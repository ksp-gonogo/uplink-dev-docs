using System;
using System.Collections.Generic;
using System.Reflection;
using Sitrep.Contract;

namespace ExampleUplink
{
    #region binder
    /// <summary>
    /// Everything the Uplink reads from the mod it wraps, found by name when the
    /// game loads, with no compile-time reference to the mod. This one reaches
    /// KSP's own <c>Planetarium</c> in <c>Assembly-CSharp</c> as a stand-in: a
    /// real Uplink names its mod's assembly, types and members instead.
    /// </summary>
    internal sealed class ClockReflection
    {
        private readonly MethodInfo? _getUniversalTime;

        public ClockReflection()
        {
            Assembly? mod = null;
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                if (assembly.GetName().Name == "Assembly-CSharp")
                {
                    mod = assembly;
                    break;
                }
            }

            var planetarium = mod?.GetType("Planetarium");
            _getUniversalTime = planetarium?.GetMethod(
                "GetUniversalTime", BindingFlags.Public | BindingFlags.Static, null, Type.EmptyTypes, null);

            if (mod == null) Missing = "Assembly-CSharp is not loaded";
            else if (_getUniversalTime == null) Missing = "Planetarium.GetUniversalTime was not found in this version";
        }

        /// <summary>Why the mod cannot be read, for the operator; null when every member was found.</summary>
        public string? Missing { get; }

        public bool IsAvailable => Missing == null;

        /// <summary>The game time, read from the mod. Main thread only, like every read of a mod's state.</summary>
        public double? ReadUt() => _getUniversalTime?.Invoke(null, null) as double?;
    }
    #endregion binder

    /// <summary>A plugin wrapping the mod <see cref="ClockReflection"/> reaches.</summary>
    [SitrepUplink("clock")]
    public sealed class ClockUplink : ISitrepUplink
    {
        private const string AvailableTopic = "clock.available";
        private const string UtTopic = "clock.ut";

        private readonly ClockReflection _mod = new ClockReflection();

        #region manifest
        public UplinkManifest Manifest { get; } = new UplinkManifest
        {
            Id = "clock",
            Version = "1.0.0",
            Channels = new List<ChannelDeclaration>
            {
                // Whether the mod is installed: a fact about this install, so it skips the signal delay.
                new ChannelDeclaration
                {
                    Topic = AvailableTopic,
                    Delivery = Delivery.LossyLatest,
                    Delay = DelayRole.TrueNow,
                    Emission = new EmissionPolicy(keyframeIntervalUt: 30, quantum: EmissionQuantum.Absolute(0)),
                },
                new ChannelDeclaration
                {
                    Topic = UtTopic,
                    Delivery = Delivery.LossyLatest,
                    Delay = DelayRole.TrueNow,
                    Emission = new EmissionPolicy(keyframeIntervalUt: 30, quantum: EmissionQuantum.Absolute(1)),
                },
            },
        };
        #endregion manifest

        #region register
        public void Register(IUplinkHost host)
        {
            // Answered whether or not the mod is there, so a client can tell "not installed" from "not yet read".
            host.AddChannelSource(AvailableTopic, _ => _mod.IsAvailable);
            if (!_mod.IsAvailable)
            {
                host.SetAvailability(Availability.Unavailable(_mod.Missing!));
                return;
            }

            var ut = host.Publisher(UtTopic);
            host.AddSampledSource(
                captureOnMainThread: _ => _mod.ReadUt(),
                handleOnCourier: captured =>
                {
                    if (captured is double value) ut.Publish(new Dictionary<string, object?> { ["ut"] = value }, value);
                },
                subscriptionTopicPrefixes: UtTopic);
        }
        #endregion register

        #region health
        public UplinkHealth Health() =>
            _mod.IsAvailable
                ? UplinkHealth.Healthy
                : new UplinkHealth(UplinkHealthState.Unavailable, _mod.Missing);
        #endregion health
    }
}
