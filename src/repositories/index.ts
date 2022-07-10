import Model from "~/models/Model";
import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import Repository from "./Repository";
import { GlobalThisOrm } from "~/types/internal/GlobalThisOrm";


let gThis = (globalThis as GlobalThisOrm)
gThis._repositoryMapping = new Map<string, Repository<any>>();


export function registerRepository<K extends Repository<T>, T extends Model>(repositoryName: ConstructorFunction<K>) {
  const repository = new repositoryName(gThis._engine)
  gThis._repositoryMapping.set(repository.getModel().getModelName(), repository)
}

export function registerRepositories(repositories: ConstructorFunction<Repository<Model>>[]) {
  repositories.forEach(repository => {
    registerRepository(repository)
  })
}

export function getRepositoryFor<R extends Repository<Model>>(modelClass: ConstructorFunction<unknown>): R {
  if(!modelClass) {
    throw new Error(`'modelClass' is not defined on the property, also check if your property has a default value`)
  }
  const modelName = (new modelClass() as Model).getModelName()
  if(!gThis._repositoryMapping.has(modelName)) {
      throw new Error(`No repository found for ${modelName}`);
  }
  const repository = gThis._repositoryMapping.get(modelName) as R
  return repository
}