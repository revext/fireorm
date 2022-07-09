import { getRepositoryFor, Model } from "..";

export function createModel<T extends Model>(modelClass: { new (...args: any[]): T }, params: any[]): T {
    const repository = getRepositoryFor(modelClass)

    const model = repository.getModel()
    model.init(params)

    return model as unknown as T
}