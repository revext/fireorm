
import Validator, { Errors } from "validatorjs"
import Repository from "~/repositories/Repository";
import { collectionMetadataKey, fieldMetadataKey, relationMetadataKey, validateMetadataKey } from "../decorators/MetadataKeys";
import { useEngine } from "../engine";
import { getRepositoryFor } from "../repositories";
import { HasManyRelationConfig, RelationConfigWithType } from "../types/configs/RelationConfig";
import { ConstructorFunction } from "../types/functions/ConstructorFunction";
import { FieldConfig } from "../types/configs/FieldConfig";
import { ValidateConfig } from "../types/configs/ValidateConfig";
import { Blueprint } from "./Blueprint";
import { Field } from "..";
import { instanceToPlain, plainToInstance } from "class-transformer";


export type ParamsObject = { [key: string]: any };


export default abstract class Model {
    @Field()
    id?: string = null

    relationsLoaded: string[] = []

    constructor(...params: any[]) {
      this.init(params)
    }

    init(_: any[]): void { return }

    private errors: Errors = null

    private collectRules<T>(): Validator.Rules {
      
      let rules: Validator.Rules = {}
      for(const propertyKey in this){
        //TODO recursive validation on related models
        if(Reflect.hasMetadata(validateMetadataKey, this, propertyKey)){
          const rule = Reflect.getMetadata(validateMetadataKey, this, propertyKey) ?? {} as ValidateConfig<T>

          if(rule instanceof Function){
            rules = Object.assign(rules, rule(this))
          } else if(rule instanceof Object){
            rules = Object.assign(rules, rule)
          } else {
            rules[propertyKey] = rule
          }
        }
      }
      return rules
    }

    validate (): Promise<void> {
      return new Promise((resolve, reject) => {
        const rules = this.collectRules()
        let validator = new Validator(this as any, rules)

        if (validator.hasAsync) {
          validator.checkAsync(resolve, () => {
            this.errors = validator.errors
            reject()
          })
        } else {
          if (validator.check()) {
            resolve()
          } else {
            this.errors = validator.errors
            reject()
          }
        }
      })
    }

    hasErrors (): boolean {
      return Object.keys(this.errors ?? {}).length > 0
    }

    getAllErrors (): Validator.ValidationErrors {
      return this.errors?.all()
    }

    getErrors (name: string): Array<string> | false {
      return this.errors?.get(name)
    }

    getError (name: string): string | false {
      return this.errors?.first(name)
    }

    async loadMany(relationNames: string[]): Promise<void>{
      const promises = []
      for(const relation in relationNames){
        promises.push(this.load(relationNames[relation]))
      }
      await Promise.all(promises)
    }

    async load(relationName: string): Promise<void> {
      let found = false
      const anyThis = this as any

      const relations = relationName.split('.')
      relationName = relations.reverse().pop()

      let loadedProperty = relationName
      
      if(!this.relationsLoaded.includes(relationName)){
        const routeParams = this.getRouteParameterMapping()
        for(const propertyKey in this) {
          if(Reflect.hasMetadata(relationMetadataKey, this, propertyKey)){
            const options = Reflect.getMetadata(relationMetadataKey, this, propertyKey) ?? {} as RelationConfigWithType
            //get the repository for the current modelClass
            const repository = getRepositoryFor(options.modelClass as ConstructorFunction<Model>) as Repository<Model>
            if((options.name && options.name === relationName) || propertyKey === relationName) {
              loadedProperty = propertyKey
              found = true
              if(options.type === 'hasMany'){
                const hasManyOptions = options as HasManyRelationConfig
                if(!hasManyOptions.mapIds && !hasManyOptions.relatedIds){
                  throw new Error(`@HasMany relation ${relationName} on ${this.constructor.name} is missing 'mapIds' and 'relatedIds'. One of them must be defined.`)
                }
                if(anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                  anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams)
                  if(options.foreignProperty){
                    for(const index in anyThis[propertyKey]){
                      anyThis[propertyKey][index][options.foreignProperty] = this
                    }
                  }
                } else {
                  throw new Error(`Relation ${relationName} with '${options.type}' on ${options.relatedId} property is not an array`)
                }
              } else if(options.type === 'hasCollection') {
                //TODO an option where the related data can be 'paginated'
                //check if property is array, then load the subcollection into it
                if(anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                  anyThis[propertyKey] = await repository.loadCollection(routeParams)
                  if(options.foreignProperty){
                    for(const index in anyThis[propertyKey]){
                      anyThis[propertyKey][index][options.foreignProperty] = this
                    }
                  }
                } else {
                  throw new Error(`Relation ${relationName} with '${options.type}' on ${propertyKey} property is not an array`)
                }
              } else {
                //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                anyThis[propertyKey] = await repository.load((this as any)[options.relatedId], routeParams)
                if(options.foreignProperty){
                  anyThis[propertyKey][options.foreignProperty] = this
                }
              }
            }
          }
        }
      
        if(!found){
          throw new Error(`Relation ${relationName} not found on ${this.constructor.name}`)
        }
        
        this.relationsLoaded.push(relationName)
      }

      if(relations.length > 0){
        await anyThis[loadedProperty].load(relations.reverse().join('.'))
      }
    }

    getBlueprint<T extends Model>(this: T): Blueprint<T> {
      return new Blueprint(this, this.getRouteParameterMapping())
    }

    getRoute(): string {
      const options = Reflect.getMetadata(collectionMetadataKey, this.constructor) ?? {}
      if(!options || !options.route){
        throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`)
      }
      return options.route
    }

    getRouteParameterMapping(): ParamsObject {
      const searchRegex = /{([^}]+)}/g
      if(Reflect.hasMetadata(collectionMetadataKey, this.constructor)) {
        const options = Reflect.getMetadata(collectionMetadataKey, this.constructor) ?? {}
        if(!options || !options.route){
          throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`)
        }

        const pathTemplate = options.route
        const params = searchRegex.exec(pathTemplate)

        const returnParams: string[] = []
        //if has route param
        if(params){
          //check to see if route param is a property of the model and it is set
          params.forEach((param) => {
            const paramStrip = param.replace(/[{}]/g, '')
            if(!(this as any)[paramStrip]){
              throw new Error(`Required route param ${paramStrip} is not set on the class ${this.constructor.name}`)
            }
            if(!returnParams.includes(paramStrip)) returnParams.push(paramStrip)
          })
        }

        //get every param which has been annotated in the model with 'routeParam: true'
        const paramsObject: ParamsObject = {}
        for(const propertyKey in this) {
          if(Reflect.hasMetadata(fieldMetadataKey, this, propertyKey)){
            const options = Reflect.getMetadata(fieldMetadataKey, this, propertyKey) ?? {} as FieldConfig

            if(options.routeParam){
              paramsObject[options.name ?? propertyKey] = this[propertyKey]
            }
          }
        }
        return paramsObject

      } else {
        throw new Error(`Class ${this.constructor.name} is not annotated with @Collection`)
      }

    }

    toJson(): any {
      const json: any = {}

      for(const propertyKey in this) {
        // if property has field metadata, then we must convert into json
        if(Reflect.hasMetadata(fieldMetadataKey, this, propertyKey)){
          const options = (Reflect.getMetadata(fieldMetadataKey, this, propertyKey) ?? {}) as FieldConfig
          const jsonPropertyKey = options.name ?? propertyKey
          if(this[propertyKey] !== undefined){
            if(this[propertyKey] instanceof Model) {
              // if the property is a model, then we must convert into json
              json[jsonPropertyKey] = (this[propertyKey] as unknown as Model).toJson()
            } else {
              //if property is an array or object then iterate over its properties, and convert into json recursively
              if(this[propertyKey] instanceof Array) {
                json[jsonPropertyKey] = this.convertToJson(this[propertyKey])
              } else if(this[propertyKey] instanceof Object) {
                json[jsonPropertyKey] = instanceToPlain(this[propertyKey])
              } else {
                //otherwise property is just a property, so we convert it based on its type or decorator
                if(options.timestamp) {
                  json[jsonPropertyKey] = useEngine().convertToTimestamp((this[propertyKey] as any))
                } else {
                  json[jsonPropertyKey] = this[propertyKey]
                }
              }

            }
          } else {
            json[jsonPropertyKey] = null
          }
        }
      }
      json.id = this.id
      return json
    }

    private convertToJson(root: Array<any>|Object): any {
      const json: any = root instanceof Array ? [] : {}
      
      Object.keys(root).forEach((key) => {
        if((root as any)[key] !== undefined)
          if((root as any)[key] instanceof Model)
            json[key] = (root as any)[key].toJson() 
          else
            if((root as any)[key] instanceof Array || (root as any)[key] instanceof Object)
              json[key] = this.convertToJson((root as any)[key])
            else
              json[key] = (root as any)[key]
      })

      return json
    }

    fromJson(data: any): this {
      let anyThis = this as any
      for(const propertyKey in data) {
        //if property exists in data and property has field metadata, then we must convert from json
        if(Reflect.hasMetadata(fieldMetadataKey, this, propertyKey)){
          const options = Reflect.getMetadata(fieldMetadataKey, this, propertyKey) ?? {} as FieldConfig
          const jsonPropertyKey = options.name ?? propertyKey
          if(data[jsonPropertyKey]){
            if(options?.modelClass) {
              if(data[jsonPropertyKey] instanceof Array){
                anyThis[jsonPropertyKey] = new Array()
                data[jsonPropertyKey].forEach((value: any) => {
                  if(options.modelClass.prototype instanceof Model){
                    anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(value))
                  } else {
                    anyThis[jsonPropertyKey] = plainToInstance(options.modelClass, value)
                  }
                })
              } else {
                if(options.modelClass.prototype instanceof Model){
                  anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(data[jsonPropertyKey]))
                } else {
                  anyThis[jsonPropertyKey] = plainToInstance(options.modelClass, data[jsonPropertyKey])
                }
              }
            } else {
              // if property is an array or object then iterate over its properties, and convert from json recursively
              if(data[jsonPropertyKey] instanceof Object || data[jsonPropertyKey] instanceof Array) {
                anyThis[propertyKey] = this.convertFromJson(data[jsonPropertyKey])
              } else {
                //otherwise property is just a property, so we convert it based on its type or decorator
                if(options.timestamp) {
                  anyThis[propertyKey] = useEngine().convertFromTimestamp(data[jsonPropertyKey])
                } else {
                  anyThis[propertyKey] = data[jsonPropertyKey]
                }
              }
            }
          }
        }
      }
      this.id = data.id
      return this
    }

    private convertFromJson(root: Array<any>|Object): any{
      const json: any = root instanceof Array ? [] : {}
      
      Object.keys(root).forEach((key) => {
        if((root as any)[key] instanceof Array || (root as any)[key] instanceof Object)
          (json as any)[key] = this.convertFromJson((root as any)[key])
        else
          (json as any)[key] = (root as any)[key]
      })

      return json
    }
}
