import Model from "~/models/Model";


export default class Commons {
    static getConstructor<T extends Model>(model: T): {new(...args : any[]): T ;}{
        return Object.getPrototypeOf(model).constructor
    }
}