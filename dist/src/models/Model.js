"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validatorjs_1 = __importDefault(require("validatorjs"));
const engine_1 = require("../engine");
const repositories_1 = require("../repositories");
const Blueprint_1 = require("./Blueprint");
const __1 = require("..");
const class_transformer_1 = require("class-transformer");
//TODO events before delete, after delet, before load, before-after save, update etc...
class Model {
    constructor(..._) {
        this.id = null;
        this.relationsLoaded = [];
        this.errors = null;
    }
    init(..._) { return; }
    reset() { return; }
    collectRules() {
        var _a;
        const prototype = Object.getPrototypeOf(this);
        const ruleData = (_a = prototype.rules) !== null && _a !== void 0 ? _a : {};
        const ruleKeys = Object.keys(ruleData);
        let rules = {};
        for (const propertyKey in this) {
            //TODO recursive validation on related models
            if (ruleKeys.includes(propertyKey)) {
                const rule = ruleData[propertyKey];
                if (rule instanceof Function) {
                    rules = Object.assign(rules, rule(this));
                }
                else if (rule instanceof Object) {
                    rules = Object.assign(rules, rule);
                }
                else {
                    rules[propertyKey] = rule;
                }
            }
        }
        return rules;
    }
    validate() {
        return new Promise((resolve, reject) => {
            const rules = this.collectRules();
            let validator = new validatorjs_1.default(this, rules);
            if (validator.hasAsync) {
                validator.checkAsync(resolve, () => {
                    this.errors = validator.errors;
                    reject(this.errors);
                });
            }
            else {
                if (validator.check()) {
                    resolve();
                }
                else {
                    this.errors = validator.errors;
                    reject(this.errors);
                }
            }
        });
    }
    hasErrors() {
        var _a;
        return Object.keys((_a = this.errors) !== null && _a !== void 0 ? _a : {}).length > 0;
    }
    getAllErrors() {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.all();
    }
    getErrors(name) {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.get(name);
    }
    getError(name) {
        var _a;
        return (_a = this.errors) === null || _a === void 0 ? void 0 : _a.first(name);
    }
    async loadMany(relationNames, forceReload = true) {
        const promises = [];
        for (const relation in relationNames) {
            promises.push(this.load(relationNames[relation], forceReload));
        }
        await Promise.all(promises);
    }
    async load(relationName, forceReload = true) {
        var _a;
        let found = false;
        const anyThis = this;
        const relations = relationName.split('.');
        relationName = relations.reverse().pop();
        let loadedProperty = relationName;
        const prototype = Object.getPrototypeOf(this);
        const relationData = (_a = prototype.relations) !== null && _a !== void 0 ? _a : {};
        const relationKeys = Object.keys(relationData);
        if (!this.relationsLoaded.includes(relationName) || forceReload) {
            const routeParams = this.getRouteParameterMapping();
            for (const propertyKey in this) {
                if (relationKeys.includes(propertyKey)) {
                    const options = relationData[propertyKey];
                    //get the repository for the current modelClass
                    const repository = (0, repositories_1.getRepositoryFor)(options.modelClass);
                    if ((options.name && options.name === relationName) || propertyKey === relationName) {
                        loadedProperty = propertyKey;
                        found = true;
                        if (options.type === 'hasMany') {
                            const hasManyOptions = options;
                            if (!hasManyOptions.mapIds && !hasManyOptions.relatedIds) {
                                throw new Error(`@HasMany relation ${relationName} on ${this.constructor.name} is missing 'mapIds' and 'relatedIds'. One of them must be defined.`);
                            }
                            if (Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams);
                                if (options.foreignProperty) {
                                    for (const index in anyThis[propertyKey]) {
                                        anyThis[propertyKey][index][options.foreignProperty] = this;
                                    }
                                }
                            }
                            else {
                                throw new Error(`Relation ${relationName} with '${options.type}' on ${propertyKey} property is not an array`);
                            }
                        }
                        else if (options.type === 'hasCollection') {
                            //TODO an option where the related data can be 'paginated'
                            //check if property is array, then load the subcollection into it
                            if (Array.isArray(anyThis[propertyKey]) || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadCollection(routeParams);
                                if (options.foreignProperty) {
                                    for (const index in anyThis[propertyKey]) {
                                        anyThis[propertyKey][index][options.foreignProperty] = this;
                                    }
                                }
                            }
                            else {
                                throw new Error(`Relation ${relationName} with '${options.type}' on ${propertyKey} property is not an array`);
                            }
                        }
                        else {
                            const hasOneOptions = options;
                            //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                            anyThis[propertyKey] = await repository.load(this[hasOneOptions.relatedId], routeParams);
                            if (hasOneOptions.foreignProperty) {
                                anyThis[propertyKey][hasOneOptions.foreignProperty] = this;
                            }
                        }
                    }
                }
            }
            if (!found) {
                throw new Error(`Relation ${relationName} not found on ${this.constructor.name}`);
            }
            this.relationsLoaded.push(relationName);
        }
        if (relations.length > 0) {
            //reverse back the array 
            relations.reverse();
            if (Array.isArray(anyThis[loadedProperty])) {
                const promises = [];
                for (const index in anyThis[loadedProperty]) {
                    promises.push(anyThis[loadedProperty][index].load(relations.join('.')));
                }
                await Promise.all(promises);
            }
            else {
                await anyThis[loadedProperty].load(relations.join('.'));
            }
        }
    }
    getBlueprint() {
        return new Blueprint_1.Blueprint(this, this.getRouteParameterMapping());
    }
    getRoute() {
        const prototype = Object.getPrototypeOf(this);
        const options = prototype.collection;
        if (!options || !options.route) {
            throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
        }
        return options.route;
    }
    getRouteParameterMapping() {
        var _a, _b;
        const searchRegex = /{([^}]+)}/g;
        const prototype = Object.getPrototypeOf(this);
        const fieldData = (_a = prototype.fields) !== null && _a !== void 0 ? _a : {};
        const fieldKeys = Object.keys(fieldData);
        if (prototype.collection) {
            const options = prototype.collection;
            if (!options || !options.route) {
                throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
            }
            //TODO have a look at the workings of this getROuteParameter because there are some strange things involved
            //get every param which has been annotated in the model with 'routeParam: true'
            const paramsObject = {};
            for (const propertyKey in this) {
                if (fieldKeys.includes(propertyKey)) {
                    const options = fieldData[propertyKey];
                    if (options.routeParam) {
                        paramsObject[(_b = options.name) !== null && _b !== void 0 ? _b : propertyKey] = this[propertyKey];
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
            return paramsObject;
        }
        else {
            throw new Error(`Class ${this.constructor.name} is not annotated with @Collection`);
        }
    }
    toJson(toFireJson = false) {
        this.reset();
        return this.innerToJson(toFireJson);
    }
    innerToJson(toFireJson) {
        var _a, _b;
        const json = {};
        const fieldData = Object.getPrototypeOf(this).fields;
        const fieldKeys = Object.keys(fieldData);
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (fieldKeys.includes(propertyKey) || !toFireJson) {
                const options = (_a = fieldData[propertyKey]) !== null && _a !== void 0 ? _a : null;
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if (options === null || options === void 0 ? void 0 : options.modelClass) {
                        if (Array.isArray(this[propertyKey])) {
                            json[jsonPropertyKey] = [];
                            this[propertyKey].forEach((value) => {
                                json[jsonPropertyKey].push(this.convertFromInstance(value, toFireJson));
                            });
                        }
                        else {
                            json[jsonPropertyKey] = this.convertFromInstance(this[propertyKey], toFireJson);
                        }
                        // if the property is a model, then we must convert into json
                    }
                    else {
                        if (options === null || options === void 0 ? void 0 : options.timestamp) {
                            if (toFireJson) {
                                json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                            }
                            else {
                                json[jsonPropertyKey] = this[propertyKey];
                            }
                        }
                        else {
                            json[jsonPropertyKey] = this[propertyKey];
                        }
                    }
                }
                else {
                    json[jsonPropertyKey] = null;
                }
            }
        }
        json.id = this.id;
        return json;
    }
    convertFromInstance(data, toFireJson) {
        if (data instanceof Model) {
            return data.innerFromJson(data, toFireJson);
        }
        else {
            return (0, class_transformer_1.instanceToPlain)(data, { enableCircularCheck: true });
        }
    }
    fromJson(data, fromFireJson = false) {
        this.innerFromJson(data, fromFireJson);
        this.init();
        return this;
    }
    innerFromJson(data, fromFireJson) {
        var _a, _b;
        let anyThis = this;
        const fieldData = Object.getPrototypeOf(this).fields;
        for (const propertyKey in data) {
            const options = (_a = fieldData[propertyKey]) !== null && _a !== void 0 ? _a : null;
            const jsonPropertyKey = (_b = options === null || options === void 0 ? void 0 : options.name) !== null && _b !== void 0 ? _b : propertyKey;
            if (data[jsonPropertyKey]) {
                if (options === null || options === void 0 ? void 0 : options.modelClass) {
                    if (Array.isArray(data[jsonPropertyKey])) {
                        anyThis[jsonPropertyKey] = new Array();
                        data[jsonPropertyKey].forEach((value) => {
                            anyThis[jsonPropertyKey].push(this.convertToInstance(options.modelClass, value, fromFireJson));
                        });
                    }
                    else {
                        anyThis[jsonPropertyKey] = this.convertToInstance(options.modelClass, data[jsonPropertyKey], fromFireJson);
                    }
                }
                else {
                    if (options === null || options === void 0 ? void 0 : options.timestamp) {
                        if (fromFireJson) {
                            anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                        }
                        else {
                            anyThis[propertyKey] = data[jsonPropertyKey];
                        }
                    }
                    else {
                        anyThis[propertyKey] = data[jsonPropertyKey];
                    }
                }
            }
        }
        this.id = data.id;
        return this;
    }
    convertToInstance(modelClass, data, fromFireJson) {
        if (modelClass.prototype instanceof Model) {
            return (new modelClass()).innerFromJson(data, fromFireJson);
        }
        else {
            return (0, class_transformer_1.plainToInstance)(modelClass, data, { enableCircularCheck: true });
        }
    }
}
__decorate([
    (0, __1.Field)(),
    __metadata("design:type", String)
], Model.prototype, "id", void 0);
exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU90QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBTEgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxLQUFXLE9BQU0sQ0FBQyxDQUFDO0lBTWhCLFlBQVk7O1FBRWxCLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUF1QixDQUFBO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksRUFBRSxDQUFBO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdEMsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFzQixDQUFBO2dCQUV2RCxJQUFHLElBQUksWUFBWSxRQUFRLEVBQUM7b0JBQzFCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBb0IsQ0FBQyxDQUFDLENBQUE7aUJBQ3pEO3FCQUFNLElBQUcsSUFBSSxZQUFZLE1BQU0sRUFBQztvQkFDL0IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO2lCQUNuQztxQkFBTTtvQkFDTCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFBO2lCQUMxQjthQUNGO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDakMsSUFBSSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLElBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUVqRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3RCLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO29CQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUNyQixDQUFDLENBQUMsQ0FBQTthQUNIO2lCQUFNO2dCQUNMLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFO29CQUNyQixPQUFPLEVBQUUsQ0FBQTtpQkFDVjtxQkFBTTtvQkFDTCxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUE7b0JBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7aUJBQ3BCO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxTQUFTOztRQUNQLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFBLElBQUksQ0FBQyxNQUFNLG1DQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7SUFDbEQsQ0FBQztJQUVELFlBQVk7O1FBQ1YsT0FBTyxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLEdBQUcsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFFRCxTQUFTLENBQUUsSUFBWTs7UUFDckIsT0FBTyxNQUFBLElBQUksQ0FBQyxNQUFNLDBDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMvQixDQUFDO0lBRUQsUUFBUSxDQUFFLElBQVk7O1FBQ3BCLE9BQU8sTUFBQSxJQUFJLENBQUMsTUFBTSwwQ0FBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBdUIsRUFBRSxjQUF1QixJQUFJO1FBQ2pFLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTtRQUNuQixLQUFJLE1BQU0sUUFBUSxJQUFJLGFBQWEsRUFBQztZQUNsQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUE7U0FDL0Q7UUFDRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBb0IsRUFBRSxjQUF1QixJQUFJOztRQUMxRCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDakIsTUFBTSxPQUFPLEdBQUcsSUFBVyxDQUFBO1FBRTNCLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDekMsWUFBWSxHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUV4QyxJQUFJLGNBQWMsR0FBRyxZQUFZLENBQUE7UUFFakMsTUFBTSxTQUFTLEdBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQXdCLENBQUE7UUFDckUsTUFBTSxZQUFZLEdBQUcsTUFBQSxTQUFTLENBQUMsU0FBUyxtQ0FBSSxFQUFFLENBQUE7UUFDOUMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUU5QyxJQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksV0FBVyxFQUFDO1lBQzdELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO1lBQ25ELEtBQUksTUFBTSxXQUFXLElBQUksSUFBSSxFQUFFO2dCQUM3QixJQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUM7b0JBQ3BDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtvQkFDekMsK0NBQStDO29CQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFBLCtCQUFnQixFQUFDLE9BQU8sQ0FBQyxVQUF3QyxDQUFzQixDQUFBO29CQUMxRyxJQUFHLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxJQUFJLFdBQVcsS0FBSyxZQUFZLEVBQUU7d0JBQ2xGLGNBQWMsR0FBRyxXQUFXLENBQUE7d0JBQzVCLEtBQUssR0FBRyxJQUFJLENBQUE7d0JBQ1osSUFBRyxPQUFPLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBQzs0QkFDNUIsTUFBTSxjQUFjLEdBQUcsT0FBZ0MsQ0FBQTs0QkFDdkQsSUFBRyxDQUFDLGNBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFDO2dDQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixZQUFZLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLHFFQUFxRSxDQUFDLENBQUE7NkJBQ3BKOzRCQUNELElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0NBQzdHLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUE7Z0NBQ3pKLElBQUcsT0FBTyxDQUFDLGVBQWUsRUFBQztvQ0FDekIsS0FBSSxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUM7d0NBQ3RDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFBO3FDQUM1RDtpQ0FDRjs2QkFDRjtpQ0FBTTtnQ0FDTCxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksWUFBWSxVQUFVLE9BQU8sQ0FBQyxJQUFJLFFBQVEsV0FBVywyQkFBMkIsQ0FBQyxDQUFBOzZCQUM5Rzt5QkFDRjs2QkFBTSxJQUFHLE9BQU8sQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFOzRCQUMxQywwREFBMEQ7NEJBQzFELGlFQUFpRTs0QkFDakUsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRTtnQ0FDN0csT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQTtnQ0FDbkUsSUFBRyxPQUFPLENBQUMsZUFBZSxFQUFDO29DQUN6QixLQUFJLE1BQU0sS0FBSyxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBQzt3Q0FDdEMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUE7cUNBQzVEO2lDQUNGOzZCQUNGO2lDQUFNO2dDQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxZQUFZLFVBQVUsT0FBTyxDQUFDLElBQUksUUFBUSxXQUFXLDJCQUEyQixDQUFDLENBQUE7NkJBQzlHO3lCQUNGOzZCQUFNOzRCQUNMLE1BQU0sYUFBYSxHQUFHLE9BQStCLENBQUE7NEJBQ3JELHdIQUF3SDs0QkFDeEgsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLElBQUksQ0FBRSxJQUFZLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFBOzRCQUNqRyxJQUFHLGFBQWEsQ0FBQyxlQUFlLEVBQUM7Z0NBQy9CLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFBOzZCQUMzRDt5QkFDRjtxQkFDRjtpQkFDRjthQUNGO1lBRUQsSUFBRyxDQUFDLEtBQUssRUFBQztnQkFDUixNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksWUFBWSxpQkFBaUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO2FBQ2xGO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7U0FDeEM7UUFFRCxJQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO1lBQ3RCLHlCQUF5QjtZQUN6QixTQUFTLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDbkIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFDO2dCQUN4QyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUE7Z0JBQ25CLEtBQUksTUFBTSxLQUFLLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFDO29CQUN6QyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQ3hFO2dCQUNELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTthQUM1QjtpQkFBTTtnQkFDTCxNQUFNLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO2FBQ3hEO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsWUFBWTtRQUNWLE9BQU8sSUFBSSxxQkFBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQzdELENBQUM7SUFFRCxRQUFRO1FBQ04sTUFBTSxTQUFTLEdBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQXlCLENBQUE7UUFDdEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQTtRQUNwQyxJQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQztZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLCtEQUErRCxDQUFDLENBQUE7U0FDL0c7UUFDRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUE7SUFDdEIsQ0FBQztJQUVELHdCQUF3Qjs7UUFDdEIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFBO1FBQ2hDLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUEyQyxDQUFBO1FBQ3hGLE1BQU0sU0FBUyxHQUFHLE1BQUEsU0FBUyxDQUFDLE1BQU0sbUNBQUksRUFBRSxDQUFBO1FBQ3hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDeEMsSUFBRyxTQUFTLENBQUMsVUFBVSxFQUFFO1lBQ3ZCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUE7WUFDcEMsSUFBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUM7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksK0RBQStELENBQUMsQ0FBQTthQUMvRztZQUVELDJHQUEyRztZQUMzRywrRUFBK0U7WUFDL0UsTUFBTSxZQUFZLEdBQWlCLEVBQUUsQ0FBQTtZQUVyQyxLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBRTtnQkFDN0IsSUFBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO29CQUNqQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUE7b0JBRXRDLElBQUcsT0FBTyxDQUFDLFVBQVUsRUFBQzt3QkFDcEIsWUFBWSxDQUFDLE1BQUEsT0FBTyxDQUFDLElBQUksbUNBQUksV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO3FCQUM5RDtpQkFDRjthQUNGO1lBRUQscUNBQXFDO1lBQ3JDLGdEQUFnRDtZQUVoRCx1Q0FBdUM7WUFDdkMsdUJBQXVCO1lBQ3ZCLGNBQWM7WUFDZCwyRUFBMkU7WUFDM0UsZ0NBQWdDO1lBQ2hDLG9EQUFvRDtZQUNwRCxxQ0FBcUM7WUFDckMsK0dBQStHO1lBQy9HLFFBQVE7WUFDUiw4RUFBOEU7WUFDOUUsT0FBTztZQUNQLElBQUk7WUFFSixPQUFPLFlBQVksQ0FBQTtTQUVwQjthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxvQ0FBb0MsQ0FBQyxDQUFBO1NBQ3BGO0lBRUgsQ0FBQztJQUVELE1BQU0sQ0FBQyxhQUFzQixLQUFLO1FBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUVaLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUNyQyxDQUFDO0lBRU8sV0FBVyxDQUFDLFVBQW1COztRQUNyQyxNQUFNLElBQUksR0FBUSxFQUFFLENBQUE7UUFFcEIsTUFBTSxTQUFTLEdBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQXFCLENBQUMsTUFBTSxDQUFBO1FBQ3pFLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFeEMsS0FBSSxNQUFNLFdBQVcsSUFBSSxJQUFJLEVBQUU7WUFDN0IsaUVBQWlFO1lBQ2pFLElBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBQztnQkFDaEQsTUFBTSxPQUFPLEdBQUcsTUFBQSxTQUFTLENBQUMsV0FBVyxDQUFnQixtQ0FBSSxJQUFJLENBQUE7Z0JBQzdELE1BQU0sZUFBZSxHQUFHLE1BQUEsT0FBTyxDQUFDLElBQUksbUNBQUksV0FBVyxDQUFBO2dCQUNuRCxJQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxTQUFTLEVBQUM7b0JBQ2pDLElBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFVBQVUsRUFBRTt3QkFDdEIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFDOzRCQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUN6Qjs0QkFBQyxJQUFJLENBQUMsV0FBVyxDQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dDQUNuRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTs0QkFDekUsQ0FBQyxDQUFDLENBQUE7eUJBQ0g7NkJBQU07NEJBQ0wsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUE7eUJBQ2hGO3dCQUNELDZEQUE2RDtxQkFDOUQ7eUJBQU07d0JBQ0wsSUFBRyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsU0FBUyxFQUFFOzRCQUNyQixJQUFHLFVBQVUsRUFBQztnQ0FDWixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBQSxrQkFBUyxHQUFFLENBQUMsa0JBQWtCLENBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBUyxDQUFDLENBQUE7NkJBQ25GO2lDQUFNO2dDQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7NkJBQzFDO3lCQUNGOzZCQUFNOzRCQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7eUJBQzFDO3FCQUNGO2lCQUNGO3FCQUFNO29CQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUE7aUJBQzdCO2FBQ0Y7U0FDRjtRQUNELElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQUNqQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTyxtQkFBbUIsQ0FBQyxJQUFTLEVBQUUsVUFBbUI7UUFDeEQsSUFBRyxJQUFJLFlBQVksS0FBSyxFQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUE7U0FDNUM7YUFBTTtZQUNMLE9BQU8sSUFBQSxtQ0FBZSxFQUFDLElBQUksRUFBRSxFQUFDLG1CQUFtQixFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7U0FDMUQ7SUFDSCxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQVMsRUFBRSxlQUF3QixLQUFLO1FBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBRXRDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNYLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVPLGFBQWEsQ0FBQyxJQUFTLEVBQUUsWUFBcUI7O1FBQ3BELElBQUksT0FBTyxHQUFHLElBQVcsQ0FBQTtRQUV6QixNQUFNLFNBQVMsR0FBSSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBcUIsQ0FBQyxNQUFNLENBQUE7UUFFekUsS0FBSSxNQUFNLFdBQVcsSUFBSSxJQUFJLEVBQUU7WUFDN0IsTUFBTSxPQUFPLEdBQUcsTUFBQSxTQUFTLENBQUMsV0FBVyxDQUFnQixtQ0FBSSxJQUFJLENBQUE7WUFDN0QsTUFBTSxlQUFlLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsSUFBSSxtQ0FBSSxXQUFXLENBQUE7WUFDcEQsSUFBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUM7Z0JBQ3ZCLElBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFVBQVUsRUFBRTtvQkFDdEIsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFDO3dCQUN0QyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQTt3QkFDdEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFOzRCQUMzQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFBO3dCQUNoRyxDQUFDLENBQUMsQ0FBQTtxQkFDSDt5QkFBTTt3QkFDTCxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFBO3FCQUMzRztpQkFDRjtxQkFBTTtvQkFDTCxJQUFHLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxTQUFTLEVBQUU7d0JBQ3JCLElBQUcsWUFBWSxFQUFDOzRCQUNkLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFBLGtCQUFTLEdBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQTt5QkFDL0U7NkJBQU07NEJBQ0wsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTt5QkFDN0M7cUJBQ0Y7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtxQkFDN0M7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBRWpCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVPLGlCQUFpQixDQUF5QyxVQUFhLEVBQUUsSUFBUyxFQUFFLFlBQXFCO1FBQy9HLElBQUcsVUFBVSxDQUFDLFNBQVMsWUFBWSxLQUFLLEVBQUM7WUFDdkMsT0FBUSxDQUFDLElBQUksVUFBVSxFQUFFLENBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBaUIsQ0FBQTtTQUN2RjthQUFNO1lBQ0wsT0FBTyxJQUFBLG1DQUFlLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFDLG1CQUFtQixFQUFFLElBQUksRUFBQyxDQUFNLENBQUE7U0FDM0U7SUFDSCxDQUFDO0NBQ0o7QUEvVUc7SUFEQyxJQUFBLFNBQUssR0FBRTs7aUNBQ1U7QUFGdEIsd0JBaVZDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCBWYWxpZGF0b3IsIHsgRXJyb3JzIH0gZnJvbSBcInZhbGlkYXRvcmpzXCJcclxuaW1wb3J0IFJlcG9zaXRvcnkgZnJvbSBcIn4vcmVwb3NpdG9yaWVzL1JlcG9zaXRvcnlcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIEhhc09uZVJlbGF0aW9uQ29uZmlnLCBSZWxhdGlvbkNvbmZpZ1dpdGhUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvUmVsYXRpb25Db25maWdcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0b3JGdW5jdGlvbiB9IGZyb20gXCIuLi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvblwiO1xyXG5pbXBvcnQgeyBGaWVsZENvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL0ZpZWxkQ29uZmlnXCI7XHJcbmltcG9ydCB7IFZhbGlkYXRlQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvVmFsaWRhdGVDb25maWdcIjtcclxuaW1wb3J0IHsgQmx1ZXByaW50IH0gZnJvbSBcIi4vQmx1ZXByaW50XCI7XHJcbmltcG9ydCB7IEZpZWxkIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IGluc3RhbmNlVG9QbGFpbiwgcGxhaW5Ub0luc3RhbmNlIH0gZnJvbSBcImNsYXNzLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aEZpZWxkcyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aEZpZWxkc1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhDb2xsZWN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoQ29sbGVjdGlvblwiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSZWxhdGlvbnMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSZWxhdGlvbnNcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoUnVsZXMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSdWxlc1wiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFBhcmFtc09iamVjdCA9IHsgW2tleTogc3RyaW5nXTogYW55IH07XHJcblxyXG4vL1RPRE8gZXZlbnRzIGJlZm9yZSBkZWxldGUsIGFmdGVyIGRlbGV0LCBiZWZvcmUgbG9hZCwgYmVmb3JlLWFmdGVyIHNhdmUsIHVwZGF0ZSBldGMuLi5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIE1vZGVsIHtcclxuICAgIEBGaWVsZCgpXHJcbiAgICBpZD86IHN0cmluZyA9IG51bGxcclxuXHJcbiAgICByZWxhdGlvbnNMb2FkZWQ6IHN0cmluZ1tdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3RvciguLi5fOiBhbnlbXSkge31cclxuXHJcbiAgICBpbml0KC4uLl86IGFueVtdKTogdm9pZCB7IHJldHVybiB9XHJcbiAgICByZXNldCgpOiB2b2lkIHsgcmV0dXJuIH1cclxuXHJcbiAgICBwcml2YXRlIGVycm9yczogRXJyb3JzID0gbnVsbFxyXG5cclxuICAgIGFic3RyYWN0IGdldE1vZGVsTmFtZSgpOiBzdHJpbmdcclxuXHJcbiAgICBwcml2YXRlIGNvbGxlY3RSdWxlczxUPigpOiBWYWxpZGF0b3IuUnVsZXMge1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSdWxlczxUPilcclxuICAgICAgY29uc3QgcnVsZURhdGEgPSBwcm90b3R5cGUucnVsZXMgPz8ge31cclxuICAgICAgY29uc3QgcnVsZUtleXMgPSBPYmplY3Qua2V5cyhydWxlRGF0YSlcclxuXHJcbiAgICAgIGxldCBydWxlczogVmFsaWRhdG9yLlJ1bGVzID0ge31cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpe1xyXG4gICAgICAgIC8vVE9ETyByZWN1cnNpdmUgdmFsaWRhdGlvbiBvbiByZWxhdGVkIG1vZGVsc1xyXG4gICAgICAgIGlmKHJ1bGVLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBydWxlID0gcnVsZURhdGFbcHJvcGVydHlLZXldIGFzIFZhbGlkYXRlQ29uZmlnPFQ+XHJcblxyXG4gICAgICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKHRoaXMgYXMgdW5rbm93biBhcyBUKSlcclxuICAgICAgICAgIH0gZWxzZSBpZihydWxlIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVsZXNbcHJvcGVydHlLZXldID0gcnVsZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcnVsZXNcclxuICAgIH1cclxuXHJcbiAgICB2YWxpZGF0ZSAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcnVsZXMgPSB0aGlzLmNvbGxlY3RSdWxlcygpXHJcbiAgICAgICAgbGV0IHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IodGhpcyBhcyBhbnksIHJ1bGVzKVxyXG5cclxuICAgICAgICBpZiAodmFsaWRhdG9yLmhhc0FzeW5jKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3IuY2hlY2tBc3luYyhyZXNvbHZlLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvcnMpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodmFsaWRhdG9yLmNoZWNrKCkpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JzKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBoYXNFcnJvcnMgKCk6IGJvb2xlYW4ge1xyXG4gICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5lcnJvcnMgPz8ge30pLmxlbmd0aCA+IDBcclxuICAgIH1cclxuXHJcbiAgICBnZXRBbGxFcnJvcnMgKCk6IFZhbGlkYXRvci5WYWxpZGF0aW9uRXJyb3JzIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5hbGwoKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9ycyAobmFtZTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5nZXQobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvciAobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmZpcnN0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZE1hbnkocmVsYXRpb25OYW1lczogc3RyaW5nW10sIGZvcmNlUmVsb2FkOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8dm9pZD57XHJcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgZm9yKGNvbnN0IHJlbGF0aW9uIGluIHJlbGF0aW9uTmFtZXMpe1xyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkKHJlbGF0aW9uTmFtZXNbcmVsYXRpb25dLCBmb3JjZVJlbG9hZCkpXHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZChyZWxhdGlvbk5hbWU6IHN0cmluZywgZm9yY2VSZWxvYWQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXHJcbiAgICAgIGNvbnN0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgcmVsYXRpb25zID0gcmVsYXRpb25OYW1lLnNwbGl0KCcuJylcclxuICAgICAgcmVsYXRpb25OYW1lID0gcmVsYXRpb25zLnJldmVyc2UoKS5wb3AoKVxyXG5cclxuICAgICAgbGV0IGxvYWRlZFByb3BlcnR5ID0gcmVsYXRpb25OYW1lXHJcblxyXG4gICAgICBjb25zdCBwcm90b3R5cGUgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucylcclxuICAgICAgY29uc3QgcmVsYXRpb25EYXRhID0gcHJvdG90eXBlLnJlbGF0aW9ucyA/PyB7fVxyXG4gICAgICBjb25zdCByZWxhdGlvbktleXMgPSBPYmplY3Qua2V5cyhyZWxhdGlvbkRhdGEpXHJcbiAgICAgIFxyXG4gICAgICBpZighdGhpcy5yZWxhdGlvbnNMb2FkZWQuaW5jbHVkZXMocmVsYXRpb25OYW1lKSB8fCBmb3JjZVJlbG9hZCl7XHJcbiAgICAgICAgY29uc3Qgcm91dGVQYXJhbXMgPSB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpXHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKHJlbGF0aW9uS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW3Byb3BlcnR5S2V5XSkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZE1hbnkoKGhhc01hbnlPcHRpb25zLm1hcElkcyA/IGhhc01hbnlPcHRpb25zLm1hcElkcyh0aGlzKSA6IGFueVRoaXNbaGFzTWFueU9wdGlvbnMucmVsYXRlZElkc10pLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNDb2xsZWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPIGFuIG9wdGlvbiB3aGVyZSB0aGUgcmVsYXRlZCBkYXRhIGNhbiBiZSAncGFnaW5hdGVkJ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBpZiBwcm9wZXJ0eSBpcyBhcnJheSwgdGhlbiBsb2FkIHRoZSBzdWJjb2xsZWN0aW9uIGludG8gaXRcclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7cHJvcGVydHlLZXl9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc09uZU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc09uZVJlbGF0aW9uQ29uZmlnXHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbaGFzT25lT3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKGhhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baGFzT25lT3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIC8vcmV2ZXJzZSBiYWNrIHRoZSBhcnJheSBcclxuICAgICAgICByZWxhdGlvbnMucmV2ZXJzZSgpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSkpe1xyXG4gICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbbG9hZGVkUHJvcGVydHldKXtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhbnlUaGlzW2xvYWRlZFByb3BlcnR5XVtpbmRleF0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qmx1ZXByaW50PFQgZXh0ZW5kcyBNb2RlbD4odGhpczogVCk6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgIHJldHVybiBuZXcgQmx1ZXByaW50KHRoaXMsIHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wdGlvbnMucm91dGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKTogUGFyYW1zT2JqZWN0IHtcclxuICAgICAgY29uc3Qgc2VhcmNoUmVnZXggPSAveyhbXn1dKyl9L2dcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMgJiBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSBwcm90b3R5cGUuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuICAgICAgaWYocHJvdG90eXBlLmNvbGxlY3Rpb24pIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9UT0RPIGhhdmUgYSBsb29rIGF0IHRoZSB3b3JraW5ncyBvZiB0aGlzIGdldFJPdXRlUGFyYW1ldGVyIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgc3RyYW5nZSB0aGluZ3MgaW52b2x2ZWRcclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMucm91dGVQYXJhbSl7XHJcbiAgICAgICAgICAgICAgcGFyYW1zT2JqZWN0W29wdGlvbnMubmFtZSA/PyBwcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zdCBwYXRoVGVtcGxhdGUgPSBvcHRpb25zLnJvdXRlXHJcbiAgICAgICAgLy8gY29uc3QgcGFyYW1zID0gc2VhcmNoUmVnZXguZXhlYyhwYXRoVGVtcGxhdGUpXHJcblxyXG4gICAgICAgIC8vIC8vIGNvbnN0IHJldHVyblBhcmFtczogc3RyaW5nW10gPSBbXVxyXG4gICAgICAgIC8vIC8vaWYgaGFzIHJvdXRlIHBhcmFtXHJcbiAgICAgICAgLy8gaWYocGFyYW1zKXtcclxuICAgICAgICAvLyAgIC8vY2hlY2sgdG8gc2VlIGlmIHJvdXRlIHBhcmFtIGlzIGEgcHJvcGVydHkgb2YgdGhlIG1vZGVsIGFuZCBpdCBpcyBzZXRcclxuICAgICAgICAvLyAgIHBhcmFtcy5mb3JFYWNoKChwYXJhbSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBjb25zdCBwYXJhbVN0cmlwID0gcGFyYW0ucmVwbGFjZSgvW3t9XS9nLCAnJylcclxuICAgICAgICAvLyAgICAgaWYoIXBhcmFtc09iamVjdFtwYXJhbVN0cmlwXSl7XHJcbiAgICAgICAgLy8gICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlZCByb3V0ZSBwYXJhbSAke3BhcmFtU3RyaXB9IGlzIG5vdCBzZXQgb24gdGhlIGNsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgLy8gaWYoIXJldHVyblBhcmFtcy5pbmNsdWRlcyhwYXJhbVN0cmlwKSkgcmV0dXJuUGFyYW1zLnB1c2gocGFyYW1TdHJpcClcclxuICAgICAgICAvLyAgIH0pXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyYW1zT2JqZWN0XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCBhbm5vdGF0ZWQgd2l0aCBAQ29sbGVjdGlvbmApXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9Kc29uKHRvRmlyZUpzb246IGJvb2xlYW4gPSBmYWxzZSk6IGFueSB7XHJcbiAgICAgIHRoaXMucmVzZXQoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuaW5uZXJUb0pzb24odG9GaXJlSnNvbilcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlubmVyVG9Kc29uKHRvRmlyZUpzb246IGJvb2xlYW4pOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSB7fVxyXG5cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkc1xyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgIC8vIGlmIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgaW50byBqc29uXHJcbiAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSB8fCAhdG9GaXJlSnNvbil7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZmllbGREYXRhW3Byb3BlcnR5S2V5XSBhcyBGaWVsZENvbmZpZyA/PyBudWxsXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh0aGlzW3Byb3BlcnR5S2V5XSkpe1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gW11cclxuICAgICAgICAgICAgICAgIDsodGhpc1twcm9wZXJ0eUtleV0gYXMgdW5rbm93biBhcyBBcnJheTxhbnk+KS5mb3JFYWNoKCh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XS5wdXNoKHRoaXMuY29udmVydEZyb21JbnN0YW5jZSh2YWx1ZSwgdG9GaXJlSnNvbikpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRGcm9tSW5zdGFuY2UodGhpc1twcm9wZXJ0eUtleV0sIHRvRmlyZUpzb24pXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIGlmIHRoZSBwcm9wZXJ0eSBpcyBhIG1vZGVsLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpZihvcHRpb25zPy50aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgIGlmKHRvRmlyZUpzb24pe1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0VG9UaW1lc3RhbXAoKHRoaXNbcHJvcGVydHlLZXldIGFzIGFueSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBqc29uLmlkID0gdGhpcy5pZFxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydEZyb21JbnN0YW5jZShkYXRhOiBhbnksIHRvRmlyZUpzb246IGJvb2xlYW4pOiBhbnkge1xyXG4gICAgICBpZihkYXRhIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgIHJldHVybiBkYXRhLmlubmVyRnJvbUpzb24oZGF0YSwgdG9GaXJlSnNvbilcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2VUb1BsYWluKGRhdGEsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZyb21Kc29uKGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuID0gZmFsc2UpOiB0aGlzIHtcclxuICAgICAgdGhpcy5pbm5lckZyb21Kc29uKGRhdGEsIGZyb21GaXJlSnNvbilcclxuXHJcbiAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbm5lckZyb21Kc29uKGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuKTogdGhpcyB7XHJcbiAgICAgIGxldCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IGZpZWxkRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzKS5maWVsZHNcclxuXHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiBkYXRhKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV0gYXMgRmllbGRDb25maWcgPz8gbnVsbFxyXG4gICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnM/Lm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgaWYob3B0aW9ucz8ubW9kZWxDbGFzcykge1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGRhdGFbanNvblByb3BlcnR5S2V5XSkpe1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IG5ldyBBcnJheSgpXHJcbiAgICAgICAgICAgICAgZGF0YVtqc29uUHJvcGVydHlLZXldLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKHRoaXMuY29udmVydFRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCB2YWx1ZSwgZnJvbUZpcmVKc29uKSlcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydFRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0sIGZyb21GaXJlSnNvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYob3B0aW9ucz8udGltZXN0YW1wKSB7XHJcbiAgICAgICAgICAgICAgaWYoZnJvbUZpcmVKc29uKXtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydEZyb21UaW1lc3RhbXAoZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGRhdGFbanNvblByb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGRhdGFbanNvblByb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhLmlkXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydFRvSW5zdGFuY2U8VCBleHRlbmRzIENvbnN0cnVjdG9yRnVuY3Rpb248dW5rbm93bj4+KG1vZGVsQ2xhc3M6IFQsIGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuKTogVCB7XHJcbiAgICAgIGlmKG1vZGVsQ2xhc3MucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgIHJldHVybiAoKG5ldyBtb2RlbENsYXNzKCkpIGFzIE1vZGVsKS5pbm5lckZyb21Kc29uKGRhdGEsIGZyb21GaXJlSnNvbikgYXMgdW5rbm93biBhcyBUXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHBsYWluVG9JbnN0YW5jZShtb2RlbENsYXNzLCBkYXRhLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pIGFzIFRcclxuICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==