import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import Commons from "../utilities/Commons";
import Model from "./Model";


export class Blueprint<T extends Model> {
    constructorFunction: ConstructorFunction<T>

    collectionRoute: string

    collectionRouteParams: any = {}

    constructor(model: T, routeParams: any = {}) {
        this.constructorFunction = Commons.getConstructor(model)
        this.collectionRoute = model.getRoute()
        this.collectionRouteParams = routeParams
    }

    static createBlueprint<T extends Model>(constructor: ConstructorFunction<T>): Blueprint<T> {
        return new Blueprint(new constructor())
    }

    buildCollectionRoute(): string {
        let pathTemplate = this.collectionRoute
        
        Object.keys(this.collectionRouteParams).forEach(key => {
          pathTemplate = pathTemplate.replace(`{${key}}`, this.collectionRouteParams[key])
        })
  
        return pathTemplate
    }

    getSubCollectionName(): string {
      const routeSplit = this.collectionRoute.split('/')

      return routeSplit.pop()
    }
}