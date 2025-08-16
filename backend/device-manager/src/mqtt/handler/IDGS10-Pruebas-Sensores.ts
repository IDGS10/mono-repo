import { sendMessage } from '../../kafka/producer-kafka';

export default async function (msg: string, topic?: string) {
  try {
const kafkaTopic = topic ? topic.replace(/^\/+/, '').replace(/\//g, '-') : 'default-topic';
    let parsed;

    try {
      parsed = JSON.parse(msg);
    } catch {
      parsed = msg;
    }

    const enrichedMessage = {
      topic,
      timestamp: new Date().toISOString(),
      data: parsed,
      source: 'mqtt-prueba-handler',
    };

    await sendMessage(kafkaTopic, JSON.stringify(enrichedMessage));

    console.log(` Mensaje enviado a Kafka en tópico ${kafkaTopic}`);
  } catch (error) {
    console.error(' Error enviando mensaje a Kafka:', error);
  }
}
