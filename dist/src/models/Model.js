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
    autoId() {
        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let autoId = '';
        for (let i = 0; i < 20; i++) {
            autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
        return autoId;
    }
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
        this.reset();
        const json = this.innerToJson(toFireJson);
        this.init();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU90QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBTEgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFDbEMsS0FBSyxLQUFXLE9BQU0sQ0FBQyxDQUFDO0lBTXhCLE1BQU07UUFDSixNQUFNLEtBQUssR0FBRyxnRUFBZ0UsQ0FBQTtRQUU5RSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUE7UUFFZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQ3pDLENBQUE7U0FDRjtRQUNELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVPLFlBQVk7O1FBRWxCLE1BQU0sU0FBUyxHQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUF1QixDQUFBO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksRUFBRSxDQUFBO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFdEMs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b20gXCJ2YWxpZGF0b3Jqc1wiXHJcbmltcG9ydCBSZXBvc2l0b3J5IGZyb20gXCJ+L3JlcG9zaXRvcmllcy9SZXBvc2l0b3J5XCI7XHJcbmltcG9ydCB7IHVzZUVuZ2luZSB9IGZyb20gXCIuLi9lbmdpbmVcIjtcclxuaW1wb3J0IHsgZ2V0UmVwb3NpdG9yeUZvciB9IGZyb20gXCIuLi9yZXBvc2l0b3JpZXNcIjtcclxuaW1wb3J0IHsgSGFzTWFueVJlbGF0aW9uQ29uZmlnLCBIYXNPbmVSZWxhdGlvbkNvbmZpZywgUmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvRmllbGRDb25maWdcIjtcclxuaW1wb3J0IHsgVmFsaWRhdGVDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9WYWxpZGF0ZUNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tIFwiLi9CbHVlcHJpbnRcIjtcclxuaW1wb3J0IHsgRmllbGQgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgaW5zdGFuY2VUb1BsYWluLCBwbGFpblRvSW5zdGFuY2UgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoRmllbGRzIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoRmllbGRzXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aENvbGxlY3Rpb24gfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhDb2xsZWN0aW9uXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aFJlbGF0aW9ucyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJlbGF0aW9uc1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSdWxlcyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJ1bGVzXCI7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgUGFyYW1zT2JqZWN0ID0geyBba2V5OiBzdHJpbmddOiBhbnkgfTtcclxuXHJcbi8vVE9ETyBldmVudHMgYmVmb3JlIGRlbGV0ZSwgYWZ0ZXIgZGVsZXQsIGJlZm9yZSBsb2FkLCBiZWZvcmUtYWZ0ZXIgc2F2ZSwgdXBkYXRlIGV0Yy4uLlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIGlkPzogc3RyaW5nID0gbnVsbFxyXG5cclxuICAgIHJlbGF0aW9uc0xvYWRlZDogc3RyaW5nW10gPSBbXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKC4uLl86IGFueVtdKSB7fVxyXG5cclxuICAgIGluaXQoLi4uXzogYW55W10pOiB2b2lkIHsgcmV0dXJuIH1cclxuICAgIHJlc2V0KCk6IHZvaWQgeyByZXR1cm4gfVxyXG5cclxuICAgIHByaXZhdGUgZXJyb3JzOiBFcnJvcnMgPSBudWxsXHJcblxyXG4gICAgYWJzdHJhY3QgZ2V0TW9kZWxOYW1lKCk6IHN0cmluZ1xyXG5cclxuICAgIGF1dG9JZCgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCBDSEFSUyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSdcclxuXHJcbiAgICAgIGxldCBhdXRvSWQgPSAnJ1xyXG5cclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyMDsgaSsrKSB7XHJcbiAgICAgICAgYXV0b0lkICs9IENIQVJTLmNoYXJBdChcclxuICAgICAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIENIQVJTLmxlbmd0aClcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGF1dG9JZFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29sbGVjdFJ1bGVzPFQ+KCk6IFZhbGlkYXRvci5SdWxlcyB7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBwcm90b3R5cGUgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJ1bGVzPFQ+KVxyXG4gICAgICBjb25zdCBydWxlRGF0YSA9IHByb3RvdHlwZS5ydWxlcyA/PyB7fVxyXG4gICAgICBjb25zdCBydWxlS2V5cyA9IE9iamVjdC5rZXlzKHJ1bGVEYXRhKVxyXG5cclxuICAgICAgbGV0IHJ1bGVzOiBWYWxpZGF0b3IuUnVsZXMgPSB7fVxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcyl7XHJcbiAgICAgICAgLy9UT0RPIHJlY3Vyc2l2ZSB2YWxpZGF0aW9uIG9uIHJlbGF0ZWQgbW9kZWxzXHJcbiAgICAgICAgaWYocnVsZUtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IHJ1bGUgPSBydWxlRGF0YVtwcm9wZXJ0eUtleV0gYXMgVmFsaWRhdGVDb25maWc8VD5cclxuXHJcbiAgICAgICAgICBpZihydWxlIGluc3RhbmNlb2YgRnVuY3Rpb24pe1xyXG4gICAgICAgICAgICBydWxlcyA9IE9iamVjdC5hc3NpZ24ocnVsZXMsIHJ1bGUodGhpcyBhcyB1bmtub3duIGFzIFQpKVxyXG4gICAgICAgICAgfSBlbHNlIGlmKHJ1bGUgaW5zdGFuY2VvZiBPYmplY3Qpe1xyXG4gICAgICAgICAgICBydWxlcyA9IE9iamVjdC5hc3NpZ24ocnVsZXMsIHJ1bGUpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBydWxlc1twcm9wZXJ0eUtleV0gPSBydWxlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBydWxlc1xyXG4gICAgfVxyXG5cclxuICAgIHZhbGlkYXRlICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCBydWxlcyA9IHRoaXMuY29sbGVjdFJ1bGVzKClcclxuICAgICAgICBsZXQgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcih0aGlzIGFzIGFueSwgcnVsZXMpXHJcblxyXG4gICAgICAgIGlmICh2YWxpZGF0b3IuaGFzQXN5bmMpIHtcclxuICAgICAgICAgIHZhbGlkYXRvci5jaGVja0FzeW5jKHJlc29sdmUsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCh0aGlzLmVycm9ycylcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICh2YWxpZGF0b3IuY2hlY2soKSkge1xyXG4gICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvcnMpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGhhc0Vycm9ycyAoKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVycm9ycyA/PyB7fSkubGVuZ3RoID4gMFxyXG4gICAgfVxyXG5cclxuICAgIGdldEFsbEVycm9ycyAoKTogVmFsaWRhdG9yLlZhbGlkYXRpb25FcnJvcnMge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmFsbCgpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3JzIChuYW1lOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmdldChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9yIChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZmlyc3QobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkTWFueShyZWxhdGlvbk5hbWVzOiBzdHJpbmdbXSwgZm9yY2VSZWxvYWQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTx2b2lkPntcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICBmb3IoY29uc3QgcmVsYXRpb24gaW4gcmVsYXRpb25OYW1lcyl7XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvYWQocmVsYXRpb25OYW1lc1tyZWxhdGlvbl0sIGZvcmNlUmVsb2FkKSlcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkKHJlbGF0aW9uTmFtZTogc3RyaW5nLCBmb3JjZVJlbG9hZDogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgbGV0IGZvdW5kID0gZmFsc2VcclxuICAgICAgY29uc3QgYW55VGhpcyA9IHRoaXMgYXMgYW55XHJcblxyXG4gICAgICBjb25zdCByZWxhdGlvbnMgPSByZWxhdGlvbk5hbWUuc3BsaXQoJy4nKVxyXG4gICAgICByZWxhdGlvbk5hbWUgPSByZWxhdGlvbnMucmV2ZXJzZSgpLnBvcCgpXHJcblxyXG4gICAgICBsZXQgbG9hZGVkUHJvcGVydHkgPSByZWxhdGlvbk5hbWVcclxuXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUmVsYXRpb25zKVxyXG4gICAgICBjb25zdCByZWxhdGlvbkRhdGEgPSBwcm90b3R5cGUucmVsYXRpb25zID8/IHt9XHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uS2V5cyA9IE9iamVjdC5rZXlzKHJlbGF0aW9uRGF0YSlcclxuICAgICAgXHJcbiAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc0xvYWRlZC5pbmNsdWRlcyhyZWxhdGlvbk5hbWUpIHx8IGZvcmNlUmVsb2FkKXtcclxuICAgICAgICBjb25zdCByb3V0ZVBhcmFtcyA9IHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKClcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYocmVsYXRpb25LZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSAmJiBwcm9wZXJ0eUtleSA9PT0gcmVsYXRpb25OYW1lKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgLy9nZXQgdGhlIHJlcG9zaXRvcnkgZm9yIHRoZSBjdXJyZW50IG1vZGVsQ2xhc3NcclxuICAgICAgICAgICAgY29uc3QgcmVwb3NpdG9yeSA9IGdldFJlcG9zaXRvcnlGb3Iob3B0aW9ucy5tb2RlbENsYXNzIGFzIENvbnN0cnVjdG9yRnVuY3Rpb248TW9kZWw+KSBhcyBSZXBvc2l0b3J5PE1vZGVsPlxyXG4gICAgICAgICAgICBpZigob3B0aW9ucy5uYW1lICYmIG9wdGlvbnMubmFtZSA9PT0gcmVsYXRpb25OYW1lKSB8fCBwcm9wZXJ0eUtleSA9PT0gcmVsYXRpb25OYW1lKSB7XHJcbiAgICAgICAgICAgICAgbG9hZGVkUHJvcGVydHkgPSBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc01hbnknKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc01hbnlPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNNYW55UmVsYXRpb25Db25maWdcclxuICAgICAgICAgICAgICAgIGlmKCFoYXNNYW55T3B0aW9ucy5tYXBJZHMgJiYgIWhhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHMpe1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEBIYXNNYW55IHJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gaXMgbWlzc2luZyAnbWFwSWRzJyBhbmQgJ3JlbGF0ZWRJZHMnLiBPbmUgb2YgdGhlbSBtdXN0IGJlIGRlZmluZWQuYClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRNYW55KChoYXNNYW55T3B0aW9ucy5tYXBJZHMgPyBoYXNNYW55T3B0aW9ucy5tYXBJZHModGhpcykgOiBhbnlUaGlzW2hhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHNdKSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1twcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baW5kZXhdW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IHdpdGggJyR7b3B0aW9ucy50eXBlfScgb24gJHtwcm9wZXJ0eUtleX0gcHJvcGVydHkgaXMgbm90IGFuIGFycmF5YClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2UgaWYob3B0aW9ucy50eXBlID09PSAnaGFzQ29sbGVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETyBhbiBvcHRpb24gd2hlcmUgdGhlIHJlbGF0ZWQgZGF0YSBjYW4gYmUgJ3BhZ2luYXRlZCdcclxuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcHJvcGVydHkgaXMgYXJyYXksIHRoZW4gbG9hZCB0aGUgc3ViY29sbGVjdGlvbiBpbnRvIGl0XHJcbiAgICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGFueVRoaXNbcHJvcGVydHlLZXldKSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkQ29sbGVjdGlvbihyb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNPbmVPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNPbmVSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgLy9sb2FkIGRhdGEgaW50byB0aGUgJ3Byb3BlcnR5S2V5JyBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwsIHdoaWxlIGxvYWQgdGhlIG1vZGVsIHdpdGggdGhlIGlkIGZyb20gdGhlICdyZWxhdGVkSWQnIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZCgodGhpcyBhcyBhbnkpW2hhc09uZU9wdGlvbnMucmVsYXRlZElkXSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICBpZihoYXNPbmVPcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2hhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAgIGlmKCFmb3VuZCl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBub3QgZm91bmQgb24gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5yZWxhdGlvbnNMb2FkZWQucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGggPiAwKXtcclxuICAgICAgICAvL3JldmVyc2UgYmFjayB0aGUgYXJyYXkgXHJcbiAgICAgICAgcmVsYXRpb25zLnJldmVyc2UoKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0pKXtcclxuICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSl7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV1baW5kZXhdLmxvYWQocmVsYXRpb25zLmpvaW4oJy4nKSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXdhaXQgYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEJsdWVwcmludDxUIGV4dGVuZHMgTW9kZWw+KHRoaXM6IFQpOiBCbHVlcHJpbnQ8VD4ge1xyXG4gICAgICByZXR1cm4gbmV3IEJsdWVwcmludCh0aGlzLCB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpKVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvdXRlKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHRpb25zLnJvdXRlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCk6IFBhcmFtc09iamVjdCB7XHJcbiAgICAgIGNvbnN0IHNlYXJjaFJlZ2V4ID0gL3soW159XSspfS9nXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzICYgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3QgZmllbGREYXRhID0gcHJvdG90eXBlLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcbiAgICAgIGlmKHByb3RvdHlwZS5jb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYXZlIGEgcm91dGUgcGFyYW1ldGVyIG9uIHRoZSBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uYClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVE9ETyBoYXZlIGEgbG9vayBhdCB0aGUgd29ya2luZ3Mgb2YgdGhpcyBnZXRST3V0ZVBhcmFtZXRlciBiZWNhdXNlIHRoZXJlIGFyZSBzb21lIHN0cmFuZ2UgdGhpbmdzIGludm9sdmVkXHJcbiAgICAgICAgLy9nZXQgZXZlcnkgcGFyYW0gd2hpY2ggaGFzIGJlZW4gYW5ub3RhdGVkIGluIHRoZSBtb2RlbCB3aXRoICdyb3V0ZVBhcmFtOiB0cnVlJ1xyXG4gICAgICAgIGNvbnN0IHBhcmFtc09iamVjdDogUGFyYW1zT2JqZWN0ID0ge31cclxuICAgICAgICBcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldXHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLnJvdXRlUGFyYW0pe1xyXG4gICAgICAgICAgICAgIHBhcmFtc09iamVjdFtvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc3QgcGF0aFRlbXBsYXRlID0gb3B0aW9ucy5yb3V0ZVxyXG4gICAgICAgIC8vIGNvbnN0IHBhcmFtcyA9IHNlYXJjaFJlZ2V4LmV4ZWMocGF0aFRlbXBsYXRlKVxyXG5cclxuICAgICAgICAvLyAvLyBjb25zdCByZXR1cm5QYXJhbXM6IHN0cmluZ1tdID0gW11cclxuICAgICAgICAvLyAvL2lmIGhhcyByb3V0ZSBwYXJhbVxyXG4gICAgICAgIC8vIGlmKHBhcmFtcyl7XHJcbiAgICAgICAgLy8gICAvL2NoZWNrIHRvIHNlZSBpZiByb3V0ZSBwYXJhbSBpcyBhIHByb3BlcnR5IG9mIHRoZSBtb2RlbCBhbmQgaXQgaXMgc2V0XHJcbiAgICAgICAgLy8gICBwYXJhbXMuZm9yRWFjaCgocGFyYW0pID0+IHtcclxuICAgICAgICAvLyAgICAgY29uc3QgcGFyYW1TdHJpcCA9IHBhcmFtLnJlcGxhY2UoL1t7fV0vZywgJycpXHJcbiAgICAgICAgLy8gICAgIGlmKCFwYXJhbXNPYmplY3RbcGFyYW1TdHJpcF0pe1xyXG4gICAgICAgIC8vICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVxdWlyZWQgcm91dGUgcGFyYW0gJHtwYXJhbVN0cmlwfSBpcyBub3Qgc2V0IG9uIHRoZSBjbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIC8vIGlmKCFyZXR1cm5QYXJhbXMuaW5jbHVkZXMocGFyYW1TdHJpcCkpIHJldHVyblBhcmFtcy5wdXNoKHBhcmFtU3RyaXApXHJcbiAgICAgICAgLy8gICB9KVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcmFtc09iamVjdFxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBub3QgYW5ub3RhdGVkIHdpdGggQENvbGxlY3Rpb25gKVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvSnNvbih0b0ZpcmVKc29uOiBib29sZWFuID0gZmFsc2UpOiBhbnkge1xyXG4gICAgICB0aGlzLnJlc2V0KClcclxuXHJcbiAgICAgIGNvbnN0IGpzb24gPSB0aGlzLmlubmVyVG9Kc29uKHRvRmlyZUpzb24pXHJcblxyXG4gICAgICB0aGlzLmluaXQoKVxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5uZXJUb0pzb24odG9GaXJlSnNvbjogYm9vbGVhbik6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHt9XHJcblxyXG4gICAgICBjb25zdCByZWxhdGlvbkRhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucykucmVsYXRpb25zID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzKS5maWVsZHMgPz8ge31cclxuICAgICAgY29uc3QgZmllbGRLZXlzID0gT2JqZWN0LmtleXMoZmllbGREYXRhKVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAvLyBpZiBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgIGlmKGZpZWxkS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkgfHwgIXRvRmlyZUpzb24pe1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV0gYXMgRmllbGRDb25maWcgPz8gbnVsbFxyXG4gICAgICAgICAgY29uc3QgcmVsYXRpb25PcHRpb24gPSByZWxhdGlvbkRhdGFbcHJvcGVydHlLZXldIGFzIFJlbGF0aW9uQ29uZmlnID8/IG51bGxcclxuICAgICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnM/Lm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzIHx8IChyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyAmJiAhdG9GaXJlSnNvbikpIHtcclxuICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHRoaXNbcHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBbXVxyXG4gICAgICAgICAgICAgICAgOyh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIEFycmF5PGFueT4pLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldLnB1c2godGhpcy5jb252ZXJ0RnJvbUluc3RhbmNlKHZhbHVlLCB0b0ZpcmVKc29uKSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydEZyb21JbnN0YW5jZSh0aGlzW3Byb3BlcnR5S2V5XSwgdG9GaXJlSnNvbilcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnM/LnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgaWYodGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBEYXRlKXtcclxuICAgICAgICAgICAgICAgICAgaWYodG9GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydFRvVGltZXN0YW1wKCh0aGlzW3Byb3BlcnR5S2V5XSBhcyBhbnkpKVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIERhdGUpLnRvU3RyaW5nKClcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBqc29uLmlkID0gdGhpcy5pZFxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydEZyb21JbnN0YW5jZShkYXRhOiBhbnksIHRvRmlyZUpzb246IGJvb2xlYW4pOiBhbnkge1xyXG4gICAgICBpZihkYXRhIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgIHJldHVybiBkYXRhLmlubmVyVG9Kc29uKHRvRmlyZUpzb24pXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlVG9QbGFpbihkYXRhLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmcm9tSnNvbihkYXRhOiBhbnksIGZyb21GaXJlSnNvbjogYm9vbGVhbiA9IGZhbHNlKTogdGhpcyB7XHJcbiAgICAgIHRoaXMuaW5uZXJGcm9tSnNvbihkYXRhLCBmcm9tRmlyZUpzb24pXHJcblxyXG4gICAgICB0aGlzLmluaXQoKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5uZXJGcm9tSnNvbihkYXRhOiBhbnksIGZyb21GaXJlSnNvbjogYm9vbGVhbik6IHRoaXMge1xyXG4gICAgICBsZXQgYW55VGhpcyA9IHRoaXMgYXMgYW55XHJcblxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aEZpZWxkcykuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUmVsYXRpb25zKS5yZWxhdGlvbnMgPz8ge31cclxuXHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiBkYXRhKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV0gYXMgRmllbGRDb25maWcgPz8gbnVsbFxyXG4gICAgICAgIGNvbnN0IHJlbGF0aW9uT3B0aW9uID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XSBhcyBSZWxhdGlvbkNvbmZpZyA/PyBudWxsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucz8ubmFtZSA/PyBwcm9wZXJ0eUtleVxyXG4gICAgICAgIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzIHx8IChyZWxhdGlvbk9wdGlvbj8ubW9kZWxDbGFzcyAmJiAhZnJvbUZpcmVKc29uKSkge1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGRhdGFbanNvblByb3BlcnR5S2V5XSkpe1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IG5ldyBBcnJheSgpXHJcbiAgICAgICAgICAgICAgZGF0YVtqc29uUHJvcGVydHlLZXldLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKHRoaXMuY29udmVydFRvSW5zdGFuY2UocmVsYXRpb25PcHRpb24/Lm1vZGVsQ2xhc3MgPz8gb3B0aW9ucy5tb2RlbENsYXNzLCB2YWx1ZSwgZnJvbUZpcmVKc29uKSlcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydFRvSW5zdGFuY2UocmVsYXRpb25PcHRpb24/Lm1vZGVsQ2xhc3MgPz8gb3B0aW9ucy5tb2RlbENsYXNzLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0sIGZyb21GaXJlSnNvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYob3B0aW9ucz8udGltZXN0YW1wKSB7XHJcbiAgICAgICAgICAgICAgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGlmKGZyb21GaXJlSnNvbil7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydEZyb21UaW1lc3RhbXAoZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBuZXcgRGF0ZShkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGRhdGFbanNvblByb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhLmlkXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydFRvSW5zdGFuY2U8VCBleHRlbmRzIENvbnN0cnVjdG9yRnVuY3Rpb248dW5rbm93bj4+KG1vZGVsQ2xhc3M6IFQsIGRhdGE6IGFueSwgZnJvbUZpcmVKc29uOiBib29sZWFuKTogVCB7XHJcbiAgICAgIGlmKG1vZGVsQ2xhc3MucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgIHJldHVybiAoKG5ldyBtb2RlbENsYXNzKCkpIGFzIE1vZGVsKS5pbm5lckZyb21Kc29uKGRhdGEsIGZyb21GaXJlSnNvbikgYXMgdW5rbm93biBhcyBUXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHBsYWluVG9JbnN0YW5jZShtb2RlbENsYXNzLCBkYXRhLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pIGFzIFRcclxuICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdfQ==