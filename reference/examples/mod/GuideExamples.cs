using System.Collections.Generic;
using Sitrep.Contract;

namespace ExampleUplink
{
    /// <summary>
    /// The plugin snippets the Guide shows that the worked Uplink has no use for,
    /// compiled against the contract so none of them can drift.
    /// </summary>
    internal sealed class GuideExamples
    {
        #region health
        // Set in the constructor from what the plugin found when the game loaded, and by the sampling code as it reads.
        private readonly bool _modLoaded;
        private readonly int _staleSamples;

        /// <summary>Reports the mod this Uplink wraps as missing, and a stale read as degraded.</summary>
        public UplinkHealth Health()
        {
            if (!_modLoaded)
            {
                return new UplinkHealth(UplinkHealthState.Unavailable, "Example Mod is not installed");
            }
            return _staleSamples > 0
                ? new UplinkHealth(UplinkHealthState.Degraded, "Example Mod stopped updating its readout")
                : UplinkHealth.Healthy;
        }
        #endregion health

        public GuideExamples(bool modLoaded, int staleSamples)
        {
            _modLoaded = modLoaded;
            _staleSamples = staleSamples;
        }

        #region unavailable
        public void Register(IUplinkHost host)
        {
            if (!_modLoaded)
            {
                host.SetAvailability(Availability.Unavailable("Example Mod is not installed"));
                return;
            }
            RegisterSampled(host);
            RegisterSetMode(host);
        }
        #endregion unavailable

        #region sampled
        /// <summary>Reads the game on the main thread and publishes off it.</summary>
        public void RegisterSampled(IUplinkHost host)
        {
            // example.status is declared in the manifest's Channels, as every Topic a plugin publishes is.
            var publisher = host.Publisher("example.status");
            host.AddSampledSource(
                captureOnMainThread: snapshot => snapshot?.Ut,
                handleOnCourier: captured =>
                {
                    // No game time read means nothing to publish this tick, never a made-up zero.
                    if (captured is double ut) publisher.Publish(new Dictionary<string, object?> { ["ut"] = ut }, ut);
                });
        }
        #endregion sampled

        #region subject
        /// <summary>The Topic describing the craft: a fact about a vessel, so it waits for the signal.</summary>
        public static readonly ChannelDeclaration Status = new ChannelDeclaration
        {
            Topic = "example.status",
            Delivery = Delivery.LossyLatest,
            Delay = DelayRole.Delayed,
            Emission = new EmissionPolicy(keyframeIntervalUt: 30, quantum: EmissionQuantum.Absolute(0)),
        };

        /// <summary>A delayed command to the craft <c>example.status</c> describes, which replies with a number.</summary>
        public static readonly CommandDeclaration SetMode = new CommandDeclaration
        {
            Command = "example.setMode",
            Subject = "example.status",
        };

        // Status goes in the manifest's Channels and SetMode in its Commands; the handler is registered in Register.
        public void RegisterSetMode(IUplinkHost host) =>
            host.AddCommandHandler<SetModeArgs, CommandResult<int>>(SetMode.Command, HandleSetMode);

        public CommandResult<int> HandleSetMode(SetModeArgs args)
        {
            if (args.Mode < 0 || args.Mode > 2)
            {
                return CommandResult<int>.Fail(CommandErrorCode.Range, "Mode must be 0, 1 or 2");
            }
            return CommandResult<int>.Ok(args.Mode);
        }
        #endregion subject
    }
}
