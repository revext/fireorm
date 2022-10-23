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
                if (relationKeys.includes(propertyKey) && propertyKey === relationName) {
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
        // this.reset()
        const json = this.innerToJson(toFireJson);
        // this.init()
        return json;
    }
    innerToJson(toFireJson) {
        var _a, _b, _c, _d, _e;
        const json = {};
        const relationData = (_a = Object.getPrototypeOf(this).relations) !== null && _a !== void 0 ? _a : {};
        const fieldData = (_b = Object.getPrototypeOf(this).fields) !== null && _b !== void 0 ? _b : {};
        const fieldKeys = Object.keys(fieldData);
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (fieldKeys.includes(propertyKey) || !toFireJson) {
                const options = (_c = fieldData[propertyKey]) !== null && _c !== void 0 ? _c : null;
                const relationOption = (_d = relationData[propertyKey]) !== null && _d !== void 0 ? _d : null;
                const jsonPropertyKey = (_e = options === null || options === void 0 ? void 0 : options.name) !== null && _e !== void 0 ? _e : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if ((options === null || options === void 0 ? void 0 : options.modelClass) || ((relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) && !toFireJson)) {
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
                            if (this[propertyKey] instanceof Date) {
                                if (toFireJson) {
                                    json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                                }
                                else {
                                    json[jsonPropertyKey] = this[propertyKey].toString();
                                }
                            }
                            else {
                                json[jsonPropertyKey] = null;
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
            return data.innerToJson(toFireJson);
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
        var _a, _b, _c, _d, _e, _f;
        let anyThis = this;
        const fieldData = (_a = Object.getPrototypeOf(this).fields) !== null && _a !== void 0 ? _a : {};
        const relationData = (_b = Object.getPrototypeOf(this).relations) !== null && _b !== void 0 ? _b : {};
        for (const propertyKey in data) {
            const options = (_c = fieldData[propertyKey]) !== null && _c !== void 0 ? _c : null;
            const relationOption = (_d = relationData[propertyKey]) !== null && _d !== void 0 ? _d : null;
            const jsonPropertyKey = (_e = options === null || options === void 0 ? void 0 : options.name) !== null && _e !== void 0 ? _e : propertyKey;
            if (data[jsonPropertyKey]) {
                if ((options === null || options === void 0 ? void 0 : options.modelClass) || ((relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) && !fromFireJson)) {
                    if (Array.isArray(data[jsonPropertyKey])) {
                        anyThis[jsonPropertyKey] = new Array();
                        data[jsonPropertyKey].forEach((value) => {
                            var _a;
                            anyThis[jsonPropertyKey].push(this.convertToInstance((_a = relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) !== null && _a !== void 0 ? _a : options.modelClass, value, fromFireJson));
                        });
                    }
                    else {
                        anyThis[jsonPropertyKey] = this.convertToInstance((_f = relationOption === null || relationOption === void 0 ? void 0 : relationOption.modelClass) !== null && _f !== void 0 ? _f : options.modelClass, data[jsonPropertyKey], fromFireJson);
                    }
                }
                else {
                    if (options === null || options === void 0 ? void 0 : options.timestamp) {
                        if (data[jsonPropertyKey] !== null) {
                            if (fromFireJson) {
                                anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                            }
                            else {
                                anyThis[propertyKey] = new Date(data[jsonPropertyKey]);
                            }
                        }
                        else {
                            anyThis[propertyKey] = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU90QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBTEgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxLQUFXLE9BQU0sQ0FBQyxDQUFDO0lBTWhCLFlBQVk7O1FBRWxCLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUF1QixDQUFBO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksRUFBRSxDQUFBO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdEMsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFzQixDQUFBO2dCQUV2RCxJQUFHLElBQUksWUFBWSxRQUFRLEVBQUM7b0JBQzFCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBb0IsQ0FBQyxDQUFDLENBQUE7aUJBQ3pEO3FCQUFN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QyxHQUFHLElBQUksQ0FBQTt5QkFDNUI7cUJBQ0Y7eUJBQU07d0JBQ0wsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtxQkFDN0M7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBRWpCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVPLGlCQUFpQixDQUF5QyxVQUFhLEVBQUUsSUFBUyxFQUFFLFlBQXFCO1FBQy9HLElBQUcsVUFBVSxDQUFDLFNBQVMsWUFBWSxLQUFLLEVBQUM7WUFDdkMsT0FBUSxDQUFDLElBQUksVUFBVSxFQUFFLENBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBaUIsQ0FBQTtTQUN2RjthQUFNO1lBQ0wsT0FBTyxJQUFBLG1DQUFlLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFDLG1CQUFtQixFQUFFLElBQUksRUFBQyxDQUFNLENBQUE7U0FDM0U7SUFDSCxDQUFDO0NBQ0o7QUEvVkc7SUFEQyxJQUFBLFNBQUssR0FBRTs7aUNBQ1U7QUFGdEIsd0JBaVdDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCBWYWxpZGF0b3IsIHsgRXJyb3JzIH0gZnJvbSBcInZhbGlkYXRvcmpzXCJcclxuaW1wb3J0IFJlcG9zaXRvcnkgZnJvbSBcIn4vcmVwb3NpdG9yaWVzL1JlcG9zaXRvcnlcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIEhhc09uZVJlbGF0aW9uQ29uZmlnLCBSZWxhdGlvbkNvbmZpZywgUmVsYXRpb25Db25maWdXaXRoVHlwZSB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1JlbGF0aW9uQ29uZmlnXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdG9yRnVuY3Rpb24gfSBmcm9tIFwiLi4vdHlwZXMvZnVuY3Rpb25zL0NvbnN0cnVjdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IHsgRmllbGRDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9GaWVsZENvbmZpZ1wiO1xyXG5pbXBvcnQgeyBWYWxpZGF0ZUNvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1ZhbGlkYXRlQ29uZmlnXCI7XHJcbmltcG9ydCB7IEJsdWVwcmludCB9IGZyb20gXCIuL0JsdWVwcmludFwiO1xyXG5pbXBvcnQgeyBGaWVsZCB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBpbnN0YW5jZVRvUGxhaW4sIHBsYWluVG9JbnN0YW5jZSB9IGZyb20gXCJjbGFzcy10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhGaWVsZHMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhGaWVsZHNcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoQ29sbGVjdGlvbiB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aENvbGxlY3Rpb25cIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoUmVsYXRpb25zIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoUmVsYXRpb25zXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aFJ1bGVzIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoUnVsZXNcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBQYXJhbXNPYmplY3QgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xyXG5cclxuLy9UT0RPIGV2ZW50cyBiZWZvcmUgZGVsZXRlLCBhZnRlciBkZWxldCwgYmVmb3JlIGxvYWQsIGJlZm9yZS1hZnRlciBzYXZlLCB1cGRhdGUgZXRjLi4uXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBNb2RlbCB7XHJcbiAgICBARmllbGQoKVxyXG4gICAgaWQ/OiBzdHJpbmcgPSBudWxsXHJcblxyXG4gICAgcmVsYXRpb25zTG9hZGVkOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgY29uc3RydWN0b3IoLi4uXzogYW55W10pIHt9XHJcblxyXG4gICAgaW5pdCguLi5fOiBhbnlbXSk6IHZvaWQgeyByZXR1cm4gfVxyXG4gICAgcmVzZXQoKTogdm9pZCB7IHJldHVybiB9XHJcblxyXG4gICAgcHJpdmF0ZSBlcnJvcnM6IEVycm9ycyA9IG51bGxcclxuXHJcbiAgICBhYnN0cmFjdCBnZXRNb2RlbE5hbWUoKTogc3RyaW5nXHJcblxyXG4gICAgcHJpdmF0ZSBjb2xsZWN0UnVsZXM8VD4oKTogVmFsaWRhdG9yLlJ1bGVzIHtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUnVsZXM8VD4pXHJcbiAgICAgIGNvbnN0IHJ1bGVEYXRhID0gcHJvdG90eXBlLnJ1bGVzID8/IHt9XHJcbiAgICAgIGNvbnN0IHJ1bGVLZXlzID0gT2JqZWN0LmtleXMocnVsZURhdGEpXHJcblxyXG4gICAgICBsZXQgcnVsZXM6IFZhbGlkYXRvci5SdWxlcyA9IHt9XHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKXtcclxuICAgICAgICAvL1RPRE8gcmVjdXJzaXZlIHZhbGlkYXRpb24gb24gcmVsYXRlZCBtb2RlbHNcclxuICAgICAgICBpZihydWxlS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3QgcnVsZSA9IHJ1bGVEYXRhW3Byb3BlcnR5S2V5XSBhcyBWYWxpZGF0ZUNvbmZpZzxUPlxyXG5cclxuICAgICAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiBGdW5jdGlvbil7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSh0aGlzIGFzIHVua25vd24gYXMgVCkpXHJcbiAgICAgICAgICB9IGVsc2UgaWYocnVsZSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJ1bGVzW3Byb3BlcnR5S2V5XSA9IHJ1bGVcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJ1bGVzXHJcbiAgICB9XHJcblxyXG4gICAgdmFsaWRhdGUgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5jb2xsZWN0UnVsZXMoKVxyXG4gICAgICAgIGxldCB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKHRoaXMgYXMgYW55LCBydWxlcylcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkYXRvci5oYXNBc3luYykge1xyXG4gICAgICAgICAgdmFsaWRhdG9yLmNoZWNrQXN5bmMocmVzb2x2ZSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JzKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHZhbGlkYXRvci5jaGVjaygpKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCh0aGlzLmVycm9ycylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzICgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzID8/IHt9KS5sZW5ndGggPiAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWxsRXJyb3JzICgpOiBWYWxpZGF0b3IuVmFsaWRhdGlvbkVycm9ycyB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uYWxsKClcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvcnMgKG5hbWU6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZ2V0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3IgKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5maXJzdChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRNYW55KHJlbGF0aW9uTmFtZXM6IHN0cmluZ1tdLCBmb3JjZVJlbG9hZDogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPHZvaWQ+e1xyXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdXHJcbiAgICAgIGZvcihjb25zdCByZWxhdGlvbiBpbiByZWxhdGlvbk5hbWVzKXtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZChyZWxhdGlvbk5hbWVzW3JlbGF0aW9uXSwgZm9yY2VSZWxvYWQpKVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWQocmVsYXRpb25OYW1lOiBzdHJpbmcsIGZvcmNlUmVsb2FkOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZVxyXG4gICAgICBjb25zdCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9ucyA9IHJlbGF0aW9uTmFtZS5zcGxpdCgnLicpXHJcbiAgICAgIHJlbGF0aW9uTmFtZSA9IHJlbGF0aW9ucy5yZXZlcnNlKCkucG9wKClcclxuXHJcbiAgICAgIGxldCBsb2FkZWRQcm9wZXJ0eSA9IHJlbGF0aW9uTmFtZVxyXG5cclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uRGF0YSA9IHByb3RvdHlwZS5yZWxhdGlvbnMgPz8ge31cclxuICAgICAgY29uc3QgcmVsYXRpb25LZXlzID0gT2JqZWN0LmtleXMocmVsYXRpb25EYXRhKVxyXG4gICAgICBcclxuICAgICAgaWYoIXRoaXMucmVsYXRpb25zTG9hZGVkLmluY2x1ZGVzKHJlbGF0aW9uTmFtZSkgfHwgZm9yY2VSZWxvYWQpe1xyXG4gICAgICAgIGNvbnN0IHJvdXRlUGFyYW1zID0gdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihyZWxhdGlvbktleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpICYmIHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW3Byb3BlcnR5S2V5XSkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZE1hbnkoKGhhc01hbnlPcHRpb25zLm1hcElkcyA/IGhhc01hbnlPcHRpb25zLm1hcElkcyh0aGlzKSA6IGFueVRoaXNbaGFzTWFueU9wdGlvbnMucmVsYXRlZElkc10pLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNDb2xsZWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPIGFuIG9wdGlvbiB3aGVyZSB0aGUgcmVsYXRlZCBkYXRhIGNhbiBiZSAncGFnaW5hdGVkJ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBpZiBwcm9wZXJ0eSBpcyBhcnJheSwgdGhlbiBsb2FkIHRoZSBzdWJjb2xsZWN0aW9uIGludG8gaXRcclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7cHJvcGVydHlLZXl9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc09uZU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc09uZVJlbGF0aW9uQ29uZmlnXHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbaGFzT25lT3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKGhhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baGFzT25lT3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIC8vcmV2ZXJzZSBiYWNrIHRoZSBhcnJheSBcclxuICAgICAgICByZWxhdGlvbnMucmV2ZXJzZSgpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSkpe1xyXG4gICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbbG9hZGVkUHJvcGVydHldKXtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhbnlUaGlzW2xvYWRlZFByb3BlcnR5XVtpbmRleF0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qmx1ZXByaW50PFQgZXh0ZW5kcyBNb2RlbD4odGhpczogVCk6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgIHJldHVybiBuZXcgQmx1ZXByaW50KHRoaXMsIHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wdGlvbnMucm91dGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKTogUGFyYW1zT2JqZWN0IHtcclxuICAgICAgY29uc3Qgc2VhcmNoUmVnZXggPSAveyhbXn1dKyl9L2dcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMgJiBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSBwcm90b3R5cGUuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuICAgICAgaWYocHJvdG90eXBlLmNvbGxlY3Rpb24pIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9UT0RPIGhhdmUgYSBsb29rIGF0IHRoZSB3b3JraW5ncyBvZiB0aGlzIGdldFJPdXRlUGFyYW1ldGVyIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgc3RyYW5nZSB0aGluZ3MgaW52b2x2ZWRcclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMucm91dGVQYXJhbSl7XHJcbiAgICAgICAgICAgICAgcGFyYW1zT2JqZWN0W29wdGlvbnMubmFtZSA/PyBwcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zdCBwYXRoVGVtcGxhdGUgPSBvcHRpb25zLnJvdXRlXHJcbiAgICAgICAgLy8gY29uc3QgcGFyYW1zID0gc2VhcmNoUmVnZXguZXhlYyhwYXRoVGVtcGxhdGUpXHJcblxyXG4gICAgICAgIC8vIC8vIGNvbnN0IHJldHVyblBhcmFtczogc3RyaW5nW10gPSBbXVxyXG4gICAgICAgIC8vIC8vaWYgaGFzIHJvdXRlIHBhcmFtXHJcbiAgICAgICAgLy8gaWYocGFyYW1zKXtcclxuICAgICAgICAvLyAgIC8vY2hlY2sgdG8gc2VlIGlmIHJvdXRlIHBhcmFtIGlzIGEgcHJvcGVydHkgb2YgdGhlIG1vZGVsIGFuZCBpdCBpcyBzZXRcclxuICAgICAgICAvLyAgIHBhcmFtcy5mb3JFYWNoKChwYXJhbSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBjb25zdCBwYXJhbVN0cmlwID0gcGFyYW0ucmVwbGFjZSgvW3t9XS9nLCAnJylcclxuICAgICAgICAvLyAgICAgaWYoIXBhcmFtc09iamVjdFtwYXJhbVN0cmlwXSl7XHJcbiAgICAgICAgLy8gICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlZCByb3V0ZSBwYXJhbSAke3BhcmFtU3RyaXB9IGlzIG5vdCBzZXQgb24gdGhlIGNsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgLy8gaWYoIXJldHVyblBhcmFtcy5pbmNsdWRlcyhwYXJhbVN0cmlwKSkgcmV0dXJuUGFyYW1zLnB1c2gocGFyYW1TdHJpcClcclxuICAgICAgICAvLyAgIH0pXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyYW1zT2JqZWN0XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCBhbm5vdGF0ZWQgd2l0aCBAQ29sbGVjdGlvbmApXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9Kc29uKHRvRmlyZUpzb246IGJvb2xlYW4gPSBmYWxzZSk6IGFueSB7XHJcbiAgICAgIC8vIHRoaXMucmVzZXQoKVxyXG5cclxuICAgICAgY29uc3QganNvbiA9IHRoaXMuaW5uZXJUb0pzb24odG9GaXJlSnNvbilcclxuXHJcbiAgICAgIC8vIHRoaXMuaW5pdCgpXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbm5lclRvSnNvbih0b0ZpcmVKc29uOiBib29sZWFuKTogYW55IHtcclxuICAgICAgY29uc3QganNvbjogYW55ID0ge31cclxuXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUmVsYXRpb25zKS5yZWxhdGlvbnMgPz8ge31cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgIC8vIGlmIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgaW50byBqc29uXHJcbiAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSB8fCAhdG9GaXJlSnNvbil7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZmllbGREYXRhW3Byb3BlcnR5S2V5XSBhcyBGaWVsZENvbmZpZyA/PyBudWxsXHJcbiAgICAgICAgICBjb25zdCByZWxhdGlvbk9wdGlvbiA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV0gYXMgUmVsYXRpb25Db25maWcgPz8gbnVsbFxyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucz8ubmFtZSA/PyBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgaWYodGhpc1twcm9wZXJ0eUtleV0gIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnM/Lm1vZGVsQ2xhc3MgfHwgKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzICYmICF0b0ZpcmVKc29uKSkge1xyXG4gICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkodGhpc1twcm9wZXJ0eUtleV0pKXtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IFtdXHJcbiAgICAgICAgICAgICAgICA7KHRoaXNbcHJvcGVydHlLZXldIGFzIHVua25vd24gYXMgQXJyYXk8YW55PikuZm9yRWFjaCgodmFsdWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCh0aGlzLmNvbnZlcnRGcm9tSW5zdGFuY2UodmFsdWUsIHRvRmlyZUpzb24pKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUluc3RhbmNlKHRoaXNbcHJvcGVydHlLZXldLCB0b0ZpcmVKc29uKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvLyBpZiB0aGUgcHJvcGVydHkgaXMgYSBtb2RlbCwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgaW50byBqc29uXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucz8udGltZXN0YW1wKSB7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIERhdGUpe1xyXG4gICAgICAgICAgICAgICAgICBpZih0b0ZpcmVKc29uKXtcclxuICAgICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0VG9UaW1lc3RhbXAoKHRoaXNbcHJvcGVydHlLZXldIGFzIGFueSkpXHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gKHRoaXNbcHJvcGVydHlLZXldIGFzIHVua25vd24gYXMgRGF0ZSkudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBudWxsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBudWxsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGpzb24uaWQgPSB0aGlzLmlkXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0RnJvbUluc3RhbmNlKGRhdGE6IGFueSwgdG9GaXJlSnNvbjogYm9vbGVhbik6IGFueSB7XHJcbiAgICAgIGlmKGRhdGEgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgcmV0dXJuIGRhdGEuaW5uZXJUb0pzb24odG9GaXJlSnNvbilcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2VUb1BsYWluKGRhdGEsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZyb21Kc29uKGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuID0gZmFsc2UpOiB0aGlzIHtcclxuICAgICAgdGhpcy5pbm5lckZyb21Kc29uKGRhdGEsIGZyb21GaXJlSnNvbilcclxuXHJcbiAgICAgIHRoaXMuaW5pdCgpXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpbm5lckZyb21Kc29uKGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuKTogdGhpcyB7XHJcbiAgICAgIGxldCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IGZpZWxkRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzKS5maWVsZHMgPz8ge31cclxuICAgICAgY29uc3QgcmVsYXRpb25EYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpLnJlbGF0aW9ucyA/PyB7fVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIGRhdGEpIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gZmllbGREYXRhW3Byb3BlcnR5S2V5XSBhcyBGaWVsZENvbmZpZyA/PyBudWxsXHJcbiAgICAgICAgY29uc3QgcmVsYXRpb25PcHRpb24gPSByZWxhdGlvbkRhdGFbcHJvcGVydHlLZXldIGFzIFJlbGF0aW9uQ29uZmlnID8/IG51bGxcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zPy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldKXtcclxuICAgICAgICAgIGlmKG9wdGlvbnM/Lm1vZGVsQ2xhc3MgfHwgKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzICYmICFmcm9tRmlyZUpzb24pKSB7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZGF0YVtqc29uUHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gbmV3IEFycmF5KClcclxuICAgICAgICAgICAgICBkYXRhW2pzb25Qcm9wZXJ0eUtleV0uZm9yRWFjaCgodmFsdWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldLnB1c2godGhpcy5jb252ZXJ0VG9JbnN0YW5jZShyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyA/PyBvcHRpb25zLm1vZGVsQ2xhc3MsIHZhbHVlLCBmcm9tRmlyZUpzb24pKVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0VG9JbnN0YW5jZShyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyA/PyBvcHRpb25zLm1vZGVsQ2xhc3MsIGRhdGFbanNvblByb3BlcnR5S2V5XSwgZnJvbUZpcmVKc29uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy50aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gIT09IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgaWYoZnJvbUZpcmVKc29uKXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0RnJvbVRpbWVzdGFtcChkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IG5ldyBEYXRlKGRhdGFbanNvblByb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBudWxsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gZGF0YVtqc29uUHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5pZCA9IGRhdGEuaWRcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9JbnN0YW5jZTxUIGV4dGVuZHMgQ29uc3RydWN0b3JGdW5jdGlvbjx1bmtub3duPj4obW9kZWxDbGFzczogVCwgZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4pOiBUIHtcclxuICAgICAgaWYobW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgcmV0dXJuICgobmV3IG1vZGVsQ2xhc3MoKSkgYXMgTW9kZWwpLmlubmVyRnJvbUpzb24oZGF0YSwgZnJvbUZpcmVKc29uKSBhcyB1bmtub3duIGFzIFRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcGxhaW5Ub0luc3RhbmNlKG1vZGVsQ2xhc3MsIGRhdGEsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSkgYXMgVFxyXG4gICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19