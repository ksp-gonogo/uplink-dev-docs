using System;
using System.Collections.Generic;
using Sitrep.Contract;

namespace ExampleUplink
{
    /// <summary>
    /// Calls every member of <see cref="IUplinkHost"/>. Nothing uses this class:
    /// it exists so the reference documentation's signatures are compiled rather
    /// than transcribed.
    /// </summary>
    internal static class HostSurface
    {
        // #region clock
        public static double Now(IUplinkHost host) => host.NowUt();
        // #endregion clock

        // #region publishing
        public static void Publishing(IUplinkHost host)
        {
            host.AddSampler(new CountingSampler());

            // The Topic must already be in the registering Uplink's manifest.
            // Publishing to an undeclared one throws out of Register.
            host.AddChannelSource("example.status", _ => true);

            IChannelPublisher publisher = host.Publisher("example.status");
            publisher.Publish(ExampleStatus.Build(0, false), host.NowUt());

            host.AddSampledSource(
                captureOnMainThread: snapshot => snapshot?.Ut,
                handleOnCourier: captured => publisher.Publish(captured, 0.0));

            host.AddSampledSource(
                captureOnMainThread: snapshot => snapshot?.Ut,
                handleOnCourier: captured => publisher.Publish(captured, 0.0),
                subscriptionTopicPrefixes: "example.");

            if (host.IsAnyTopicSubscribed("example."))
            {
                host.ForceKeyframe("example.status");
            }

            host.ResetChannelBirth(new[] { "example.status" });
        }
        // #endregion publishing

        // #region dynamic
        public static void DynamicNamespace(IUplinkHost host)
        {
            IDynamicChannelSource source = host.RegisterDynamicNamespace(
                "example.unit.",
                new ChannelDeclaration
                {
                    Topic = "example.unit.",
                    Delivery = Delivery.LossyLatest,
                    Emission = new EmissionPolicy(30, EmissionQuantum.Absolute(0)),
                });

            source.OnSubscribed(subTopic => source.Publisher(subTopic).Publish(null, 0.0));
        }
        // #endregion dynamic

        // #region commands
        public static void Commands(IUplinkHost host)
        {
            host.AddCommandHandler<SetModeArgs, CommandResult>(
                "example.setMode",
                args => CommandResult.Ok());

            host.AddVantageCommandHandler<SetModeArgs, CommandResult<int>>(
                "example.setModeFromCentre",
                (args, vantage) => CommandResult<int>.Ok(args.Mode));

            host.AddGateEvaluator(new AlwaysPassGate());

            host.AddCommandRequirement(
                "example.setMode",
                new CommandRequirement { Kind = "example.gate" });
        }
        // #endregion commands

        // #region delay
        public static void Delay(IUplinkHost host)
        {
            host.SetSignalDelaySource(_ => new CommsDelay());
            host.SetVesselDelay("vessel-id", 1.5);
            host.SetAuthorityDelay("centre-id", "vessel-id", 1.5);
            host.SetCentreDelay("centre-a", "centre-b", 0.2);
            host.SetVesselConnectivity("vessel-id", true);
            host.SetConnectivitySource(_ => true);
        }
        // #endregion delay

        // #region kernel
        public static void Capabilities(IUplinkHost host)
        {
            host.Kernel.RegisterProvider(new ProviderRegistration
            {
                Capability = "example.reliability",
                Id = "example",
                Priority = 10.0,
                CanServe = () => true,
                Factory = _ => new object(),
            });
        }

        public static T Resolve<T>(Kernel kernel, string capability) =>
            kernel.Query<T>(capability);
        // #endregion kernel

        // #region declarations
        /// <summary>Every field of every declaration type, so none can drift unseen.</summary>
        public static UplinkManifest FullManifest() => new UplinkManifest
        {
            Id = "example",
            Version = "0.1.0",
            Name = "Example Uplink",
            Author = "you",
            Repo = "https://github.com/you/example-uplink",
            ExpectedClientHash = "sha256-0000",
            ClientSource = new UplinkClientSource
            {
                Url = "https://example.invalid/uplink.js",
                DevPath = "client/dist/uplink.js",
            },
            Channels = new List<ChannelDeclaration>
            {
                new ChannelDeclaration
                {
                    Topic = "example.status",
                    Delivery = Delivery.ReliableOrdered,
                    Delay = DelayRole.TrueNow,
                    AbsenceIsData = true,
                    PerVesselNode = true,
                    OpaquePayload = false,
                    IsKeyframe = payload => payload != null,
                    Emission = new EmissionPolicy(
                        keyframeIntervalUt: 30,
                        quantum: EmissionQuantum.PercentOfRange(0.01, 0, 100),
                        minSampleIntervalUt: 0.5,
                        maxRateIntervalUt: 1.0),
                },
            },
            Commands = new List<CommandDeclaration>
            {
                new CommandDeclaration
                {
                    Command = "example.setMode",
                    Delayed = false,
                    Requires = new[]
                    {
                        new CommandRequirement
                        {
                            Kind = "example.gate",
                            Facility = "example.facility",
                            Quantity = "mode",
                            Needs = new[] { "example.status" },
                        },
                    },
                },
            },
        };

        public static UplinkHealth Degraded() => new UplinkHealth(
            UplinkHealthState.Degraded,
            "reading a stale value",
            new[] { new UplinkHealthFact("samples", "12") });

        public static GateVerdict Breached() => GateVerdict.Fail(
            CommandErrorCode.LimitReached,
            new LimitBreach
            {
                Facility = "example.facility",
                FacilityName = "Example Facility",
                FacilityLevel = 1,
                Quantity = "mode",
                Limit = 2,
                Actual = 3,
                Unit = "mode",
            });

        public static CapabilityDescriptor Capability() => new CapabilityDescriptor
        {
            Id = "example.reliability",
            Exclusive = true,
            SpineCritical = false,
            Vanilla = _ => new object(),
        };

        public static IEnumerable<string> NoticeKinds(Kernel kernel)
        {
            foreach (ResolutionNotice notice in kernel.LastNotices)
            {
                yield return notice.Capability + " " + notice.Kind + " " + notice.Detail;
            }
        }
        // #endregion declarations

        // #region opaque
        public static ChannelDeclaration OpaqueChannel() => new ChannelDeclaration
        {
            Topic = "example.audio",
            Delivery = Delivery.ReliableOrdered,
            Delay = DelayRole.Delayed,
            OpaquePayload = true,
            Emission = new EmissionPolicy(keyframeIntervalUt: 30, quantum: EmissionQuantum.Absolute(0)),
        };

        /// <summary>A batch: every chunk captured since the last publish, in order.</summary>
        public static void PublishBatch(IUplinkHost host, List<byte[]> chunks, double capturedAtUt) =>
            host.Publisher("example.audio").Publish(chunks, capturedAtUt);
        // #endregion opaque

        // #region availability
        public static void Unavailable(IUplinkHost host, string reason) =>
            host.SetAvailability(Availability.Unavailable(reason));
        // #endregion availability
    }

    // #region sampler
    /// <summary>Runs on the main thread once per snapshot, before any mapper.</summary>
    internal sealed class CountingSampler : ISnapshotSampler
    {
        public long Count { get; private set; }

        public void Sample(KspSnapshot snapshot) => Count++;
    }
    // #endregion sampler

    // #region gate
    /// <summary>Decides whether a command carrying a matching requirement may run.</summary>
    internal sealed class AlwaysPassGate : ICommandGateEvaluator
    {
        public string Kind => "example.gate";

        public GateVerdict Evaluate(CommandRequirement requirement, IGateArguments arguments) =>
            arguments.TryGet("mode", out _)
                ? GateVerdict.Pass()
                : GateVerdict.Fail(CommandErrorCode.Range, "mode missing");
    }
    // #endregion gate
}
