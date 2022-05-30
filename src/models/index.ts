import { getRepositoryFor } from "..";

export function createModel<T>(modelClass: { new (...args: any[]): T }, params: any[]): T {
    const repository = getRepositoryFor(modelClass)

    const model = repository.getModel()
    model.init(params)

    return model as unknown as T
}