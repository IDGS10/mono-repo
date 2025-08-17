// Load environment variables from the .env file located one level up
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Kafka, Producer, ProducerRecord, Partitioners, Admin } from 'kafkajs';

// Interface to define the basic Kafka configuration
interface KafkaConfig {
  clientId: string;
  brokers: string[];
}

// Interface for enriching messages with metadata
interface MessageMetadata {
  timestamp: number;
  source: string;
  messageId: string;
}

// KafkaProducerService: responsible for producing messages
class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false, // controlamos la creación explícitamente
      transactionTimeout: 30000,
      createPartitioner: Partitioners.LegacyPartitioner,
    });

    this.admin = this.kafka.admin();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.producer.on('producer.connect', () => {
      console.log(' Kafka Producer connected');
      this.isConnected = true;
    });

    this.producer.on('producer.disconnect', () => {
      console.log(' Kafka Producer disconnected');
      this.isConnected = false;
    });

    this.producer.on('producer.network.request_timeout', (payload) => {
      console.error(' Kafka Producer request timeout:', payload);
    });
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;
    if (this.isConnected) return Promise.resolve();

    this.connectionPromise = Promise.all([
      this.producer.connect(),
      this.admin.connect(),
    ]).then(() => {
      this.isConnected = true;
    }).catch((err) => {
      this.isConnected = false;
      throw err;
    }).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await Promise.all([
        this.producer.disconnect(),
        this.admin.disconnect(),
      ]);
      this.isConnected = false;
    }
  }

  private async ensureTopicExists(topic: string): Promise<void> {
    const topics = await this.admin.listTopics();
    if (!topics.includes(topic)) {
      console.log(`Topic "${topic}" no existe. Creándolo...`);
      await this.admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: 1, // ajustar según necesidad
            replicationFactor: 1, // ajustar según cluster
          },
        ],
      });
      console.log(`Topic "${topic}" creado.`);
    }
  }

  async sendMessage(topic: string, message: string, metadata?: Partial<MessageMetadata>): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.ensureTopicExists(topic);

    const enrichedMessage = {
      payload: message,
      metadata: {
        timestamp: Date.now(),
        source: 'mqtt-bridge',
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...metadata,
      },
    };

    const record: ProducerRecord = {
      topic,
      messages: [
        {
          value: JSON.stringify(enrichedMessage),
          timestamp: enrichedMessage.metadata.timestamp.toString(),
        },
      ],
    };

    try {
      const result = await this.producer.send(record);
      console.log(`Message sent to Kafka topic "${topic}":`, result);
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Load Kafka config from environment variables
const clientId = process.env.KAFKA_CLIENT_ID;
const brokersEnv = process.env.KAFKA_BROKERS;

if (!clientId) throw new Error('KAFKA_CLIENT_ID is not defined in .env');
if (!brokersEnv) throw new Error('KAFKA_BROKERS is not defined in .env');

const brokers = brokersEnv.split(',').map((broker) => broker.trim());

// Create a single instance of KafkaProducerService
const kafkaProducerService = new KafkaProducerService({ clientId, brokers });

// Exported utility function to ensure Kafka connection is established
export async function connectProducer(): Promise<void> {
  return kafkaProducerService.connect();
}

// Exported utility function to send messages without directly accessing the service
export async function sendMessage(topic: string, message: string): Promise<void> {
  return kafkaProducerService.sendMessage(topic, message);
}

// Export the full service in case advanced use is needed
export { kafkaProducerService };

// Graceful shutdown on app termination
process.on('SIGINT', async () => {
  console.log('\nShutting down Kafka Producer...');
  await kafkaProducerService.disconnect();
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down Kafka Producer...');
  await kafkaProducerService.disconnect();
});
