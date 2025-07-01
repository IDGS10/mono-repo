const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const url = 'http://192.168.100.76:8086/'; // Evaluate where we'll host influxDB 
const token = 'my-super-token';           // InfluxDB token
const org = 'my-org';                    // org name
const bucket = 'iot-bucket';            // bucket name

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
// Generate a random hostname
const randomHostnames = ['host1','api-server-1', 'backend-node-2', 'service-host-3', 'data-server-4', 'app-node-5'];
const randomHost = randomHostnames[Math.floor(Math.random() * randomHostnames.length)];

writeApi.useDefaultTags({ host: randomHost });

function sendRandomTemp() {
  const temp = 20 + Math.random() * 10; // random temp 20-30
  const point = new Point('temperature')
    .floatField('value', temp)
    .timestamp(new Date());

  writeApi.writePoint(point);
  writeApi.flush()
    .then(() => console.log(`Sent temp: ${temp.toFixed(2)} device:${randomHost}`))
    .catch(e => console.error('Error writing data', e));
}

setInterval(sendRandomTemp, 1000);
