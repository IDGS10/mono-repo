# MQTT → Kafka → InfluxDB Integration System

## Description

This system integrates messages coming from an MQTT broker, processes them through specific handlers, and publishes them to Kafka for further consumption and storage in InfluxDB for real-time analysis and monitoring.

---

## General Architecture

device-manager/
└── src/
    ├── config/          # Configuration files (env loaders, constants)
    ├── influx/          # Kafka consumer → InfluxDB writer logic
    ├── kafka/           # Kafka producer, topics config, Kafka clients
    ├── mqtt/            # MQTT service and handler manager
    ├── node_modules/    # Node dependencies (auto-managed)
    ├── ota/             # OTA update logic or modules (optional)
    ├── utils/           # Helper functions and shared utilities
    ├── .env             # Environment variable definitions
    ├── package.json     # Project metadata and dependencies
    └── package-lock.json# Lock file for dependency versions

---

## Main Components

### 1. MQTT Service (`MqttService`)

- Connects and maintains the session with the MQTT broker.
- Subscribes to global MQTT topics (`/#`) to receive messages.
- Uses a `HandlerManager` to delegate message processing based on the topic.
- Implements reconnection logic with a retry limit.
- Handles connection events and errors.

### 2. Handler Manager (`HandlerManager`)

- Dynamically loads handlers from `.ts`/`.js` files in structured folders.
- Each handler is associated with a specific topic (based on path and filename).
- Supports MQTT patterns (`+`, `#`) for flexible matching.
- Processes messages and calls the corresponding handler.
- Allows adding metadata for documentation and control.

### 3. Kafka Producer (`KafkaProducerService`)

- Singleton pattern to maintain a single Kafka producer instance.
- Configurable via environment variables (`KAFKA_CLIENT_ID`, `KAFKA_BROKERS`).
- Automatically enriches messages with metadata (timestamp, ID, source).
- Supports retries and handles connection/disconnection events.
- Exposes asynchronous methods for connection and sending.

### 4. Specific Handlers

- Example: A handler that receives MQTT messages, parses and enriches them, and sends them to Kafka using topics based on the original MQTT topic.
- Allows flexibility for other flows or processing needs.

### 5. Kafka Consumer for InfluxDB

- Subscribes to Kafka topics configured in `ALLOWED_TOPICS`.
- Processes each message, extracts data, and writes points to InfluxDB.
- Uses the official `@influxdata/influxdb-client` library.
- Handles disconnection and graceful shutdown.

---

## Environment Variables

```env
MQTT_BROKER_URL=mqtts://l46d1e5e.ala.us-east-1.emqxsl.com:8883
MQTT_USERNAME=big-data-001
MQTT_PASSWORD=1Q2W3E4R5T6Y
KAFKA_CLIENT_ID=mqtt-to-kafka-bridge
KAFKA_BROKERS=localhost:9092
INFLUX_URL=https://172.20.10.4:8086
INFLUX_ORG=my-org
INFLUX_BUCKET=iot-bucket
ALLOWED_TOPICS=IDGS10-Pruebas-Sensores
