#if SITREP_CODEGEN
using Reinforced.Typings.Attributes;
#endif
using System.Collections.Generic;
using Sitrep.Contract;

namespace ExampleUplink
{
    // #region payload
    /// <summary>
    /// The payload of the <c>example.status</c> Topic.
    ///
    /// A dictionary, not a class. The serialiser accepts dictionaries, arrays
    /// and primitives; a plain object of your own is not a shape it can write,
    /// and a frame carrying one is dropped with nothing on the wire.
    /// </summary>
    public static class ExampleStatus
    {
        public static Dictionary<string, object?> Build(int mode, bool enabled) =>
            new Dictionary<string, object?>
            {
                ["mode"] = mode,
                ["enabled"] = enabled,
            };
    }
    // #endregion payload

    // #region args
    /// <summary>Arguments of the <c>example.setMode</c> command.</summary>
    [SitrepContract]
    [SitrepCommand("example.setMode", Payload = typeof(int))]
#if SITREP_CODEGEN
    [TsInterface]
#endif
    public sealed class SetModeArgs
    {
        /// <summary>The mode to switch to, 0, 1 or 2.</summary>
        public int Mode { get; set; }
    }
    // #endregion args
}
