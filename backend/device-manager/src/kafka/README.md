# 🧱 Kafka Module – Message Producer

This module provides a robust interface for producing messages to Apache Kafka, typically from sources like MQTT. It handles automatic connection, retries on failure, and allows messages to be enriched with metadata.

---

## 📁 Project Structure

<ul>
  <li><strong>kafka</strong>
    <ul>
      <li><strong>producer-kafka.ts</strong> – Main Kafka Producer service</li>
      <li><strong>docker-compose.yml</strong> – Local Zookeeper + Kafka setup</li>
    </ul>
  </li>
</ul>

---

## 🧪 Requirements

- Node.js >= 16
- Kafka running locally or remotely
- `.env` file with required variables
- Docker (optional, for local Kafka setup)

---
## 🔍 View Kafka Topics Locally
Find the container name:

```bash

docker ps


Connect to the Kafka container:

docker exec -it <kafka_container_name> bash


List all topics:

kafka-topics.sh --bootstrap-server localhost:9092 --list


---

## 🐳 Kafka + Zookeeper via Docker

To spin up a local Kafka broker with Zookeeper:

```bash
docker-compose up -d


KAFKA_BROKER_ID=1
KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1

KAFKA_CLIENT_ID=mqtt-producer
KAFKA_BROKERS=localhost:9092

