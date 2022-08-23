import Model from '~/models/Model';
import { FirebaseApp } from "@firebase/app";
import { DocumentData, Firestore, QueryDocumentSnapshot, Timestamp, Transaction, Unsubscribe, WriteBatch } from "@firebase/firestore";
import EngineInterface from "~/engine/EngineInterface";
import { QueryParam } from '~/types/queries/QueryParam';
import { Blueprint } from '~/models/Blueprint';
import { ConstructorFunction } from '~/types/functions/ConstructorFunction';
export default class ClientEngine implements EngineInterface {
    app: FirebaseApp;
    db: Firestore;
    transaction: Transaction;
    batch: WriteBatch;
    listeners: {
        [key: string]: Unsubscribe;
    };
    inTransaction: boolean;
    constructor(app: FirebaseApp);
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
    convertToTimestamp(date: Date): Timestamp;
    convertFromTimestamp(timestamp: Timestamp): Date;
    getConverter<T extends Model>(constructor: ConstructorFunction<T>): {
        toFirestore(item: T): DocumentData;
        fromFirestore(snapshot: QueryDocumentSnapshot<T>): T;
    };
    runTransaction(operations: (() => Promise<void>)): Promise<any>;
    runBatch(operations: (() => Promise<void>)): Promise<any>;
}
