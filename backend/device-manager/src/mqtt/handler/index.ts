import * as fs from 'fs';
import * as path from 'path';

type HandlerFn = (msg: string, topic?: string) => Promise<void>;
//Definition of the handler manager
interface HandlerConfig {
  topic: string;
  handler: HandlerFn;
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
  };
}
//Creation of the handler manager
//Imports the handlerConfig and params && and build the constructor
class HandlerManager {
  private handlers: Record<string, HandlerFn> = {};
  private handlerConfigs: Record<string, HandlerConfig> = {};

  constructor() {
    this.loadHandlers(__dirname);
  }

  private loadHandlers(dir: string, baseTopic = '') {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        //Avoid the possible files with a malicious name, just use the index.ts or .js
        if (stat.isDirectory()) {
          this.loadHandlers(fullPath, `${baseTopic}/${file}`);
        }else if ((file.endsWith('.ts') || file.endsWith('.js')) && /^[a-zA-Z0-9_\-]+\.([tj]s)$/.test(file)) {
          if (file === 'index.ts' || file === 'index.js') continue;

          this.loadHandler(fullPath, baseTopic, file);
        }
      }
    } catch (error) {
      console.error(`Error cargando handlers desde ${dir}:`, error);
    }
  }
//Creation of the handler and load them, and verify if a topic already exists
  private loadHandler(fullPath: string, baseTopic: string, file: string) {
    try {
const topic = `${baseTopic}/${file.replace(/\.(ts|js)$/, '')}`
  .replace(/[^a-zA-Z0-9\/_\-]/g, '') 
  .replace(/\/+/g, '/');
      const mod = require(fullPath);
      const handler: HandlerFn = mod.default || Object.values(mod)[0];

      if (typeof handler === 'function') {
        this.registerHandler(topic, handler);

        if (mod.config) {
          this.handlerConfigs[topic] = {
            topic,
            handler,
            metadata: mod.config,
          };
        }

        console.log(`Handler cargado para: ${topic}`);
      } else {
        console.warn(`Handler no válido en archivo: ${file}`);
      }
    } catch (error) {
      console.error(`Error cargando handler ${file}:`, error);
    }
  }
//Here a handler is registered, with his topic
  private registerHandler(topic: string, handler: HandlerFn) {
    this.handlers[topic] = handler;
    if (topic.endsWith('/')) {
      this.handlers[topic.slice(0, -1)] = handler;
    } else {
      this.handlers[topic + '/'] = handler;
    }
  }
  //If a handler that already exists, send the message to his topic
  async handleMessage(topic: string, msg: string): Promise<void> {
    const handler = this.findHandler(topic);
    if (handler) {
      await handler(msg, topic);
    } else {
  //Else the console prints a message that we recibe the topic and the messages but didn´t save them because it doesn´t exist they are like trash
      console.warn(` No handler registrado para tópico "${topic}", mensaje ignorado.`);
    }
  }
  //This function search if a topic already exists, in the handlers objects using a method for and return it else return an undefined
  findHandler(topic: string): HandlerFn | undefined {
    if (this.handlers[topic]) {
      return this.handlers[topic];
    }

    for (const handlerTopic in this.handlers) {
      if (this.matchMqttTopic(handlerTopic, topic)) {
        return this.handlers[handlerTopic];
      }
    }
    return undefined;
  }
   //Declare the function, to match a topic from mqtt and the backend and compare them
  private matchMqttTopic(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    for (let i = 0, j = 0; i < patternParts.length; i++, j++) {
      const p = patternParts[i];
      const t = topicParts[j];

      if (p === '#') {
        return true;
      }
      if (p === '+') {
        if (t === undefined) return false;
        continue;
      }
      if (p !== t) {
        return false;
      }
    }
    return patternParts.length === topicParts.length;
  }

  getHandlers(): Record<string, HandlerFn> {
    return { ...this.handlers };
  }

  getHandlerConfigs(): HandlerConfig[] {
    return Object.values(this.handlerConfigs);
  }

  getStats() {
    return {
      totalHandlers: Object.keys(this.handlers).length,
      topics: Object.keys(this.handlers),
      configs: Object.values(this.handlerConfigs).length,
    };
  }
}
//Export the function
export function createHandlerManager(): HandlerManager {
  return new HandlerManager();
}
