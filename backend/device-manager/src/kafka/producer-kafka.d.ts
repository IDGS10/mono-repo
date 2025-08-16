interface KafkaConfig {
    clientId: string;
    brokers: string[];
}
interface MessageMetadata {
    timestamp: number;
    source: string;
    messageId: string;
}
declare class KafkaProducerService {
    private kafka;
    private producer;
    private admin;
    private isConnected;
    private connectionPromise;
    constructor(config: KafkaConfig);
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private ensureTopicExists;
    sendMessage(topic: string, message: string, metadata?: Partial<MessageMetadata>): Promise<void>;
    getConnectionStatus(): boolean;
}
declare const kafkaProducerService: KafkaProducerService;
export declare function connectProducer(): Promise<void>;
export declare function sendMessage(topic: string, message: string): Promise<void>;
export { kafkaProducerService };
//# sourceMappingURL=producer-kafka.d.ts.map