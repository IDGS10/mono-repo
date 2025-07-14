# MQTT Module

This module establishes a secure MQTT client that connects to an EMQX broker, receives messages from any subscribed topic, and forwards them to Kafka via enriched handlers.

In this module you´ll find the establish connection to a secure MQTT client connected to an EMQX broker,receive messages from all your subscribed topics, clean and deleted it, and forwards them to kafka using the handlers.

## 🧩 Overview

- Connects securely to an MQTT broker using TLS and credentials.
- Subscribes to all topics using tag (`/#`).
- Parses incoming messages and delegates them to specific handlers based on the topic.
- Handlers are dynamically loaded from the `/handler` folder.
- Each handler can transform and forward data to a Kafka topic.
- Graceful shutdown supported.

## 📁 Folder Structure

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
      <li>docker-compose.yml</li>
      </ul>
      <li>influx</li>
       <ul>
      <li>kafkaInfluxConsumer.ts</li>
      </ul>
    </ul>
  </li>
</ul>

## 🔧 Environment Variables

The module requires the following variables in your `.env` file:

```env
MQTT_BROKER_URL=mqtts://your-broker-url.com:8883
MQTT_USERNAME=yourUsername
MQTT_PASSWORD=yourPassword
KAFKA_CLIENT_ID=mqtt-producer
KAFKA_BROKERS=broker1:9092,broker2:9092

