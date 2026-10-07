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
        public GuideExamples(bool modLoaded, int staleSamples)
        {
            _modLoaded = modLoaded;
            _staleSamples = staleSamples;
        }

        private readonly bool _modLoaded;
        private readonly int _staleSamples;

        #region health
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

        public void Register(IUplinkHost host)
        {
            if (!_modLoaded)
            {
                host.SetAvailability(Availability.Unavailable("Example Mod is not installed"));
                return;
            }
            // Register sources and handlers here.
        }
        #endregion health

        #region sampled
        /// <summary>Reads the game on the main thread and publishes off it.</summary>
        public void RegisterSampled(IUplinkHost host)
        {
            var publisher = host.Publisher("example.status");
            host.AddSampledSource(
                captureOnMainThread: snapshot => snapshot?.Ut,
                handleOnCourier: captured => publisher.Publish(
                    new Dictionary<string, object?> { ["ut"] = captured },
                    captured is double ut ? ut : 0.0));
        }
        #endregion sampled

        #region subject
        /// <summary>A delayed command to the craft <c>example.status</c> describes, which replies with a number.</summary>
        public static readonly CommandDeclaration SetMode = new CommandDeclaration
        {
            Command = "example.setMode",
            Subject = "example.status",
        };

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
