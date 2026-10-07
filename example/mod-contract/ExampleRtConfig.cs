#if SITREP_CODEGEN
using System;
using Reinforced.Typings.Fluent;

namespace GonogoExampleUplink;

/// <summary>
/// This Uplink's codegen configuration. It lives behind <c>SITREP_CODEGEN</c> so
/// the Reinforced.Typings attributes exist only in the codegen twin, never in the
/// shipped assembly.
/// </summary>
public static class ExampleRtConfig
{
    public static void Configure(ConfigurationBuilder builder)
    {
        builder.Global(g => g
            .CamelCaseForProperties()
            .UseModules(true)
            .AutoOptionalProperties());

        var wireTypes = new[] { typeof(ExampleHeartbeat), typeof(ExampleResetArgs) };

        builder.ExportAsInterfaces(wireTypes, c => c.AutoI(false).WithPublicProperties());
        Sitrep.Contract.RtConfig.ApplyUnitValueTypes(
            builder, wireTypes, valueImportFrom: "@ksp-gonogo/sitrep-sdk");

        var topicMapOut = Environment.GetEnvironmentVariable("SITREP_EXAMPLE_TOPICMAP_OUT");
        if (!string.IsNullOrEmpty(topicMapOut))
        {
            Sitrep.Contract.RtConfig.EmitTopicMap(topicMapOut!, typeof(ExampleRtConfig).Assembly);
        }

        var unitMapOut = Environment.GetEnvironmentVariable("SITREP_EXAMPLE_UNITMAP_OUT");
        if (!string.IsNullOrEmpty(unitMapOut))
        {
            Sitrep.Contract.RtConfig.EmitUnitMap(
                unitMapOut!,
                Environment.GetEnvironmentVariable("SITREP_EXAMPLE_UNITJSON_OUT"),
                typeof(ExampleRtConfig).Assembly);
        }
    }
}
#endif
