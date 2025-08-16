import { MqttClient } from 'mqtt';
import 'dotenv/config';
export declare class MqttService {
    private client;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private isConnected;
    private handlerManager;
    start(): Promise<MqttClient>;
    private setupEventHandlers;
    stop(): Promise<void>;
    getConnectionStatus(): boolean;
}
export declare const mqttService: MqttService;
export declare function startMqttClient(): Promise<MqttClient>;
//# sourceMappingURL=client.d.ts.map