import { Blueprint } from "~/models/Blueprint"
import Model from "~/models/Model"
import { ConstructorFunction } from "~/types/functions/ConstructorFunction"
import { QueryParam } from "~/types/queries/QueryParam"


export default interface EngineInterface {
    transaction: any
    batch: any

    //save methods are saving models to the database which has been fetched from the database
    save<T extends Model>(model: T): Promise<T>
    saveMany<T extends Model>(models: T[]): Promise<T[]>

    //update methods are updating the models int the database without the need to fetch them first
    update<T extends Model>(blueprint: Blueprint<T>, id: string, data: any): Promise<void>
    updateMany<T extends Model>(blueprint: Blueprint<T>, ids: string[], data: any): Promise<void>

    //loads the model a model from the database
    load<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<T>
    //loads the models with the given ids from the db, using the blueprint model as path
    loadMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<T[]>
    //loads the subcollection defined on the blueprints route
    loadCollection<T extends Model>(blueprint: Blueprint<T>): Promise<T[]>

    //queries the database on the route of the blueprint
    query<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]>
    //queries the database on all the subcollections with the same name as the blueprint
    queryAsGroup<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]>

    snapshotListener<T extends Model>(name: string, blueprint: Blueprint<T>, id: string, onRecieve: ((entity: T) => void)): void
    snapshotListenerMany<T extends Model>(name: string, blueprint: Blueprint<T>, queryParams: QueryParam[], onRecieve: ((entities: T[]) => void)): void
    unsubscribeListener(name: string): void 
    hasListener(name: string): boolean

    delete<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<void>
    deleteMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<void>
    
    //shared methods: create, update, set, delete
    //only transaction methods: get, getAll
    runTransaction(operations: (() => Promise<void>)): Promise<any>
    runBatch(operations: (() => Promise<void>)): Promise<any>

    //convert the date object to timestamp
    convertToTimestamp(date: Date): any
    convertFromTimestamp(timestamp: any): Date

    getConverter<T extends Model>(constructor: ConstructorFunction<T>): any

    //TODO delete operations
}