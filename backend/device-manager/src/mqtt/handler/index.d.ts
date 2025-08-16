type HandlerFn = (msg: string, topic?: string) => Promise<void>;
interface HandlerConfig {
    topic: string;
    handler: HandlerFn;
    metadata?: {
        description?: string;
        version?: string;
        author?: string;
    };
}
declare class HandlerManager {
    private handlers;
    private handlerConfigs;
    constructor();
    private loadHandlers;
    private loadHandler;
    private registerHandler;
    handleMessage(topic: string, msg: string): Promise<void>;
    findHandler(topic: string): HandlerFn | undefined;
    private matchMqttTopic;
    getHandlers(): Record<string, HandlerFn>;
    getHandlerConfigs(): HandlerConfig[];
    getStats(): {
        totalHandlers: number;
        topics: string[];
        configs: number;
    };
}
export declare function createHandlerManager(): HandlerManager;
export {};
//# sourceMappingURL=index.d.ts.map