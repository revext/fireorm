import { Model } from "..";

export function createModel<T extends Model>(modelClass: { new (...args: any[]): T }, params: any[] = []): T {    
    const model = new modelClass()
    model.init(...params)

    return model as unknown as T
}