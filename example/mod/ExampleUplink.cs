using System.Collections.Generic;
using System.Threading;
using Sitrep.Contract;

namespace GonogoExampleUplink
{
    /// <summary>
    /// One channel, one publisher, no third-party mod and no live KSP API. It
    /// publishes <c>example.heartbeat</c> off the shared <see cref="KspSnapshot"/>, so it
    /// registers with <c>AddChannelSource</c>. Reach for the capture-on-main
    /// <c>AddSampledSource</c> seam when you must read a live KSP or third-party API.
    /// </summary>
    #region declaration
    [SitrepUplink("example")]
    public sealed class ExampleUplink : ISitrepUplink
    {
        public const string HeartbeatTopic = "example.heartbeat";
        public const string ResetCommand = "example.reset";
        #endregion declaration

        /// <summary>Written by the courier's sample and by the reset handler, which run on different threads.</summary>
        private long _ticks;

        #region manifest
        public UplinkManifest Manifest { get; } = new UplinkManifest
        {
            Id = "example",
            // Provenance, ClientSource and ExpectedClientHash are written by `uplink-tools bake`, and one version covers both halves of the Uplink.
            Version = Provenance.Version,
            Name = Provenance.Name,
            Author = Provenance.Author,
            Repo = Provenance.Repo,
            // The app loads a client only for a plugin that says where the bundle lives, and refuses one that vouches for no hash.
            ExpectedClientHash = string.IsNullOrEmpty(ExpectedClientHash.Value)
                ? null
                : ExpectedClientHash.Value,
            ClientSource = new UplinkClientSource
            {
                Url = ClientSource.Url,
                DevPath = string.IsNullOrEmpty(ClientSource.DevPath) ? null : ClientSource.DevPath,
            },
            Channels = new List<ChannelDeclaration>
            {
                new ChannelDeclaration
                {
                    Topic = HeartbeatTopic,
                    Delivery = Delivery.LossyLatest,
                    // TrueNow: a heartbeat describes the connection, not a vessel.
                    // A fact about a vessel's state is DelayRole.Delayed.
                    Delay = DelayRole.TrueNow,
                    Emission = new EmissionPolicy(
                        keyframeIntervalUt: 30,
                        quantum: EmissionQuantum.Absolute(0)),
                },
            },
            #region commands
            Commands = new List<CommandDeclaration>
            {
                new CommandDeclaration { Command = ResetCommand },
            },
            #endregion commands
        };
        #endregion manifest

        #region register
        public void Register(IUplinkHost host)
        {
            host.AddChannelSource(HeartbeatTopic, Sample);
            host.AddCommandHandler<ExampleResetArgs, CommandResult>(ResetCommand, Reset);
        }
        #endregion register

        #region command
        /// <summary>
        /// Starts the count again. The count is shared with the courier's sample,
        /// so both sides change it through <see cref="Interlocked"/>.
        /// </summary>
        internal CommandResult Reset(ExampleResetArgs args)
        {
            Interlocked.Exchange(ref _ticks, 0);
            return CommandResult.Ok();
        }
        #endregion command

        #region health
        /// <summary>
        /// Mandatory. An Uplink wrapping a third-party mod reports "the assembly is
        /// not loaded" here as <c>UplinkHealthState.Unavailable</c> with a reason.
        /// </summary>
        public UplinkHealth Health() => UplinkHealth.Healthy;
        #endregion health

        #region sample
        /// <summary>
        /// Runs on the Courier thread, so it may touch nothing KSP-facing. Returning
        /// null publishes nothing, which is right: a substituted zero is
        /// indistinguishable from a real reading downstream.
        /// </summary>
        internal object? Sample(KspSnapshot? snapshot)
        {
            var ut = ReadableUt(snapshot);
            if (ut == null)
            {
                return null;
            }
            var ticks = Interlocked.Increment(ref _ticks);
            return new Dictionary<string, object?>
            {
                ["ut"] = ut,
                ["ticks"] = (double)ticks,
            };
        }

        /// <summary>
        /// The tick's UT, or null when it was not honestly read. Core fills
        /// <see cref="KspSnapshot.Ut"/> with 0 when Planetarium throws, which is
        /// live before any save has loaded, so a non-null snapshot can carry a UT
        /// nobody read.
        /// </summary>
        private static double? ReadableUt(KspSnapshot? snapshot)
        {
            if (snapshot == null)
            {
                return null;
            }
            var ut = snapshot.Ut;
            if (ut == 0.0 || double.IsNaN(ut) || double.IsInfinity(ut))
            {
                return null;
            }
            return ut;
        }
        #endregion sample
    }
}
