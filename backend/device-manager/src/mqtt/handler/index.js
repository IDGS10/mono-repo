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
exports.createHandlerManager = createHandlerManager;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
//Creation of the handler manager
//Imports the handlerConfig and params && and build the constructor
class HandlerManager {
    handlers = {};
    handlerConfigs = {};
    constructor() {
        this.loadHandlers(__dirname);
    }
    loadHandlers(dir, baseTopic = '') {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                //Avoid the possible files with a malicious name, just use the index.ts or .js
                if (stat.isDirectory()) {
                    this.loadHandlers(fullPath, `${baseTopic}/${file}`);
                }
                else if ((file.endsWith('.ts') || file.endsWith('.js')) && /^[a-zA-Z0-9_\-]+\.([tj]s)$/.test(file)) {
                    if (file === 'index.ts' || file === 'index.js')
                        continue;
                    this.loadHandler(fullPath, baseTopic, file);
                }
            }
        }
        catch (error) {
            console.error(`Error cargando handlers desde ${dir}:`, error);
        }
    }
    //Creation of the handler and load them, and verify if a topic already exists
    loadHandler(fullPath, baseTopic, file) {
        try {
            const topic = `${baseTopic}/${file.replace(/\.(ts|js)$/, '')}`
                .replace(/[^a-zA-Z0-9\/_\-]/g, '')
                .replace(/\/+/g, '/');
            const mod = require(fullPath);
            const handler = mod.default || Object.values(mod)[0];
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
            }
            else {
                console.warn(`Handler no válido en archivo: ${file}`);
            }
        }
        catch (error) {
            console.error(`Error cargando handler ${file}:`, error);
        }
    }
    //Here a handler is registered, with his topic
    registerHandler(topic, handler) {
        this.handlers[topic] = handler;
        if (topic.endsWith('/')) {
            this.handlers[topic.slice(0, -1)] = handler;
        }
        else {
            this.handlers[topic + '/'] = handler;
        }
    }
    //If a handler that already exists, send the message to his topic
    async handleMessage(topic, msg) {
        const handler = this.findHandler(topic);
        if (handler) {
            await handler(msg, topic);
        }
        else {
            //Else the console prints a message that we recibe the topic and the messages but didn´t save them because it doesn´t exist they are like trash
            console.warn(` No handler registrado para tópico "${topic}", mensaje ignorado.`);
        }
    }
    //This function search if a topic already exists, in the handlers objects using a method for and return it else return an undefined
    findHandler(topic) {
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
    matchMqttTopic(pattern, topic) {
        const patternParts = pattern.split('/');
        const topicParts = topic.split('/');
        for (let i = 0, j = 0; i < patternParts.length; i++, j++) {
            const p = patternParts[i];
            const t = topicParts[j];
            if (p === '#') {
                return true;
            }
            if (p === '+') {
                if (t === undefined)
                    return false;
                continue;
            }
            if (p !== t) {
                return false;
            }
        }
        return patternParts.length === topicParts.length;
    }
    getHandlers() {
        return { ...this.handlers };
    }
    getHandlerConfigs() {
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
function createHandlerManager() {
    return new HandlerManager();
}
//# sourceMappingURL=index.js.map