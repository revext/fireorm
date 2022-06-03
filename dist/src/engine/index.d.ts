import EngineInterface from "~/engine/EngineInterface";
export declare function startOrm(engine: EngineInterface): void;
export declare function useEngine(): EngineInterface;
export declare function runTransaction(operations: () => Promise<any>): Promise<any>;
export declare function runBatch(operations: () => Promise<any>): Promise<any>;
