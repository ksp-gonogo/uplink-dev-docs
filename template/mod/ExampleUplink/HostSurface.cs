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

            host.AddChannelSource("example.available", _ => true);

            IChannelPublisher publisher = host.Publisher("example.status");
            publisher.Publish(new ExampleStatus(), host.NowUt());

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
