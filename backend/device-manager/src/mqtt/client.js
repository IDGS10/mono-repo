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
exports.mqttService = exports.MqttService = void 0;
exports.startMqttClient = startMqttClient;
const mqtt_1 = __importStar(require("mqtt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
require("dotenv/config");
const index_1 = require("./handler/index");
const producer_kafka_1 = require("../kafka/producer-kafka");
//Enviroment credentials definition
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
//Path To the Certificate 
const CA_FILE = path.resolve(__dirname, './certs/emqxsl_ca.pem');
class MqttService {
    //Definition of the params
    client = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    isConnected = false;
    handlerManager = (0, index_1.createHandlerManager)();
    //Client Initialization && Connection
    async start() {
        try {
            const caCert = fs.readFileSync(CA_FILE);
            this.client = mqtt_1.default.connect(MQTT_BROKER_URL, {
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
                this.client.on('connect', () => resolve(this.client));
                this.client.on('error', reject);
            });
        }
        catch (error) {
            console.error('Error iniciando cliente MQTT:', error);
            throw error;
        }
    }
    setupEventHandlers() {
        if (!this.client)
            return;
        this.client.on('connect', () => {
            console.log('MQTT conectado al broker');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            //The client subscribs to All Topics
            this.client.subscribe('/#', { qos: 1 }, (err) => {
                if (err) {
                    console.error('Error suscribiendo al tópico global (/#):', err);
                }
                else {
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
            }
            catch (error) {
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
    async stop() {
        if (this.client) {
            await new Promise((resolve) => {
                this.client.end(() => {
                    console.log('Cliente MQTT desconectado');
                    resolve();
                });
            });
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.MqttService = MqttService;
exports.mqttService = new MqttService();
function startMqttClient() {
    return (0, producer_kafka_1.connectProducer)()
        .then(() => exports.mqttService.start())
        .catch((err) => {
        console.error('Error iniciando MQTT y Kafka:', err);
        throw err;
    });
}
process.on('SIGINT', async () => {
    console.log('\nCerrando aplicación...');
    await exports.mqttService.stop();
    process.exit(0);
});
if (require.main === module) {
    startMqttClient().catch(console.error);
}
//# sourceMappingURL=client.js.map