using System;
using System.Reflection;

namespace ExampleUplink
{
    // #region reflection
    /// <summary>
    /// Reaches Example Mod by reflection, so this assembly never links against
    /// it. That keeps the Uplink loadable when the mod is absent, and keeps the
    /// mod's licence off your build.
    /// </summary>
    internal sealed class ExampleModAccess
    {
        private readonly Type? _api;

        public ExampleModAccess()
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                _api = assembly.GetType("ExampleMod.ExampleApi", throwOnError: false);
                if (_api != null)
                {
                    break;
                }
            }
        }

        public bool IsLoaded => _api != null;

        public int ReadMode() => Read<int>("CurrentMode");

        public bool ReadEnabled() => Read<bool>("Enabled");

        public void ApplyMode(int mode) =>
            _api?.GetMethod("SetMode", BindingFlags.Public | BindingFlags.Static)
                ?.Invoke(null, new object[] { mode });

        private T Read<T>(string property)
        {
            var value = _api
                ?.GetProperty(property, BindingFlags.Public | BindingFlags.Static)
                ?.GetValue(null);
            return value is T typed ? typed : default!;
        }
    }
    // #endregion reflection
}
