import EngineInterface from '~/engine/EngineInterface';
import { QueryParam } from '~/types/queries/QueryParam';
import Model from '../models/Model';
export default abstract class Repository<T extends Model> {
    engine: EngineInterface;
    cachedModels: {
        [key: string]: T;
    };
    cachedSubCollections: {
        [key: string]: T[];
    };
    constructor(engine: EngineInterface);
    abstract getModel(): T;
    private cacheModels;
    private cacheSubCollection;
    private findCachedModel;
    updateMany(ids: string[], data: any, routeParams?: any): Promise<void>;
    update(id: string, data: any, routeParams?: any): Promise<void>;
    saveMany(models: T[]): Promise<T[]>;
    save(model: T): Promise<T>;
    query(queryParams: QueryParam[], routeParams?: any): Promise<T[]>;
    queryAsGroup(queryParams: QueryParam[]): Promise<T[]>;
    load(id: string, routeParams?: any, forceRefresh?: boolean): Promise<T>;
    loadMany(ids: string[], routeParams?: any, forceRefresh?: boolean): Promise<T[]>;
    snapshotListener(name: string, id: string, routeParams: any, onRecieve: ((entity: T) => void), onError?: ((error: Error) => void)): void;
    snapshotListenerForModel(name: string, model: T, onRecieve: ((entity: T) => void), onError?: ((error: Error) => void)): void;
    snapshotListenerMany(name: string, queryParams: QueryParam[], routeParams: any, onRecieve: ((entity: T[]) => void), onError?: ((error: Error) => void)): void;
    unsubscribe(name: string): void;
    hasListener(name: string): boolean;
    delete(id: string, routeParams?: any): Promise<void>;
    deleteModel(model: T): Promise<void>;
    deleteMany(ids: string[], routeParams?: any): Promise<void>;
    private getModelsBlueprint;
    loadCollection(routeParams?: any, forceRefresh?: boolean): Promise<T[]>;
}
