namespace ExampleUplink
{
    // #region payload
    /// <summary>Payload of the <c>example.status</c> Topic.</summary>
    public sealed class ExampleStatus
    {
        public int Mode { get; set; }
        public bool Enabled { get; set; }
    }
    // #endregion payload

    // #region args
    /// <summary>Arguments of the <c>example.setMode</c> command.</summary>
    public sealed class SetModeArgs
    {
        public int Mode { get; set; }
    }
    // #endregion args
}
