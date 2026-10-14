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

        public GuideExamples(bool modLoaded, int staleSamples)
        {
            _modLoaded = modLoaded;
            _staleSamples = staleSamples;
        }

        /// <summary>Reports the mod this Uplink wraps as missing, and a stale read as degraded.</summary>
        public UplinkHealth Health()
        {
            if (!_modLoaded)
            {
                return UplinkHealth.Unavailable("Example Mod is not installed");
            }
            return _staleSamples > 0
                ? UplinkHealth.Degraded("Example Mod stopped updating its readout")
                : UplinkHealth.Healthy;
        }
        #endregion health

        #region unavailable
        public void Register(IUplinkHost host)
        {
            if (!_modLoaded)
            {
                host.SetAvailability(Availability.Unavailable("Example Mod is not installed"));
                return;
            }
            // RegisterSampled and RegisterSetMode stand for the methods of your own that wire up its sources and handlers.
            RegisterSampled(host);
            RegisterSetMode(host);
        }
        #endregion unavailable

        #region refine
        /// <summary>The refusals this Uplink adds under the stock ones.</summary>
        public static class ExampleRefusals
        {
            /// <summary>A mode the plugin knows but the current save has not unlocked.</summary>
            public static readonly RefusalCode ModeLocked =
                CommandErrorCode.ModeUnavailable.Refine("example.modeLocked", "that mode is not unlocked in this save");
        }

        // The manifest lists them: new UplinkManifest { ErrorCodes = ErrorCodeCatalog.Of(typeof(ExampleRefusals)), ... }
        public CommandResult RefuseLockedMode() =>
            CommandResult.Fail(ExampleRefusals.ModeLocked, "Mode 2 is not unlocked");
        #endregion refine

        #region sampled
        /// <summary>Reads the game on the main thread and publishes off it.</summary>
        public void RegisterSampled(IUplinkHost host)
        {
            // example.status is declared in the manifest's Channels, as every Topic a plugin publishes is.
            var publisher = host.Publisher("example.status");
            host.AddSampledSource(
                captureOnMainThread: snapshot => snapshot?.Ut,
                handleOffMainThread: captured =>
                {
                    // No game time read means nothing to publish this tick, never a made-up zero.
                    if (captured is double ut) publisher.Publish(new Dictionary<string, object?> { ["ut"] = ut }, ut);
                });
        }
        #endregion sampled

        #region status
        /// <summary>The Topic describing the craft: a fact about a vessel, so it waits for the signal.</summary>
        public static readonly ChannelDeclaration Status = new ChannelDeclaration
        {
            Topic = "example.status",
            Kind = SampleKind.Discrete,
            Delivery = Delivery.LossyLatest,
            Delay = DelayRole.Delayed,
            Emission = new EmissionPolicy(keyframeIntervalUt: 30, quantum: EmissionQuantum.Absolute(0)),
        };
        #endregion status

        #region subject
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
