import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import { Model } from "..";

export function createModel<T extends Model>(modelClass: ConstructorFunction<T>, params: any[] = []): T {    
    const model = new modelClass()
    model.init(...params)

    return model as unknown as T
}