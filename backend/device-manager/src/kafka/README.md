#  Kafka Producer Module – Robust Message Publishing with Dynamic Topic Creation

This module provides a reliable and configurable Kafka producer using [KafkaJS](https://kafka.js.org/), designed to work in tandem with an MQTT bridge or any other upstream system. It ensures secure connection management, auto topic creation (if the topics its allowed in the .env), and consistent message enrichment for traceability.

---

##  Overview

- Connects to Kafka using environment-based configuration.
- Automatically creates missing Kafka topics if needed.
- Enriches all outgoing messages with consistent metadata (timestamp, origin, UUID).
- Gracefully handles connection lifecycle and retries.
- Logs all connection events and message delivery status.
- Exposes utility functions for simplified usage across modules.

---

##  Features

| Feature                       | Description |
|------------------------------|-------------|
|  Secure Kafka Connection    | Uses `clientId` and `brokers` from `.env` |
|  Auto Topic Creation        | Creates topics if they don't already exist |
|  Metadata Injection         | Attaches timestamp, source, and message ID |
|  Graceful Shutdown          | Listens to `SIGINT` / `SIGTERM` and disconnects cleanly |
|  Retry Logic                | Retries failed operations up to 5 times |
|  Utility Exports            | Easy integration via `sendMessage()` and `connectProducer()` |

---

##  Message Format
Every message is wrapped automatically as:

{
  "payload": "{...}", 
  "metadata": {
    "timestamp": 1722368850000,
    "source": "mqtt-bridge",
    "messageId": "msg-1722368850000-abc123xyz"
  }
}

##  Internal Logic Highlights

Encapsulates the connection, admin control, and message publishing logic.

One-time connection attempt locking using connectionPromise.

Auto-topic creation with numPartitions = 1, replicationFactor = 1.

Full disconnection support and status tracking.

sendMessage(topic, message)
Auto-connects if needed.

Ensures the topic exists before sending.

Wraps the payload with metadata and publishes it to Kafka.


## Example of the output console 

~terminal: Kafka Producer connected.  
~terminal: Topic "sensor-data" does not exist. Creating...  
~terminal: Topic "sensor-data" created.  
~terminal: Message sent to Kafka topic "sensor-data": [MessageMetadata...]

##  possible problems

| Issue                   | Cause                               | Suggested Fix                                  |
|-------------------------|--------------------------------------|------------------------------------------------|
| `KAFKA_CLIENT_ID` missing | Not defined in `.env`               | Define it before running the service           |
| Failed to connect       | Broker unreachable                   | Check `KAFKA_BROKERS` and network connectivity between your dockers |
| Topic does not exist    | Not created or auto-disabled         | Let the module create it or predefine it       |
| Message not delivered   | Payload issue                        | Check JSON format and message size             |


## Considerations

If you want to create a new topic in kafka, you must created before in the .env file, then you should recreate the image of the DockerFile, runing the next comand in the folder "src", run "docker-compose up --build", the 