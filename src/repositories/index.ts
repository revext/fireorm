import Model from "~/models/Model";
import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import Repository from "./Repository";
import Commons from "../utilities/Commons"
import { useEngine } from "..";
import { GlobalThisOrm } from "~/types/internal/GlobalThisOrm";


let gThis = (globalThis as GlobalThisOrm)
gThis._repositoryMapping = new Map<string, Repository<any>>();

export function registerRepository<K extends Repository<T>, T extends Model>(repositoryName: ConstructorFunction<K>) {
  const repository = new repositoryName(gThis._engine)
  gThis._repositoryMapping.set(Commons.getConstructor(repository.getModel()).name, repository)
}

export function registerRepositories(repositories: ConstructorFunction<Repository<Model>>[]) {
  repositories.forEach(repository => {
    registerRepository(repository)
  })
}

export function getRepositoryFor<R extends Repository<Model>>(modelClass: ConstructorFunction<unknown>): R {
  if(!gThis._repositoryMapping.has(modelClass.name)) {
      throw new Error(`No repository found for ${modelClass.name}`);
  }
  const repository = gThis._repositoryMapping.get(modelClass.name) as R
  return repository
}