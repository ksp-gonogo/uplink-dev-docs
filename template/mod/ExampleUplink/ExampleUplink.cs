using System.Collections.Generic;
using Sitrep.Contract;

namespace ExampleUplink
{
    // #region declaration
    /// <summary>
    /// Publishes one Topic and accepts one command for Example Mod.
    /// </summary>
    [SitrepUplink("example")]
    public sealed class ExampleUplink : ISitrepUplink
    {
        public const string StatusTopic = "example.status";
        public const string SetModeCommand = "example.setMode";
        // #endregion declaration

        private readonly ExampleModAccess _mod = new ExampleModAccess();
        private IChannelPublisher? _status;

        // #region manifest
        public UplinkManifest Manifest { get; } = new UplinkManifest
        {
            Id = "example",
            Version = "0.1.0",
            Name = "Example Uplink",
            Author = "you",
            Repo = "https://github.com/you/example-uplink",
            Channels = new List<ChannelDeclaration>
            {
                new ChannelDeclaration
                {
                    Topic = StatusTopic,
                    Delivery = Delivery.LossyLatest,
                    Delay = DelayRole.Delayed,
                    Emission = new EmissionPolicy(
                        keyframeIntervalUt: 30,
                        quantum: EmissionQuantum.Absolute(0)),
                },
            },
            Commands = new List<CommandDeclaration>
            {
                new CommandDeclaration { Command = SetModeCommand, Subject = StatusTopic },
            },
        };
        // #endregion manifest

        // #region register
        public void Register(IUplinkHost host)
        {
            if (!_mod.IsLoaded)
            {
                host.SetAvailability(Availability.Unavailable("Example Mod is not installed"));
                return;
            }

            _status = host.Publisher(StatusTopic);
            host.AddSampledSource(CaptureOnMainThread, PublishOnCourier, StatusTopic);
            host.AddCommandHandler<SetModeArgs, CommandResult>(SetModeCommand, SetMode);
        }
        // #endregion register

        // #region sampling
        /// <summary>
        /// Runs on the Unity main thread. Read the game and the mod here, and
        /// return plain data, never a live game object.
        /// </summary>
        private object? CaptureOnMainThread(KspSnapshot? snapshot) => new Capture
        {
            Ut = snapshot?.Ut ?? 0.0,
            Status = ExampleStatus.Build(_mod.ReadMode(), _mod.ReadEnabled()),
        };

        /// <summary>
        /// Runs off the main thread with exactly what the capture returned.
        /// Touching the game from here crashes KSP.
        /// </summary>
        private void PublishOnCourier(object? captured)
        {
            if (captured is Capture capture)
            {
                _status?.Publish(capture.Status, capture.Ut);
            }
        }
        // #endregion sampling

        // #region command
        /// <summary>
        /// The shipped mod marshals command handlers onto the Unity main thread
        /// before running them, so this may call the game directly.
        /// </summary>
        private CommandResult SetMode(SetModeArgs args)
        {
            if (args.Mode < 0 || args.Mode > 2)
            {
                return CommandResult.Fail(CommandErrorCode.Range, "Mode must be 0, 1 or 2");
            }

            _mod.ApplyMode(args.Mode);
            return CommandResult.Ok();
        }
        // #endregion command

        // #region health
        public UplinkHealth Health() =>
            _mod.IsLoaded
                ? UplinkHealth.Healthy
                : new UplinkHealth(
                    UplinkHealthState.Unavailable,
                    "Example Mod is not installed");
        // #endregion health

        /// <summary>What the capture hands to the publish, never the wire shape.</summary>
        private sealed class Capture
        {
            public double Ut;
            public Dictionary<string, object?> Status = new Dictionary<string, object?>();
        }
    }
}
