import Model from '~/models/Model';
import { FirebaseApp, getApp } from "@firebase/app"
import { addDoc, collection, collectionGroup, deleteDoc, doc, DocumentData, DocumentSnapshot, Firestore, getDoc, getDocs, getFirestore, onSnapshot, query, QueryDocumentSnapshot, runTransaction, setDoc, Timestamp, Transaction, Unsubscribe, updateDoc, where, writeBatch, WriteBatch } from "@firebase/firestore"
import EngineInterface from "~/engine/EngineInterface";
import { QueryParam } from '~/types/queries/QueryParam';
import { Blueprint } from '~/models/Blueprint';
import { ConstructorFunction } from '~/types/functions/ConstructorFunction';

export default class ClientEngine implements EngineInterface {
  app: FirebaseApp
  db: Firestore
  transaction: Transaction = null
  batch: WriteBatch = null

  listeners: { [key: string]: Unsubscribe } = {}

  inTransaction: boolean = false

  constructor(app: FirebaseApp) {
    this.app = app
    this.db = getFirestore(app)
  }

  save<T extends Model>(model: T): Promise<T> {
    const blueprint = model.getBlueprint()
    return (new Promise((resolve, reject) => {
      try {
        // if model has id, then update firestore document otherwise add firestore document to collection
        if (model.id) {
          if(this.transaction){
            this.transaction.set(doc(this.db, blueprint.buildCollectionRoute(), model.id), model.toJson())
            resolve(model)
          } else if(this.batch){
            this.batch.set(doc(this.db, blueprint.buildCollectionRoute(), model.id), model.toJson())
            resolve(model)
          } else {

            setDoc(
                doc(this.db, blueprint.buildCollectionRoute(), model.id)
                .withConverter(this.getConverter<T>(blueprint.constructorFunction)), 
                model)
              .then(() => {
                resolve(model)
              })
          }
        } else {
          if(this.transaction){
            const docRef = doc(this.db, blueprint.buildCollectionRoute())
            model.id = docRef.id
            this.transaction.set(docRef, model.toJson())
            resolve(model)
          } else if(this.batch){
            const docRef = doc(this.db, blueprint.buildCollectionRoute())
            model.id = docRef.id
            this.batch.set(docRef, model.toJson())
            resolve(model)
          } else {
            addDoc(collection(this.db, blueprint.buildCollectionRoute())
              .withConverter(this.getConverter<T>(blueprint.constructorFunction)), 
            model).then(response => {
              model.id = response.id
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
          this.transaction.update(doc(this.db, blueprint.buildCollectionRoute(), id), data)
          resolve()
        } else if(this.batch){
          this.batch.update(doc(this.db, blueprint.buildCollectionRoute(), id), data)
          resolve()
        } else {
          updateDoc(
            doc(this.db, blueprint.buildCollectionRoute(), id)
            .withConverter(this.getConverter<T>(blueprint.constructorFunction)), 
            data)
          .then(() => {
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

    const query = doc(this.db, blueprint.buildCollectionRoute(), id).withConverter(this.getConverter<T>(blueprint.constructorFunction))

    if(this.transaction){
      return (await this.transaction.get(query)).data() as T
    } else {
      return (await getDoc(query)).data() as T
    }
  }

  async loadMany<T extends Model>(blueprint: Blueprint<T>, ids: string[]): Promise<T[]> {
    if(this.batch || this.transaction){
      throw new Error('Cannot loadMany in batch')
    }
    
    const docRefs = ids.map(id => doc(this.db, blueprint.buildCollectionRoute(), id).withConverter(this.getConverter<T>(blueprint.constructorFunction)))

    const promises: Promise<DocumentSnapshot<T>>[] = []
    docRefs.forEach(dRef => {
      if(this.transaction){
          promises.push(this.transaction.get(dRef))
      } else {
          promises.push(getDoc(dRef))
      }
    });
    return (await Promise.all(promises)).map(d => d.data() as T)

    
  }

  async loadCollection<T extends Model>(blueprint: Blueprint<T>): Promise<T[]> {
    if(this.batch){
      throw new Error('Cannot loadCollection in batch or transaction')
    }
    
    const query = collection(this.db, blueprint.buildCollectionRoute()).withConverter(this.getConverter<T>(blueprint.constructorFunction))
    
    return (await getDocs(query)).docs.map(d => d.data() as T)
  }

  //TODO other paramters, like limit, startAt, etc...
  async query<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]> {
      if(this.batch){
        throw new Error('Cannot query in batch or transaction')
      }

      const collectionRef = collection(this.db, blueprint.buildCollectionRoute()).withConverter(this.getConverter<T>(blueprint.constructorFunction))
      const wheres: any[] = []
      queryParams.forEach(param => {
        wheres.push(where(param.field, param.op, param.value))
      })
  
      return (await getDocs(query(collectionRef, ...wheres))).docs.map(d => d.data() as T)
       
  }

  async queryAsGroup<T extends Model>(blueprint: Blueprint<T>, queryParams: QueryParam[]): Promise<T[]> {
    if(this.batch){
      throw new Error('Cannot queryAsGroup in batch or transaction')
    }

    const collectionRef = collectionGroup(this.db, blueprint.getSubCollectionName()).withConverter(this.getConverter<T>(blueprint.constructorFunction))

    const wheres: any[] = []
    queryParams.forEach(param => {
      wheres.push(where(param.field, param.op, param.value))
    })

    return (await getDocs(query(collectionRef, ...wheres))).docs.map(d => d.data() as T)
  }

  snapshotListener<T extends Model>(name: string, blueprint: Blueprint<T>, id: string, onRecieve: ((entity: T) => void)): void {
    this.listeners[name] = onSnapshot(doc(this.db, blueprint.buildCollectionRoute(), id).withConverter(this.getConverter<T>(blueprint.constructorFunction)), (snapshot) => {
      onRecieve(snapshot.data() as T)
    })
  }
  

  snapshotListenerMany<T extends Model>(name: string, blueprint: Blueprint<T>, queryParams: QueryParam[], onRecieve: ((entities: T[]) => void)): void {
    const collectionRef = collection(this.db, blueprint.buildCollectionRoute()).withConverter(this.getConverter<T>(blueprint.constructorFunction))
    const wheres: any[] = []
    queryParams.forEach(param => {
      wheres.push(where(param.field, param.op, param.value))
    })

    this.listeners[name] = onSnapshot(query(collectionRef, ...wheres), (snapshot) => {
      onRecieve(snapshot.docs.map(d => d.data() as T))
    })
  }

  unsubscribeListener(name: string): void {
    if(this.listeners[name]){
      this.listeners[name]()
      delete this.listeners[name]
    }
  }

  hasListener(name: string): boolean {
    return this.listeners[name] !== undefined
  }

  delete<T extends Model>(blueprint: Blueprint<T>, id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if(this.batch){
          await this.batch.delete(doc(this.db, blueprint.buildCollectionRoute(), id))
          resolve()
        } else if(this.transaction) {
          await this.transaction.delete(doc(this.db, blueprint.buildCollectionRoute(), id))
        } else {
          await deleteDoc(doc(this.db, blueprint.buildCollectionRoute(), id).withConverter(this.getConverter<T>(blueprint.constructorFunction)))
        }
        resolve()
      } catch(e) {
        reject(e)
      }
    })
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

  convertToTimestamp(date: Date): Timestamp{
    return Timestamp.fromDate(date)
  }

  convertFromTimestamp(timestamp: Timestamp){
    if(typeof timestamp.toDate === 'function'){
      return timestamp.toDate()
    } else {
      return new Date(timestamp.seconds * 1000)
    }
  }


  getConverter<T extends Model>(constructor: ConstructorFunction<T>) {
    return {
      toFirestore (item: T): DocumentData {
        return item.toJson()
      },
      fromFirestore (
        snapshot: QueryDocumentSnapshot<T>,
      ): T {
        const data = snapshot.data()
        data.id = snapshot.id
        return (new constructor()).fromJson(data)
      }
    }
  }

  async runTransaction(operations: (() => Promise<void>)): Promise<any> {
    return runTransaction(this.db, async transaction => {
      this.transaction = transaction
      // this.transaction.
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
    this.batch = writeBatch(this.db)

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