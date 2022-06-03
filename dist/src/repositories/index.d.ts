import Model from "~/models/Model";
import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import Repository from "./Repository";
export declare function registerRepository<K extends Repository<T>, T extends Model>(repositoryName: ConstructorFunction<K>): void;
export declare function registerRepositories(repositories: ConstructorFunction<Repository<Model>>[]): void;
export declare function getRepositoryFor<R extends Repository<Model>>(modelClass: ConstructorFunction<unknown>): R;
