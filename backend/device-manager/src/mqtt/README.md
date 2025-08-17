# MQTT Module

This module establishes a secure MQTT client that connects to an EMQX broker, receives messages from any subscribed topic, and forwards them to Kafka via enriched handlers.

In this module you´ll find the establish connection to a secure MQTT client connected to an EMQX broker,receive messages from all your subscribed topics, clean and deleted it, and forwards them to kafka using the handlers.

##  Overview

- Connects securely to an MQTT broker using TLS and credentials.
- Subscribes to all topics using tag (`/#`).
- Parses incoming messages and delegates them to specific handlers based on the topic.
- Handlers are dynamically loaded from the `/handler` folder.
- Each handler can transform and forward data to a Kafka topic.
- Graceful shutdown supported.

##  Folder Structure

<ul>
  <li>project
    <ul>
      <li>mqtt
        <ul>
          <li>certs</li>
          <li>handler</li>
          <li>mqtt.service.ts</li>
        </ul>
      </li>
      <li>kafka </li>
      <ul>
      <li>producer-kafka.ts</li>
      </ul>
      <li>influx</li>
       <ul>
      <li>kafkaInfluxConsumer.ts</li>
      </ul>
    </ul>
  </li>
</ul>

##  How It Works
Connection
Uses the mqtt Node.js package to connect securely to EMQX.

Loads the CA certificate from the certs folder.

Automatically attempts reconnection up to 5 times if the connection fails.

Subscription
Subscribes to all topics (/#).

Handles incoming messages via the message event listener.

Dynamic Handlers
Handlers are JS/TS modules located in the handler/ directory.

Each handler is matched to a specific MQTT topic.

If no handler is matched, the message is ignored (with a warning).

Topics are normalized to support wildcard-based topic matching (+, #).

Example Handler Behavior
Converts MQTT topic to Kafka-compatible topic format.

Enriches message with timestamp and metadata.

Sends it to Kafka using sendMessage().





##  Environment Variables

The module requires the following variables in your `.env` file:

```env
MQTT_BROKER_URL=mqtts://your-broker-url.com:8883
MQTT_USERNAME=yourUsername
MQTT_PASSWORD=yourPassword
KAFKA_CLIENT_ID=mqtt-to-kafka-bridge
KAFKA_BROKERS=kafka:9092
ALLOWED_TOPICS=your-topic,another-topic,
