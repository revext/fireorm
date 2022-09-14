
import Validator, { Errors } from "validatorjs"
import Repository from "~/repositories/Repository";
import { useEngine } from "../engine";
import { getRepositoryFor } from "../repositories";
import { HasManyRelationConfig, HasOneRelationConfig, RelationConfig, RelationConfigWithType } from "../types/configs/RelationConfig";
import { ConstructorFunction } from "../types/functions/ConstructorFunction";
import { FieldConfig } from "../types/configs/FieldConfig";
import { ValidateConfig } from "../types/configs/ValidateConfig";
import { Blueprint } from "./Blueprint";
import { Field } from "..";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ClassWithFields } from "~/types/internal/ClassWithFields";
import { ClassWithCollection } from "~/types/internal/ClassWithCollection";
import { ClassWithRelations } from "~/types/internal/ClassWithRelations";
import { ClassWithRules } from "~/types/internal/ClassWithRules";


export type ParamsObject = { [key: string]: any };

//TODO events before delete, after delet, before load, before-after save, update etc...

export default abstract class Model {
    @Field()
    id?: string = null

    relationsLoaded: string[] = []

    constructor(..._: any[]) {}

    init(..._: any[]): void { return }
    reset(): void { return }

    private errors: Errors = null

    abstract getModelName(): string

    private collectRules<T>(): Validator.Rules {
      
      const prototype = (Object.getPrototypeOf(this) as ClassWithRules<T>)
      const ruleData = prototype.rules ?? {}
      const ruleKeys = Object.keys(ruleData)

      let rules: Validator.Rules = {}
      for(const propertyKey in this){
        //TODO recursive validation on related models
        if(ruleKeys.includes(propertyKey)){
          const rule = ruleData[propertyKey] as ValidateConfig<T>

          if(rule instanceof Function){
            rules = Object.assign(rules, rule(this as unknown as T))
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
            reject(this.errors)
          })
        } else {
          if (validator.check()) {
            resolve()
          } else {
            this.errors = validator.errors
            reject(this.errors)
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

    async loadMany(relationNames: string[], forceReload: boolean = true): Promise<void>{
      const promises = []
      for(const relation in relationNames){
        promises.push(this.load(relationNames[relation], forceReload))
      }
      await Promise.all(promises)
    }

    async load(relationName: string, forceReload: boolean = true): Promise<void> {
      let found = false
      const anyThis = this as any

      const relations = relationName.split('.')
      relationName = relations.reverse().pop()

      let loadedProperty = relationName

      const prototype = (Object.getPrototypeOf(this) as ClassWithRelations)
      const relationData = prototype.relations ?? {}
      const relationKeys = Object.keys(relationData)
      
      if(!this.relationsLoaded.includes(relationName) || forceReload){
        const routeParams = this.getRouteParameterMapping()
        for(const propertyKey in this) {
          if(relationKeys.includes(propertyKey)){
            const options = relationData[propertyKey]
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
                if(Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                  anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams)
                  if(options.foreignProperty){
                    for(const index in anyThis[propertyKey]){
                      anyThis[propertyKey][index][options.foreignProperty] = this
                    }
                  }
                } else {
                  throw new Error(`Relation ${relationName} with '${options.type}' on ${propertyKey} property is not an array`)
                }
              } else if(options.type === 'hasCollection') {
                //TODO an option where the related data can be 'paginated'
                //check if property is array, then load the subcollection into it
                if(Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
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
                const hasOneOptions = options as HasOneRelationConfig
                //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                anyThis[propertyKey] = await repository.load((this as any)[hasOneOptions.relatedId], routeParams)
                if(hasOneOptions.foreignProperty){
                  anyThis[propertyKey][hasOneOptions.foreignProperty] = this
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
        //reverse back the array 
        relations.reverse()
        if(Array.isArray(anyThis[loadedProperty])){
          const promises = []
          for(const index in anyThis[loadedProperty]){
            promises.push(anyThis[loadedProperty][index].load(relations.join('.')))
          }
          await Promise.all(promises)
        } else {
          await anyThis[loadedProperty].load(relations.join('.'))
        }
      }
    }

    getBlueprint<T extends Model>(this: T): Blueprint<T> {
      return new Blueprint(this, this.getRouteParameterMapping())
    }

    getRoute(): string {
      const prototype = (Object.getPrototypeOf(this) as ClassWithCollection)
      const options = prototype.collection
      if(!options || !options.route){
        throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`)
      }
      return options.route
    }

    getRouteParameterMapping(): ParamsObject {
      const searchRegex = /{([^}]+)}/g
      const prototype = (Object.getPrototypeOf(this) as ClassWithFields & ClassWithCollection)
      const fieldData = prototype.fields ?? {}
      const fieldKeys = Object.keys(fieldData)
      if(prototype.collection) {
        const options = prototype.collection
        if(!options || !options.route){
          throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`)
        }

        //TODO have a look at the workings of this getROuteParameter because there are some strange things involved
        //get every param which has been annotated in the model with 'routeParam: true'
        const paramsObject: ParamsObject = {}
        
        for(const propertyKey in this) {
          if(fieldKeys.includes(propertyKey)){
            const options = fieldData[propertyKey]

            if(options.routeParam){
              paramsObject[options.name ?? propertyKey] = this[propertyKey]
            }
          }
        }

        // const pathTemplate = options.route
        // const params = searchRegex.exec(pathTemplate)

        // // const returnParams: string[] = []
        // //if has route param
        // if(params){
        //   //check to see if route param is a property of the model and it is set
        //   params.forEach((param) => {
        //     const paramStrip = param.replace(/[{}]/g, '')
        //     if(!paramsObject[paramStrip]){
        //       throw new Error(`Required route param ${paramStrip} is not set on the class ${this.constructor.name}`)
        //     }
        //     // if(!returnParams.includes(paramStrip)) returnParams.push(paramStrip)
        //   })
        // }

        return paramsObject

      } else {
        throw new Error(`Class ${this.constructor.name} is not annotated with @Collection`)
      }

    }

    toJson(toFireJson: boolean = false): any {
      this.reset()

      return this.innerToJson(toFireJson)
    }

    private innerToJson(toFireJson: boolean): any {
      const json: any = {}

      const relationData = (Object.getPrototypeOf(this) as ClassWithRelations).relations
      const fieldData = (Object.getPrototypeOf(this) as ClassWithFields).fields
      const fieldKeys = Object.keys(fieldData)

      for(const propertyKey in this) {
        // if property has field metadata, then we must convert into json
        if(fieldKeys.includes(propertyKey) || !toFireJson){
          const options = fieldData[propertyKey] as FieldConfig ?? null
          const relationOption = relationData[propertyKey] as RelationConfig ?? null
          const jsonPropertyKey = options.name ?? propertyKey
          if(this[propertyKey] !== undefined){
            if(options?.modelClass || (relationOption?.modelClass && !toFireJson)) {
              if(Array.isArray(this[propertyKey])){
                json[jsonPropertyKey] = []
                ;(this[propertyKey] as unknown as Array<any>).forEach((value: any) => {
                  json[jsonPropertyKey].push(this.convertFromInstance(value, toFireJson))
                })
              } else {
                json[jsonPropertyKey] = this.convertFromInstance(this[propertyKey], toFireJson)
              }
              // if the property is a model, then we must convert into json
            } else {
              if(options?.timestamp) {
                if(toFireJson){
                  json[jsonPropertyKey] = useEngine().convertToTimestamp((this[propertyKey] as any))
                } else {
                  json[jsonPropertyKey] = this[propertyKey]
                }
              } else {
                json[jsonPropertyKey] = this[propertyKey]
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

    private convertFromInstance(data: any, toFireJson: boolean): any {
      if(data instanceof Model){
        return data.innerFromJson(data, toFireJson)
      } else {
        return instanceToPlain(data, {enableCircularCheck: true})
      }
    }

    fromJson(data: any, fromFireJson: boolean = false): this {
      this.innerFromJson(data, fromFireJson)

      this.init()
      return this
    }

    private innerFromJson(data: any, fromFireJson: boolean): this {
      let anyThis = this as any

      const fieldData = (Object.getPrototypeOf(this) as ClassWithFields).fields
      const relationData = (Object.getPrototypeOf(this) as ClassWithRelations).relations

      for(const propertyKey in data) {
        const options = fieldData[propertyKey] as FieldConfig ?? null
        const relationOption = relationData[propertyKey] as RelationConfig ?? null
        
        const jsonPropertyKey = options?.name ?? propertyKey
        if(data[jsonPropertyKey]){
          if(options?.modelClass || (relationOption?.modelClass && !fromFireJson)) {
            if(Array.isArray(data[jsonPropertyKey])){
              anyThis[jsonPropertyKey] = new Array()
              data[jsonPropertyKey].forEach((value: any) => {
                anyThis[jsonPropertyKey].push(this.convertToInstance(options.modelClass, value, fromFireJson))
              })
            } else {
              anyThis[jsonPropertyKey] = this.convertToInstance(options.modelClass, data[jsonPropertyKey], fromFireJson)
            }
          } else {
            if(options?.timestamp) {
              if(fromFireJson){
                anyThis[propertyKey] = useEngine().convertFromTimestamp(data[jsonPropertyKey])
              } else {
                anyThis[propertyKey] = data[jsonPropertyKey]
              }
            } else {
              anyThis[propertyKey] = data[jsonPropertyKey]
            }
          }
        }
      }
      this.id = data.id

      return this
    }

    private convertToInstance<T extends ConstructorFunction<unknown>>(modelClass: T, data: any, fromFireJson: boolean): T {
      if(modelClass.prototype instanceof Model){
        return ((new modelClass()) as Model).innerFromJson(data, fromFireJson) as unknown as T
      } else {
        return plainToInstance(modelClass, data, {enableCircularCheck: true}) as T
      }
    }
}
