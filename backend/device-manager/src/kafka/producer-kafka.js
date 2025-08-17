"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaProducerService = void 0;
exports.connectProducer = connectProducer;
exports.sendMessage = sendMessage;
// Load environment variables from the .env file located one level up
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const kafkajs_1 = require("kafkajs");
// KafkaProducerService: responsible for producing messages
class KafkaProducerService {
    kafka;
    producer;
    admin;
    isConnected = false;
    connectionPromise = null;
    constructor(config) {
        this.kafka = new kafkajs_1.Kafka({
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
            createPartitioner: kafkajs_1.Partitioners.LegacyPartitioner,
        });
        this.admin = this.kafka.admin();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
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
    async connect() {
        if (this.connectionPromise)
            return this.connectionPromise;
        if (this.isConnected)
            return Promise.resolve();
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
    async disconnect() {
        if (this.isConnected) {
            await Promise.all([
                this.producer.disconnect(),
                this.admin.disconnect(),
            ]);
            this.isConnected = false;
        }
    }
    async ensureTopicExists(topic) {
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
    async sendMessage(topic, message, metadata) {
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
        const record = {
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
        }
        catch (error) {
            console.error('Error sending message to Kafka:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
// Load Kafka config from environment variables
const clientId = process.env.KAFKA_CLIENT_ID;
const brokersEnv = process.env.KAFKA_BROKERS;
if (!clientId)
    throw new Error('KAFKA_CLIENT_ID is not defined in .env');
if (!brokersEnv)
    throw new Error('KAFKA_BROKERS is not defined in .env');
const brokers = brokersEnv.split(',').map((broker) => broker.trim());
// Create a single instance of KafkaProducerService
const kafkaProducerService = new KafkaProducerService({ clientId, brokers });
exports.kafkaProducerService = kafkaProducerService;
// Exported utility function to ensure Kafka connection is established
async function connectProducer() {
    return kafkaProducerService.connect();
}
// Exported utility function to send messages without directly accessing the service
async function sendMessage(topic, message) {
    return kafkaProducerService.sendMessage(topic, message);
}
// Graceful shutdown on app termination
process.on('SIGINT', async () => {
    console.log('\nShutting down Kafka Producer...');
    await kafkaProducerService.disconnect();
});
process.on('SIGTERM', async () => {
    console.log('\nShutting down Kafka Producer...');
    await kafkaProducerService.disconnect();
});
//# sourceMappingURL=producer-kafka.js.map