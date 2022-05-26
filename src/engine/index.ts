import EngineInterface from "~/engine/EngineInterface";
import { GlobalThisOrm } from "~/types/internal/GlobalThisOrm";

// type OrmMode = 'server' | 'client';
let gThis = (globalThis as GlobalThisOrm)

gThis._engine = null

export function startOrm(engine: EngineInterface) {
  gThis._engine = engine
}

export function useEngine(): EngineInterface {
  return gThis._engine
}

export async function runTransaction(operations: () => Promise<any>): Promise<any> {
  return await gThis._engine.runTransaction(operations)
}

export async function runBatch(operations: () => Promise<any>): Promise<any> {
  return await gThis._engine.runBatch(operations)
}