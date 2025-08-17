"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const producer_kafka_1 = require("../../kafka/producer-kafka");
async function default_1(msg, topic) {
    try {
        const kafkaTopic = topic ? topic.replace(/^\/+/, '').replace(/\//g, '-') : 'default-topic';
        let parsed;
        try {
            parsed = JSON.parse(msg);
        }
        catch {
            parsed = msg;
        }
        const enrichedMessage = {
            topic,
            timestamp: new Date().toISOString(),
            data: parsed,
            source: 'mqtt-prueba-handler',
        };
        await (0, producer_kafka_1.sendMessage)(kafkaTopic, JSON.stringify(enrichedMessage));
        console.log(` Mensaje enviado a Kafka en tópico ${kafkaTopic}`);
    }
    catch (error) {
        console.error(' Error enviando mensaje a Kafka:', error);
    }
}
//# sourceMappingURL=IDGS10-Pruebas-Sensores.js.map