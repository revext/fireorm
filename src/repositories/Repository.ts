import EngineInterface from '~/engine/EngineInterface'
import { Blueprint } from '~/models/Blueprint'
import { QueryParam } from '~/types/queries/QueryParam'
import Model from '../models/Model'

export default abstract class Repository<T extends Model> {
  engine: EngineInterface
  //TODO cache the entities into localstorage in browser
  //and into a file on server
  //TODO on clientside refresh the content when refresh from listeners
  cachedModels: {[key: string]: T} = {}
  cachedSubCollections: {[key:string]: T[]} = {}

  constructor(engine: EngineInterface){
    this.engine = engine
  }

  abstract getModel(): T

  private cacheModels(models: T[]){
      models.forEach(model => {
        this.cachedModels[model.id] = model
      })
  }

  private cacheSubCollection(route: string, models: T[]){
    this.cachedSubCollections[route] = models
  }

  private findCachedModel(id: string){
      return this.cachedModels[id]
  }

  async updateMany(ids: string[], data: any, routeParams: any = {}){
    try {
      const blueprint = this.getModelsBlueprint(routeParams)

      return await this.engine.updateMany(blueprint, ids, data)
    } catch (error) {
      throw error
    }
  }

  async update(id: string, data: any, routeParams: any = {}){
    try {
      const blueprint = this.getModelsBlueprint(routeParams)

      return await this.engine.update(blueprint, id, data)

    } catch (error) {
      throw error
    }
  }

  async saveMany (models: T[]): Promise<T[]> {
    try {
      await Promise.all(models.map(model => model.validate()))
      return this.engine.saveMany(models)
    } catch(error){
      throw error
    }
  }

  async save (model: T): Promise<T> {
    try {
      await model.validate()
      return this.engine.save(model)
    } catch(error){
      throw error
    }
  }

  async query(queryParams: QueryParam[], routeParams: any = {}): Promise<T[]> {
    const blueprint = this.getModelsBlueprint(routeParams)
    return this.engine.query(blueprint, queryParams)
  }

  async queryAsGroup(queryParams: QueryParam[]): Promise<T[]> {
    const blueprint = this.getModelsBlueprint()
    return this.engine.queryAsGroup(blueprint, queryParams)
  }
  
  async load (id: string, routeParams: any = {}, forceRefresh = false): Promise<T> {
    //if we have the model in cache, return it
    if(!forceRefresh){ 
      const cachedModel = this.findCachedModel(id)
      if(cachedModel){
        return cachedModel
      }
    }

    //otherwise create a blueprint and load the model
    let blueprint = this.getModelsBlueprint(routeParams)

    const model = await this.engine.load(blueprint, id)

    // and finally cache the model
    if(model)
      this.cacheModels([model])

    return model ?? null
  }

  async loadMany(ids: string[], routeParams: any = {}, forceRefresh = true){
    if(!ids.length){
      return []
    }
    //get a model blueprint for the loading
    let blueprint = this.getModelsBlueprint(routeParams)

    const loadedModels: { [id: string]: T } = {}
    let toBeLoaded: string[] = []

    //check if we have all the models in cache, if not, then add the id to the toBeLoaded array
    if(!forceRefresh){
      ids.forEach(id => {
        let cachedModel = this.findCachedModel(id)
        if(cachedModel){
          loadedModels[id] = cachedModel
        } else {
          toBeLoaded.push(id)
        }
      })
    } else {
      toBeLoaded = ids
    }

    //load the toBeLoaded models and put them into the loadedModels object
    const models = await this.engine.loadMany(blueprint, toBeLoaded)
    models.forEach(model => { if(model) { loadedModels[model.id] = model } })

    //map the loadedModels into an array
    const returnArray = ids.map(id => loadedModels[id])

    //cache the loaded models
    this.cacheModels(returnArray)

    //return the array
    return returnArray
  }

  snapshotListener(name: string, id: string, routeParams: any = {}, onRecieve: ((entity: T) => void)) {
    this.engine.snapshotListener(name, this.getModelsBlueprint(routeParams), id, onRecieve)
  }

  snapshotListenerForModel(name: string, model: T, onRecieve: ((entity: T) => void)) {
    this.engine.snapshotListener(name, model.getBlueprint(), model.id, onRecieve)
  }

  snapshotListenerMany(name: string, queryParams: QueryParam[], routeParams: any = {}, onRecieve: ((entity: T[]) => void)) {
    this.engine.snapshotListenerMany(name, this.getModelsBlueprint(routeParams), queryParams, onRecieve)
  }

  unsubscribe(name: string){
    this.engine.unsubscribeListener(name)
  }

  hasListener(name: string): boolean {
    return this.engine.hasListener(name)
  }

  async delete(id: string, routeParams: any = {}): Promise<void> {
    const blueprint = this.getModelsBlueprint(routeParams)
    return await this.engine.delete(blueprint, id)
  }

  async deleteModel(model: T): Promise<void> {
    return await this.engine.delete(model.getBlueprint(), model.id)
  }

  async deleteMany(ids: string[], routeParams: any = {}): Promise<void> {
    const blueprint = this.getModelsBlueprint(routeParams)
    return await this.engine.deleteMany(blueprint, ids)
  }


  private getModelsBlueprint(routeParams: any = {}): Blueprint<T> {
    return this.getModel().fromJson(routeParams).getBlueprint()
  }

  async loadCollection(routeParams: any = {}, forceRefresh = true){
    //get the bluepritn for the model
    let blueprint = this.getModelsBlueprint(routeParams)
    const route = blueprint.buildCollectionRoute()
    //find the subcollection in the cache, if found, return it
    if(!forceRefresh){
      const cachedSubCollection = this.cachedSubCollections[route]
      if(cachedSubCollection){
        return cachedSubCollection
      }
    }

    //otherwise load the subcollection
    const models = await this.engine.loadCollection(blueprint)

    //and cache the subcollection
    this.cacheSubCollection(route, models)

    return models
  }
}
