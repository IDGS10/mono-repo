import mqtt, { MqttClient } from 'mqtt';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

import { createHandlerManager } from './handler/index';
import { sendMessage, connectProducer } from '../kafka/producer-kafka';


//Enviroment credentials definition
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL!;
const MQTT_USERNAME = process.env.MQTT_USERNAME!;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD!;

//Path To the Certificate 
const CA_FILE = path.resolve(__dirname, './certs/emqxsl_ca.pem');


export class MqttService {
  //Definition of the params
  private client: MqttClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  private handlerManager = createHandlerManager();
    //Client Initialization && Connection
  async start(): Promise<MqttClient> {
    try {
      const caCert = fs.readFileSync(CA_FILE);

      this.client = mqtt.connect(MQTT_BROKER_URL, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        ca: caCert,
        rejectUnauthorized: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        keepalive: 60,
      });

      this.setupEventHandlers();

      return new Promise((resolve, reject) => {
        this.client!.on('connect', () => resolve(this.client!));
        this.client!.on('error', reject);
      });
    } catch (error) {
      console.error('Error iniciando cliente MQTT:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('MQTT conectado al broker');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      //The client subscribs to All Topics
      this.client!.subscribe('/#', { qos: 1 }, (err) => {
        if (err) {
          console.error('Error suscribiendo al tópico global (/#):', err);
        } else {
          console.log('Suscrito a todos los tópicos (/#)');
        }
      });
    });
    //Client recibe messages 
    this.client.on('message', async (topic, message) => {
      try {
        const msgString = message.toString();
        console.log(`Mensaje recibido en tópico ${topic}: ${msgString}`);

        await this.handlerManager.handleMessage(topic, msgString);
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    });
    //Disconnection
    this.client.on('disconnect', () => {
      console.log('MQTT desconectado del broker');
      this.isConnected = false;
    });
    //Reconection, The client try to connect just at the number of attempts definied in line 23
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`Reintentando conexión MQTT (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Máximo número de reintentos alcanzado');
        this.client?.end();
      }
    });

    this.client.on('error', (err) => {
      console.error('Error MQTT:', err);
    });
  }

  async stop(): Promise<void> {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client!.end(() => {
          console.log('Cliente MQTT desconectado');
          resolve();
        });
      });
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const mqttService = new MqttService();

export function startMqttClient(): Promise<MqttClient> {
  return connectProducer()
    .then(() => mqttService.start())
    .catch((err) => {
      console.error('Error iniciando MQTT y Kafka:', err);
      throw err;
    });
}

process.on('SIGINT', async () => {
  console.log('\nCerrando aplicación...');
  await mqttService.stop();
  process.exit(0);
});

if (require.main === module) {
  startMqttClient().catch(console.error);
}
