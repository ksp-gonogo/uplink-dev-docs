using System.Collections.Generic;
using Sitrep.Contract;
using Xunit;

namespace GonogoExampleUplink.Tests
{
    public class ExampleUplinkTests
    {
        [Fact]
        public void DeclaresOneTrueNowChannel()
        {
            var manifest = new ExampleUplink().Manifest;

            Assert.Equal("example", manifest.Id);
            var channel = Assert.Single(manifest.Channels);
            Assert.Equal(ExampleUplink.HeartbeatTopic, channel.Topic);
            Assert.Equal(DelayRole.TrueNow, channel.Delay);
        }

        [Fact]
        public void AnnouncesItsClientSoTheAppCanFindIt()
        {
            var manifest = new ExampleUplink().Manifest;

            Assert.NotNull(manifest.ClientSource);
            Assert.NotEqual("", manifest.ClientSource!.Url);
            Assert.NotEqual("", manifest.Version);
            // Null until `uplink-tools bake --bundle` has hashed a built bundle, and never a malformed value.
            Assert.True(
                manifest.ExpectedClientHash == null
                    || manifest.ExpectedClientHash.StartsWith("sha256-"));
        }

        [Fact]
        public void PublishesNothingWithoutAReadableUt()
        {
            Assert.Null(new ExampleUplink().Sample(null));
            Assert.Null(new ExampleUplink().Sample(new KspSnapshot { Ut = 0.0 }));
            Assert.Null(new ExampleUplink().Sample(new KspSnapshot { Ut = double.NaN }));
        }

        [Fact]
        public void CarriesTheSnapshotUtAndACountThatAdvances()
        {
            var uplink = new ExampleUplink();

            var first = Assert.IsType<Dictionary<string, object?>>(
                uplink.Sample(new KspSnapshot { Ut = 1234.5 }));
            Assert.Equal(1234.5, first["ut"]);
            Assert.Equal(1.0, first["ticks"]);

            var second = Assert.IsType<Dictionary<string, object?>>(
                uplink.Sample(new KspSnapshot { Ut = 1235.5 }));
            Assert.Equal(2.0, second["ticks"]);
        }

        #region reset
        [Fact]
        public void ResetStartsTheCountAgain()
        {
            var uplink = new ExampleUplink();
            uplink.Sample(new KspSnapshot { Ut = 1234.5 });
            uplink.Sample(new KspSnapshot { Ut = 1235.5 });

            Assert.True(uplink.Reset(new ExampleResetArgs()).Success);

            var next = Assert.IsType<Dictionary<string, object?>>(
                uplink.Sample(new KspSnapshot { Ut = 1236.5 }));
            Assert.Equal(1.0, next["ticks"]);
        }

        [Fact]
        public void DeclaresTheResetCommand()
        {
            var command = Assert.Single(new ExampleUplink().Manifest.Commands);
            Assert.Equal(ExampleUplink.ResetCommand, command.Command);
        }
        #endregion reset
    }
}
