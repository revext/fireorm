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
                            if (toFireJson) {
                                json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                            }
                            else {
                                json[jsonPropertyKey] = this[propertyKey].toString();
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
                        if (fromFireJson) {
                            anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                        }
                        else {
                            anyThis[propertyKey] = new Date(data[jsonPropertyKey]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU90QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBTEgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxLQUFXLE9BQU0sQ0FBQyxDQUFDO0lBTWhCLFlBQVk7O1FBRWxCLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUF1QixDQUFBO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksRUFBRSxDQUFBO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdEMsSUFBSSxLQUFLLEdBQW9CLEVBQUUsQ0FBQTtRQUMvQixLQUFJLE1BQU0sV0FBVyxJQUFJLElBQUksRUFBQztZQUM1Qiw2Q0FBNkM7WUFDN0MsSUFBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFzQixDQUFBO2dCQUV2RCxJQUFHLElBQUksWUFBWSxRQUFRLEVBQUM7b0JBQzFCLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBb0IsQ0FBQyxDQUFDLENBQUE7aUJBQ3pEO3FCQUFN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O1FBQy9HLElBQUcsVUFBVSxDQUFDLFNBQVMsWUFBWSxLQUFLLEVBQUM7WUFDdkMsT0FBUSxDQUFDLElBQUksVUFBVSxFQUFFLENBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBaUIsQ0FBQTtTQUN2RjthQUFNO1lBQ0wsT0FBTyxJQUFBLG1DQUFlLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFDLG1CQUFtQixFQUFFLElBQUksRUFBQyxDQUFNLENBQUE7U0FDM0U7SUFDSCxDQUFDO0NBQ0o7QUF2Vkc7SUFEQyxJQUFBLFNBQUssR0FBRTs7aUNBQ1U7QUFGdEIsd0JBeVZDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCBWYWxpZGF0b3IsIHsgRXJyb3JzIH0gZnJvbSBcInZhbGlkYXRvcmpzXCJcclxuaW1wb3J0IFJlcG9zaXRvcnkgZnJvbSBcIn4vcmVwb3NpdG9yaWVzL1JlcG9zaXRvcnlcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIEhhc09uZVJlbGF0aW9uQ29uZmlnLCBSZWxhdGlvbkNvbmZpZywgUmVsYXRpb25Db25maWdXaXRoVHlwZSB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1JlbGF0aW9uQ29uZmlnXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdG9yRnVuY3Rpb24gfSBmcm9tIFwiLi4vdHlwZXMvZnVuY3Rpb25zL0NvbnN0cnVjdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IHsgRmllbGRDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9GaWVsZENvbmZpZ1wiO1xyXG5pbXBvcnQgeyBWYWxpZGF0ZUNvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL1ZhbGlkYXRlQ29uZmlnXCI7XHJcbmltcG9ydCB7IEJsdWVwcmludCB9IGZyb20gXCIuL0JsdWVwcmludFwiO1xyXG5pbXBvcnQgeyBGaWVsZCB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBpbnN0YW5jZVRvUGxhaW4sIHBsYWluVG9JbnN0YW5jZSB9IGZyb20gXCJjbGFzcy10cmFuc2Zvcm1lclwiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhGaWVsZHMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhGaWVsZHNcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoQ29sbGVjdGlvbiB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aENvbGxlY3Rpb25cIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoUmVsYXRpb25zIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoUmVsYXRpb25zXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aFJ1bGVzIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoUnVsZXNcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBQYXJhbXNPYmplY3QgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xyXG5cclxuLy9UT0RPIGV2ZW50cyBiZWZvcmUgZGVsZXRlLCBhZnRlciBkZWxldCwgYmVmb3JlIGxvYWQsIGJlZm9yZS1hZnRlciBzYXZlLCB1cGRhdGUgZXRjLi4uXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBNb2RlbCB7XHJcbiAgICBARmllbGQoKVxyXG4gICAgaWQ/OiBzdHJpbmcgPSBudWxsXHJcblxyXG4gICAgcmVsYXRpb25zTG9hZGVkOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgY29uc3RydWN0b3IoLi4uXzogYW55W10pIHt9XHJcblxyXG4gICAgaW5pdCguLi5fOiBhbnlbXSk6IHZvaWQgeyByZXR1cm4gfVxyXG4gICAgcmVzZXQoKTogdm9pZCB7IHJldHVybiB9XHJcblxyXG4gICAgcHJpdmF0ZSBlcnJvcnM6IEVycm9ycyA9IG51bGxcclxuXHJcbiAgICBhYnN0cmFjdCBnZXRNb2RlbE5hbWUoKTogc3RyaW5nXHJcblxyXG4gICAgcHJpdmF0ZSBjb2xsZWN0UnVsZXM8VD4oKTogVmFsaWRhdG9yLlJ1bGVzIHtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUnVsZXM8VD4pXHJcbiAgICAgIGNvbnN0IHJ1bGVEYXRhID0gcHJvdG90eXBlLnJ1bGVzID8/IHt9XHJcbiAgICAgIGNvbnN0IHJ1bGVLZXlzID0gT2JqZWN0LmtleXMocnVsZURhdGEpXHJcblxyXG4gICAgICBsZXQgcnVsZXM6IFZhbGlkYXRvci5SdWxlcyA9IHt9XHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKXtcclxuICAgICAgICAvL1RPRE8gcmVjdXJzaXZlIHZhbGlkYXRpb24gb24gcmVsYXRlZCBtb2RlbHNcclxuICAgICAgICBpZihydWxlS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3QgcnVsZSA9IHJ1bGVEYXRhW3Byb3BlcnR5S2V5XSBhcyBWYWxpZGF0ZUNvbmZpZzxUPlxyXG5cclxuICAgICAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiBGdW5jdGlvbil7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSh0aGlzIGFzIHVua25vd24gYXMgVCkpXHJcbiAgICAgICAgICB9IGVsc2UgaWYocnVsZSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJ1bGVzW3Byb3BlcnR5S2V5XSA9IHJ1bGVcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJ1bGVzXHJcbiAgICB9XHJcblxyXG4gICAgdmFsaWRhdGUgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5jb2xsZWN0UnVsZXMoKVxyXG4gICAgICAgIGxldCB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKHRoaXMgYXMgYW55LCBydWxlcylcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkYXRvci5oYXNBc3luYykge1xyXG4gICAgICAgICAgdmFsaWRhdG9yLmNoZWNrQXN5bmMocmVzb2x2ZSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JzKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHZhbGlkYXRvci5jaGVjaygpKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCh0aGlzLmVycm9ycylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzICgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzID8/IHt9KS5sZW5ndGggPiAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWxsRXJyb3JzICgpOiBWYWxpZGF0b3IuVmFsaWRhdGlvbkVycm9ycyB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uYWxsKClcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvcnMgKG5hbWU6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZ2V0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3IgKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5maXJzdChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRNYW55KHJlbGF0aW9uTmFtZXM6IHN0cmluZ1tdLCBmb3JjZVJlbG9hZDogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPHZvaWQ+e1xyXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdXHJcbiAgICAgIGZvcihjb25zdCByZWxhdGlvbiBpbiByZWxhdGlvbk5hbWVzKXtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZChyZWxhdGlvbk5hbWVzW3JlbGF0aW9uXSwgZm9yY2VSZWxvYWQpKVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWQocmVsYXRpb25OYW1lOiBzdHJpbmcsIGZvcmNlUmVsb2FkOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZVxyXG4gICAgICBjb25zdCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9ucyA9IHJlbGF0aW9uTmFtZS5zcGxpdCgnLicpXHJcbiAgICAgIHJlbGF0aW9uTmFtZSA9IHJlbGF0aW9ucy5yZXZlcnNlKCkucG9wKClcclxuXHJcbiAgICAgIGxldCBsb2FkZWRQcm9wZXJ0eSA9IHJlbGF0aW9uTmFtZVxyXG5cclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uRGF0YSA9IHByb3RvdHlwZS5yZWxhdGlvbnMgPz8ge31cclxuICAgICAgY29uc3QgcmVsYXRpb25LZXlzID0gT2JqZWN0LmtleXMocmVsYXRpb25EYXRhKVxyXG4gICAgICBcclxuICAgICAgaWYoIXRoaXMucmVsYXRpb25zTG9hZGVkLmluY2x1ZGVzKHJlbGF0aW9uTmFtZSkgfHwgZm9yY2VSZWxvYWQpe1xyXG4gICAgICAgIGNvbnN0IHJvdXRlUGFyYW1zID0gdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihyZWxhdGlvbktleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgLy9nZXQgdGhlIHJlcG9zaXRvcnkgZm9yIHRoZSBjdXJyZW50IG1vZGVsQ2xhc3NcclxuICAgICAgICAgICAgY29uc3QgcmVwb3NpdG9yeSA9IGdldFJlcG9zaXRvcnlGb3Iob3B0aW9ucy5tb2RlbENsYXNzIGFzIENvbnN0cnVjdG9yRnVuY3Rpb248TW9kZWw+KSBhcyBSZXBvc2l0b3J5PE1vZGVsPlxyXG4gICAgICAgICAgICBpZigob3B0aW9ucy5uYW1lICYmIG9wdGlvbnMubmFtZSA9PT0gcmVsYXRpb25OYW1lKSB8fCBwcm9wZXJ0eUtleSA9PT0gcmVsYXRpb25OYW1lKSB7XHJcbiAgICAgICAgICAgICAgbG9hZGVkUHJvcGVydHkgPSBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc01hbnknKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc01hbnlPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNNYW55UmVsYXRpb25Db25maWdcclxuICAgICAgICAgICAgICAgIGlmKCFoYXNNYW55T3B0aW9ucy5tYXBJZHMgJiYgIWhhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHMpe1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEBIYXNNYW55IHJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gaXMgbWlzc2luZyAnbWFwSWRzJyBhbmQgJ3JlbGF0ZWRJZHMnLiBPbmUgb2YgdGhlbSBtdXN0IGJlIGRlZmluZWQuYClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRNYW55KChoYXNNYW55T3B0aW9ucy5tYXBJZHMgPyBoYXNNYW55T3B0aW9ucy5tYXBJZHModGhpcykgOiBhbnlUaGlzW2hhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHNdKSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1twcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baW5kZXhdW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IHdpdGggJyR7b3B0aW9ucy50eXBlfScgb24gJHtwcm9wZXJ0eUtleX0gcHJvcGVydHkgaXMgbm90IGFuIGFycmF5YClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2UgaWYob3B0aW9ucy50eXBlID09PSAnaGFzQ29sbGVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETyBhbiBvcHRpb24gd2hlcmUgdGhlIHJlbGF0ZWQgZGF0YSBjYW4gYmUgJ3BhZ2luYXRlZCdcclxuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcHJvcGVydHkgaXMgYXJyYXksIHRoZW4gbG9hZCB0aGUgc3ViY29sbGVjdGlvbiBpbnRvIGl0XHJcbiAgICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGFueVRoaXNbcHJvcGVydHlLZXldKSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkQ29sbGVjdGlvbihyb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNPbmVPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNPbmVSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgLy9sb2FkIGRhdGEgaW50byB0aGUgJ3Byb3BlcnR5S2V5JyBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwsIHdoaWxlIGxvYWQgdGhlIG1vZGVsIHdpdGggdGhlIGlkIGZyb20gdGhlICdyZWxhdGVkSWQnIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZCgodGhpcyBhcyBhbnkpW2hhc09uZU9wdGlvbnMucmVsYXRlZElkXSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICBpZihoYXNPbmVPcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2hhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAgIGlmKCFmb3VuZCl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBub3QgZm91bmQgb24gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5yZWxhdGlvbnNMb2FkZWQucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGggPiAwKXtcclxuICAgICAgICAvL3JldmVyc2UgYmFjayB0aGUgYXJyYXkgXHJcbiAgICAgICAgcmVsYXRpb25zLnJldmVyc2UoKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0pKXtcclxuICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSl7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV1baW5kZXhdLmxvYWQocmVsYXRpb25zLmpvaW4oJy4nKSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXdhaXQgYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEJsdWVwcmludDxUIGV4dGVuZHMgTW9kZWw+KHRoaXM6IFQpOiBCbHVlcHJpbnQ8VD4ge1xyXG4gICAgICByZXR1cm4gbmV3IEJsdWVwcmludCh0aGlzLCB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpKVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvdXRlKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHRpb25zLnJvdXRlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCk6IFBhcmFtc09iamVjdCB7XHJcbiAgICAgIGNvbnN0IHNlYXJjaFJlZ2V4ID0gL3soW159XSspfS9nXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzICYgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3QgZmllbGREYXRhID0gcHJvdG90eXBlLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcbiAgICAgIGlmKHByb3RvdHlwZS5jb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYXZlIGEgcm91dGUgcGFyYW1ldGVyIG9uIHRoZSBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uYClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVE9ETyBoYXZlIGEgbG9vayBhdCB0aGUgd29ya2luZ3Mgb2YgdGhpcyBnZXRST3V0ZVBhcmFtZXRlciBiZWNhdXNlIHRoZXJlIGFyZSBzb21lIHN0cmFuZ2UgdGhpbmdzIGludm9sdmVkXHJcbiAgICAgICAgLy9nZXQgZXZlcnkgcGFyYW0gd2hpY2ggaGFzIGJlZW4gYW5ub3RhdGVkIGluIHRoZSBtb2RlbCB3aXRoICdyb3V0ZVBhcmFtOiB0cnVlJ1xyXG4gICAgICAgIGNvbnN0IHBhcmFtc09iamVjdDogUGFyYW1zT2JqZWN0ID0ge31cclxuICAgICAgICBcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldXHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLnJvdXRlUGFyYW0pe1xyXG4gICAgICAgICAgICAgIHBhcmFtc09iamVjdFtvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc3QgcGF0aFRlbXBsYXRlID0gb3B0aW9ucy5yb3V0ZVxyXG4gICAgICAgIC8vIGNvbnN0IHBhcmFtcyA9IHNlYXJjaFJlZ2V4LmV4ZWMocGF0aFRlbXBsYXRlKVxyXG5cclxuICAgICAgICAvLyAvLyBjb25zdCByZXR1cm5QYXJhbXM6IHN0cmluZ1tdID0gW11cclxuICAgICAgICAvLyAvL2lmIGhhcyByb3V0ZSBwYXJhbVxyXG4gICAgICAgIC8vIGlmKHBhcmFtcyl7XHJcbiAgICAgICAgLy8gICAvL2NoZWNrIHRvIHNlZSBpZiByb3V0ZSBwYXJhbSBpcyBhIHByb3BlcnR5IG9mIHRoZSBtb2RlbCBhbmQgaXQgaXMgc2V0XHJcbiAgICAgICAgLy8gICBwYXJhbXMuZm9yRWFjaCgocGFyYW0pID0+IHtcclxuICAgICAgICAvLyAgICAgY29uc3QgcGFyYW1TdHJpcCA9IHBhcmFtLnJlcGxhY2UoL1t7fV0vZywgJycpXHJcbiAgICAgICAgLy8gICAgIGlmKCFwYXJhbXNPYmplY3RbcGFyYW1TdHJpcF0pe1xyXG4gICAgICAgIC8vICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVxdWlyZWQgcm91dGUgcGFyYW0gJHtwYXJhbVN0cmlwfSBpcyBub3Qgc2V0IG9uIHRoZSBjbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIC8vIGlmKCFyZXR1cm5QYXJhbXMuaW5jbHVkZXMocGFyYW1TdHJpcCkpIHJldHVyblBhcmFtcy5wdXNoKHBhcmFtU3RyaXApXHJcbiAgICAgICAgLy8gICB9KVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcmFtc09iamVjdFxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBub3QgYW5ub3RhdGVkIHdpdGggQENvbGxlY3Rpb25gKVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvSnNvbih0b0ZpcmVKc29uOiBib29sZWFuID0gZmFsc2UpOiBhbnkge1xyXG4gICAgICAvLyB0aGlzLnJlc2V0KClcclxuXHJcbiAgICAgIGNvbnN0IGpzb24gPSB0aGlzLmlubmVyVG9Kc29uKHRvRmlyZUpzb24pXHJcblxyXG4gICAgICAvLyB0aGlzLmluaXQoKVxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5uZXJUb0pzb24odG9GaXJlSnNvbjogYm9vbGVhbik6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHt9XHJcblxyXG4gICAgICBjb25zdCByZWxhdGlvbkRhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucykucmVsYXRpb25zID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzKS5maWVsZHMgPz8ge31cclxuICAgICAgY29uc3QgZmllbGRLZXlzID0gT2JqZWN0LmtleXMoZmllbGREYXRhKVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAvLyBpZiBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgIGlmKGZpZWxkS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkgfHwgIXRvRmlyZUpzb24pe1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV0gYXMgRmllbGRDb25maWcgPz8gbnVsbFxyXG4gICAgICAgICAgY29uc3QgcmVsYXRpb25PcHRpb24gPSByZWxhdGlvbkRhdGFbcHJvcGVydHlLZXldIGFzIFJlbGF0aW9uQ29uZmlnID8/IG51bGxcclxuICAgICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnM/Lm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzIHx8IChyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyAmJiAhdG9GaXJlSnNvbikpIHtcclxuICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHRoaXNbcHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBbXVxyXG4gICAgICAgICAgICAgICAgOyh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIEFycmF5PGFueT4pLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldLnB1c2godGhpcy5jb252ZXJ0RnJvbUluc3RhbmNlKHZhbHVlLCB0b0ZpcmVKc29uKSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydEZyb21JbnN0YW5jZSh0aGlzW3Byb3BlcnR5S2V5XSwgdG9GaXJlSnNvbilcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnM/LnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgaWYodG9GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRUb1RpbWVzdGFtcCgodGhpc1twcm9wZXJ0eUtleV0gYXMgYW55KSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIERhdGUpLnRvU3RyaW5nKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IG51bGxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAganNvbi5pZCA9IHRoaXMuaWRcclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRGcm9tSW5zdGFuY2UoZGF0YTogYW55LCB0b0ZpcmVKc29uOiBib29sZWFuKTogYW55IHtcclxuICAgICAgaWYoZGF0YSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICByZXR1cm4gZGF0YS5pbm5lclRvSnNvbih0b0ZpcmVKc29uKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBpbnN0YW5jZVRvUGxhaW4oZGF0YSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnJvbUpzb24oZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4gPSBmYWxzZSk6IHRoaXMge1xyXG4gICAgICB0aGlzLmlubmVyRnJvbUpzb24oZGF0YSwgZnJvbUZpcmVKc29uKVxyXG5cclxuICAgICAgdGhpcy5pbml0KClcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlubmVyRnJvbUpzb24oZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4pOiB0aGlzIHtcclxuICAgICAgbGV0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCByZWxhdGlvbkRhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucykucmVsYXRpb25zID8/IHt9XHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gZGF0YSkge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldIGFzIEZpZWxkQ29uZmlnID8/IG51bGxcclxuICAgICAgICBjb25zdCByZWxhdGlvbk9wdGlvbiA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV0gYXMgUmVsYXRpb25Db25maWcgPz8gbnVsbFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnM/Lm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgaWYob3B0aW9ucz8ubW9kZWxDbGFzcyB8fCAocmVsYXRpb25PcHRpb24/Lm1vZGVsQ2xhc3MgJiYgIWZyb21GaXJlSnNvbikpIHtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkYXRhW2pzb25Qcm9wZXJ0eUtleV0pKXtcclxuICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBuZXcgQXJyYXkoKVxyXG4gICAgICAgICAgICAgIGRhdGFbanNvblByb3BlcnR5S2V5XS5mb3JFYWNoKCh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCh0aGlzLmNvbnZlcnRUb0luc3RhbmNlKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzID8/IG9wdGlvbnMubW9kZWxDbGFzcywgdmFsdWUsIGZyb21GaXJlSnNvbikpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRUb0luc3RhbmNlKHJlbGF0aW9uT3B0aW9uPy5tb2RlbENsYXNzID8/IG9wdGlvbnMubW9kZWxDbGFzcywgZGF0YVtqc29uUHJvcGVydHlLZXldLCBmcm9tRmlyZUpzb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnM/LnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgIGlmKGZyb21GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRGcm9tVGltZXN0YW1wKGRhdGFbanNvblByb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBuZXcgRGF0ZShkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gZGF0YVtqc29uUHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5pZCA9IGRhdGEuaWRcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9JbnN0YW5jZTxUIGV4dGVuZHMgQ29uc3RydWN0b3JGdW5jdGlvbjx1bmtub3duPj4obW9kZWxDbGFzczogVCwgZGF0YTogYW55LCBmcm9tRmlyZUpzb246IGJvb2xlYW4pOiBUIHtcclxuICAgICAgaWYobW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgcmV0dXJuICgobmV3IG1vZGVsQ2xhc3MoKSkgYXMgTW9kZWwpLmlubmVyRnJvbUpzb24oZGF0YSwgZnJvbUZpcmVKc29uKSBhcyB1bmtub3duIGFzIFRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gcGxhaW5Ub0luc3RhbmNlKG1vZGVsQ2xhc3MsIGRhdGEsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSkgYXMgVFxyXG4gICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19