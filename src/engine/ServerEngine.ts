import Model from '~/models/Model';
import admin from 'firebase-admin'
import EngineInterface from "~/engine/EngineInterface";
import { QueryParam } from '~/types/queries/QueryParam';
import { Blueprint } from '~/models/Blueprint';
import { ConstructorFunction } from '~/types/functions/ConstructorFunction';

export default class ServerEngine implements EngineInterface {
  app: admin.app.App
  db: admin.firestore.Firestore
  transaction: admin.firestore.Transaction = null
  batch: admin.firestore.WriteBatch = null

  // listeners: { [key: string]: admin.firestore.Su } = {}

  inTransaction: boolean = false

  constructor(app: admin.app.App) {
    this.app = app
    this.db = app.firestore()
  }

  save<T extends Model>(model: T): Promise<T> {
    const blueprint = model.getBlueprint()
    return (new Promise((resolve, reject) => {
      try {
        // if model has id, then update firestore document otherwise add firestore document to collection
        if (model.id) {
          if(this.transaction){
            this.transaction.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson())
            resolve(model)
          } else if(this.batch){
            this.batch.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson())
            resolve(model)
          } else {
            this.db.collection(blueprint.buildCollectionRoute())
              .withConverter(this.getConverter<T>(blueprint.constructorFunction))
              .doc(model.id).set(model).then(() => {
                resolve(model)
              })
          }
        } else {
          if(this.transaction){
            const docRef = this.db.collection(blueprint.buildCollectionRoute()).doc()
            model.id = docRef.id
            this.transaction.set(docRef, model.toJson())
            resolve(model)
          } else if(this.batch){
            const docRef = this.db.collection(blueprint.buildCollectionRoute()).doc()
            model.id = docRef.id
            this.batch.set(docRef, model.toJson())
            resolve(model)
          } else {
            let docRef = this.db.collection(blueprint.buildCollectionRoute())
              .withConverter(this.getConverter<T>(blueprint.constructorFunction)).doc()
            model.id = docRef.id
            this.db.collection(blueprint.buildCollectionRoute()).doc(model.id).set(model).then(() => {
                resolve(model)
              })
          }
        }
      } catch(e) {
        reject(e)
      }
    }))
  }

  saveMany<T extends Model>(models: T[]): Promise<T[]> {
    return (new Promise((resolve, reject) => {
      try {
        const promises = models.map(model => this.save(model))
        Promise.all(promises).then(resolve)
      } catch(e) {
        reject(e)
      }
    }))
  }

  update<T extends Model>(blueprint: Blueprint<T>, id: string, data: any): Promise<void> {
    return (new Promise((resolve, reject) => {
      try {
        if(this.transaction){
          this.transaction.update(this.db.collection(blueprint.buildCollectionRoute()).doc(id), data)
          resolve()
        } else if(this.batch){
          this.batch.update(this.db.collection(blueprint.buildCollectionRoute()).doc(id), data)
          resolve()
        } else {
          this.db.collection(blueprint.buildCollectionRoute())
            .withConverter(this.getConverter<T>(blueprint.constructorFunction))
            .doc(id).update(data).then(() => {
              resolve()
            })
        }
      } catch(e) {
        reject(e)
      }
    }))
  }

  async updateMany<T extends Model>(blueprint: Blueprint<T>, ids: string[], data: any): Promise<void> {
    return (new Promise((resolve, reject) => {
      try {
        const promises = ids.map(id => this.update(blueprint, id, data))
        Promise.all(promises).then(() => resolve())
      } catch(e) {
        reject(e)
      }
    }))
  }


  async load<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<T> {
    if(this.batch){
      throw new Error('Cannot load in batch')
    }

    const query = this.db.collection(blueprint.buildCollectionRoute()).doc(id)
      .withConverter(this.getConverter<T>(blueprint.constructorFunction))
      

    if(this.transaction){
      return (await this.transaction.get(query)).data() as T
    } else {
      return (await query.get()).data() as T
    }
  }

  async loadMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<T[]> {
    if(this.batch){
      throw new Error('Cannot loadMany in batch')
    }

    const docRefs = ids.map(id => this.db.collection(blueprint.buildCollectionRoute())
      .withConverter(this.getConverter<T>(blueprint.constructorFunction)).doc(id))

    if(this.transaction){
      return (await this.transaction.getAll(...docRefs)).map(d => d.data() as T)
    } else {
      return (await this.db.getAll(...docRefs)).map(d => d.data() as T)
    }
  }

  async loadCollection<T extends Model>(blueprint: Blueprint<T>): Promise<T[]> {
    if(this.batch){
      throw new Error('Cannot loadCollection in batch')
    }

    const query = this.db.collection(blueprint.buildCollectionRoute())
      .withConverter(this.getConverter<T>(blueprint.constructorFunction))
    
    if(this.transaction){
      return (await this.transaction.get(query)).docs.map(d => d.data() as T)
    } else {
      return (await query.get()).docs.map(d => d.data() as T)
    }
  }

  //TODO other paramters, like limit, startAt, etc...
  async query<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]> {
      if(this.batch){
        throw new Error('Cannot query in batch')
      }

      let query = this.db.collection(blueprint.buildCollectionRoute()).withConverter(this.getConverter<T>(blueprint.constructorFunction))

      queryParams.forEach(param => {
        query = query.where(param.field, param.op, param.value) as any
      })
  
      if(this.transaction){
        return (await this.transaction.get(query)).docs.map(d => d.data() as T)
      } else {
        return (await query.get()).docs.map(d => d.data() as T)
      }
       
  }

  async queryAsGroup<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]> {
    if(this.batch){
      throw new Error('Cannot queryAsGroup in batch')
    }

    let query = this.db.collectionGroup(blueprint.getSubCollectionName()).withConverter(this.getConverter<T>(blueprint.constructorFunction))
    
    queryParams.forEach(param => {
      query = query.where(param.field, param.op, param.value) as any
    })

    if(this.transaction){
      return (await this.transaction.get(query)).docs.map(d => d.data() as T)
    } else {
      return (await query.get()).docs.map(d => d.data() as T)
    }
  }

  snapshotListener<T extends Model>(name: string, blueprint: Blueprint<T>, id: string, onRecieve: ((entity: T) => void), onError: ((error: Error) => void)): void {
      throw new Error('Not implemented')
  }
  

  snapshotListenerMany<T extends Model>(name: string, blueprint: Blueprint<T>, queryParams: QueryParam[], onRecieve: ((entities: T[]) => void), onError: ((error: Error) => void)): void {
    throw new Error('Not implemented')
  }

  unsubscribeListener(name: string): void {
    throw new Error('Not implemented')
  }

  hasListener(name: string): boolean {
    throw new Error('Not implemented')
  }

  delete<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<void> {
    return (new Promise((resolve, reject) => {
      try {
        if(this.transaction){
          this.transaction.delete(this.db.collection(blueprint.buildCollectionRoute()).doc(id))
          resolve()
        } else if(this.batch){
          this.batch.delete(this.db.collection(blueprint.buildCollectionRoute()).doc(id))
          resolve()
        } else {
          this.db.collection(blueprint.buildCollectionRoute())
            .withConverter(this.getConverter<T>(blueprint.constructorFunction))
            .doc(id).delete().then(() => {
              resolve()
            })
        }
      } catch(e) {
        reject(e)
      }
    }))
  }

  deleteMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<void> {
    return (new Promise((resolve, reject) => {
      try {
        const promises = ids.map(id => this.delete(blueprint, id))
        Promise.all(promises).then(() => resolve())
      } catch(e) {
        reject(e)
      }
    }))
  }

  convertToTimestamp(date: Date): admin.firestore.Timestamp{
    return admin.firestore.Timestamp.fromDate(date)
  }

  convertFromTimestamp(timestamp: admin.firestore.Timestamp){
    return timestamp.toDate()
  }


  getConverter<T extends Model>(constructor: ConstructorFunction<T>) {
    return {
      toFirestore (item: T): admin.firestore.DocumentData {
        return item.toJson()
      },
      fromFirestore (
        snapshot: admin.firestore.QueryDocumentSnapshot,
      ): T {
        const data = snapshot.data()
        data.id = snapshot.id
        return (new constructor()).fromJson(data)
      }
    }
  }

  async runTransaction(operations: (() => Promise<void>)): Promise<any> {
    return this.db.runTransaction(async transaction => {
      this.transaction = transaction
      return await operations()
    }).then((result) => {
      this.transaction = null
      return result
    }).catch(e => {
      this.transaction = null
      throw e
    })
  }

  //TODO over 500 operations per transaction check
  async runBatch(operations: (() => Promise<void>)): Promise<any> {
    this.batch = this.db.batch()

    const result = await operations()

    return await this.batch.commit().then(() => {
      this.batch = null

      return result
    }).catch(e => {
      this.batch = null

      throw e
    })
  }

  //TODO delete operation
}