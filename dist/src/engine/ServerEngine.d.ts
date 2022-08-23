import Model from '~/models/Model';
import admin from 'firebase-admin';
import EngineInterface from "~/engine/EngineInterface";
import { QueryParam } from '~/types/queries/QueryParam';
import { Blueprint } from '~/models/Blueprint';
import { ConstructorFunction } from '~/types/functions/ConstructorFunction';
export default class ServerEngine implements EngineInterface {
    app: admin.app.App;
    db: admin.firestore.Firestore;
    transaction: admin.firestore.Transaction;
    batch: admin.firestore.WriteBatch;
    inTransaction: boolean;
    constructor(app: admin.app.App);
    save<T extends Model>(model: T): Promise<T>;
    saveMany<T extends Model>(models: T[]): Promise<T[]>;
    update<T extends Model>(blueprint: Blueprint<T>, id: string, data: any): Promise<void>;
    updateMany<T extends Model>(blueprint: Blueprint<T>, ids: string[], data: any): Promise<void>;
    load<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<T>;
    loadMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<T[]>;
    loadCollection<T extends Model>(blueprint: Blueprint<T>): Promise<T[]>;
    query<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]>;
    queryAsGroup<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]>;
    snapshotListener<T extends Model>(name: string, blueprint: Blueprint<T>, id: string, onRecieve: ((entity: T) => void), onError: ((error: Error) => void)): void;
    snapshotListenerMany<T extends Model>(name: string, blueprint: Blueprint<T>, queryParams: QueryParam[], onRecieve: ((entities: T[]) => void), onError: ((error: Error) => void)): void;
    unsubscribeListener(name: string): void;
    hasListener(name: string): boolean;
    delete<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<void>;
    deleteMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<void>;
    convertToTimestamp(date: Date): admin.firestore.Timestamp;
    convertFromTimestamp(timestamp: admin.firestore.Timestamp): Date;
    getConverter<T extends Model>(constructor: ConstructorFunction<T>): {
        toFirestore(item: T): admin.firestore.DocumentData;
        fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot): T;
    };
    runTransaction(operations: (() => Promise<void>)): Promise<any>;
    runBatch(operations: (() => Promise<void>)): Promise<any>;
}
