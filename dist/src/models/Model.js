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
                    reject();
                });
            }
            else {
                if (validator.check()) {
                    resolve();
                }
                else {
                    this.errors = validator.errors;
                    reject();
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
    async loadMany(relationNames) {
        const promises = [];
        for (const relation in relationNames) {
            promises.push(this.load(relationNames[relation]));
        }
        await Promise.all(promises);
    }
    async load(relationName) {
        var _a;
        let found = false;
        const anyThis = this;
        const relations = relationName.split('.');
        relationName = relations.reverse().pop();
        let loadedProperty = relationName;
        const prototype = Object.getPrototypeOf(this);
        const relationData = (_a = prototype.relations) !== null && _a !== void 0 ? _a : {};
        const relationKeys = Object.keys(relationData);
        if (!this.relationsLoaded.includes(relationName)) {
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
    toJson() {
        var _a;
        const json = {};
        const fieldData = Object.getPrototypeOf(this).fields;
        const fieldKeys = Object.keys(fieldData);
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (fieldKeys.includes(propertyKey)) {
                const options = fieldData[propertyKey];
                const jsonPropertyKey = (_a = options.name) !== null && _a !== void 0 ? _a : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if (this[propertyKey] instanceof Model) {
                        // if the property is a model, then we must convert into json
                        json[jsonPropertyKey] = this[propertyKey].toJson();
                    }
                    else {
                        //if property is an array or object then iterate over its properties, and convert into json recursively
                        if (Array.isArray(this[propertyKey])) {
                            json[jsonPropertyKey] = this.convertToJson(this[propertyKey]);
                        }
                        else if (this[propertyKey] instanceof Object) {
                            json[jsonPropertyKey] = (0, class_transformer_1.instanceToPlain)(this[propertyKey], { enableCircularCheck: true });
                            // json[jsonPropertyKey] = this[propertyKey]
                        }
                        else {
                            //otherwise property is just a property, so we convert it based on its type or decorator
                            if (options.timestamp) {
                                json[jsonPropertyKey] = (0, engine_1.useEngine)().convertToTimestamp(this[propertyKey]);
                            }
                            else {
                                json[jsonPropertyKey] = this[propertyKey];
                            }
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
    convertToJson(root) {
        const json = Array.isArray(root) ? [] : {};
        Object.keys(root).forEach((key) => {
            if (root[key] !== undefined)
                if (root[key] instanceof Model) {
                    json[key] = root[key].toJson();
                }
                else {
                    if (Array.isArray(root[key]) || root[key] instanceof Object) {
                        json[key] = this.convertToJson(root[key]);
                    }
                    else {
                        json[key] = root[key];
                    }
                }
        });
        return json;
    }
    fromJson(data) {
        var _a;
        let anyThis = this;
        const fieldData = Object.getPrototypeOf(this).fields;
        const fieldKeys = Object.keys(fieldData);
        for (const propertyKey in data) {
            //if property exists in data and property has field metadata, then we must convert from json
            if (fieldKeys.includes(propertyKey)) {
                const options = fieldData[propertyKey];
                const jsonPropertyKey = (_a = options.name) !== null && _a !== void 0 ? _a : propertyKey;
                if (data[jsonPropertyKey]) {
                    if (options === null || options === void 0 ? void 0 : options.modelClass) {
                        if (Array.isArray(data[jsonPropertyKey])) {
                            anyThis[jsonPropertyKey] = new Array();
                            data[jsonPropertyKey].forEach((value) => {
                                if (options.modelClass.prototype instanceof Model) {
                                    anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(value));
                                }
                                else {
                                    anyThis[jsonPropertyKey] = (0, class_transformer_1.plainToInstance)(options.modelClass, value, { enableCircularCheck: true });
                                }
                            });
                        }
                        else {
                            if (options.modelClass.prototype instanceof Model) {
                                anyThis[jsonPropertyKey].push((new options.modelClass()).fromJson(data[jsonPropertyKey]));
                            }
                            else {
                                anyThis[jsonPropertyKey] = (0, class_transformer_1.plainToInstance)(options.modelClass, data[jsonPropertyKey], { enableCircularCheck: true });
                            }
                        }
                    }
                    else {
                        if (options.timestamp) {
                            anyThis[propertyKey] = (0, engine_1.useEngine)().convertFromTimestamp(data[jsonPropertyKey]);
                        }
                        else {
                            //if property is an array or object then iterate over its properties, and convert from json recursively
                            if (Array.isArray(data[jsonPropertyKey])) {
                                anyThis[propertyKey] = this.convertFromJson(data[jsonPropertyKey]);
                            }
                            else if (data[jsonPropertyKey] instanceof Object) {
                                //if property is object then we assign the data to the default property value, user might need it
                                anyThis[propertyKey] = this.convertFromJson(Object.assign(anyThis[propertyKey], data[jsonPropertyKey]));
                            }
                            else {
                                //otherwise property is just a property, so we convert it based on its type or decorator
                                anyThis[propertyKey] = data[jsonPropertyKey];
                            }
                        }
                    }
                }
            }
        }
        this.id = data.id;
        return this;
    }
    convertFromJson(root) {
        const json = Array.isArray(root) ? [] : {};
        Object.keys(root).forEach((key) => {
            if (Array.isArray(root[key]) || root[key] instanceof Object)
                json[key] = this.convertFromJson(root[key]);
            else
                json[key] = root[key];
        });
        return json;
    }
}
__decorate([
    (0, __1.Field)(),
    __metadata("design:type", String)
], Model.prototype, "id", void 0);
exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU10QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBSkgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFNMUIsWUFBWTs7UUFFbEIsTUFBTSxTQUFTLEdBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQXVCLENBQUE7UUFDcEUsTUFBTSxRQUFRLEdBQUcsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxFQUFFLENBQUE7UUFDdEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUV0QyxJQUFJLEtBQUssR0FBb0IsRUFBRSxDQUFBO1FBQy9CLEtBQUksTUFBTSxXQUFXLElBQUksSUFBSSxFQUFDO1lBQzVCLDZDQUE2QztZQUM3QyxJQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQXNCLENBQUE7Z0JBRXZELElBQUcsSUFBSSxZQUFZLFFBQVEsRUFBQztvQkFDMUIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFvQixDQUFDLENBQUMsQ0FBQTtpQkFDekQ7cUJBQU0sSUFBRyxJQUFJLFlBQVksTUFBTSxFQUFDO29CQUMv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YixDQUFDO0lBRU8sZUFBZSxDQUFDLElBQXVCO1FBQzdDLE1BQU0sSUFBSSxHQUFRLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO1FBRS9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDaEMsSUFBRyxLQUFLLENBQUMsT0FBTyxDQUFFLElBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFLLElBQVksQ0FBQyxHQUFHLENBQUMsWUFBWSxNQUFNO2dCQUN6RSxJQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBRSxJQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTs7Z0JBRTVELElBQVksQ0FBQyxHQUFHLENBQUMsR0FBSSxJQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDM0MsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDSjtBQWpXRztJQURDLElBQUEsU0FBSyxHQUFFOztpQ0FDVTtBQUZ0Qix3QkFtV0MiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IFZhbGlkYXRvciwgeyBFcnJvcnMgfSBmcm9tIFwidmFsaWRhdG9yanNcIlxyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwifi9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeVwiO1xyXG5pbXBvcnQgeyB1c2VFbmdpbmUgfSBmcm9tIFwiLi4vZW5naW5lXCI7XHJcbmltcG9ydCB7IGdldFJlcG9zaXRvcnlGb3IgfSBmcm9tIFwiLi4vcmVwb3NpdG9yaWVzXCI7XHJcbmltcG9ydCB7IEhhc01hbnlSZWxhdGlvbkNvbmZpZywgSGFzT25lUmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvRmllbGRDb25maWdcIjtcclxuaW1wb3J0IHsgVmFsaWRhdGVDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9WYWxpZGF0ZUNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tIFwiLi9CbHVlcHJpbnRcIjtcclxuaW1wb3J0IHsgRmllbGQgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgaW5zdGFuY2VUb1BsYWluLCBwbGFpblRvSW5zdGFuY2UgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoRmllbGRzIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoRmllbGRzXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aENvbGxlY3Rpb24gfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhDb2xsZWN0aW9uXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aFJlbGF0aW9ucyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJlbGF0aW9uc1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSdWxlcyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJ1bGVzXCI7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgUGFyYW1zT2JqZWN0ID0geyBba2V5OiBzdHJpbmddOiBhbnkgfTtcclxuXHJcbi8vVE9ETyBldmVudHMgYmVmb3JlIGRlbGV0ZSwgYWZ0ZXIgZGVsZXQsIGJlZm9yZSBsb2FkLCBiZWZvcmUtYWZ0ZXIgc2F2ZSwgdXBkYXRlIGV0Yy4uLlxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIGlkPzogc3RyaW5nID0gbnVsbFxyXG5cclxuICAgIHJlbGF0aW9uc0xvYWRlZDogc3RyaW5nW10gPSBbXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKC4uLl86IGFueVtdKSB7fVxyXG5cclxuICAgIGluaXQoLi4uXzogYW55W10pOiB2b2lkIHsgcmV0dXJuIH1cclxuXHJcbiAgICBwcml2YXRlIGVycm9yczogRXJyb3JzID0gbnVsbFxyXG5cclxuICAgIGFic3RyYWN0IGdldE1vZGVsTmFtZSgpOiBzdHJpbmdcclxuXHJcbiAgICBwcml2YXRlIGNvbGxlY3RSdWxlczxUPigpOiBWYWxpZGF0b3IuUnVsZXMge1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSdWxlczxUPilcclxuICAgICAgY29uc3QgcnVsZURhdGEgPSBwcm90b3R5cGUucnVsZXMgPz8ge31cclxuICAgICAgY29uc3QgcnVsZUtleXMgPSBPYmplY3Qua2V5cyhydWxlRGF0YSlcclxuXHJcbiAgICAgIGxldCBydWxlczogVmFsaWRhdG9yLlJ1bGVzID0ge31cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpe1xyXG4gICAgICAgIC8vVE9ETyByZWN1cnNpdmUgdmFsaWRhdGlvbiBvbiByZWxhdGVkIG1vZGVsc1xyXG4gICAgICAgIGlmKHJ1bGVLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBydWxlID0gcnVsZURhdGFbcHJvcGVydHlLZXldIGFzIFZhbGlkYXRlQ29uZmlnPFQ+XHJcblxyXG4gICAgICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKHRoaXMgYXMgdW5rbm93biBhcyBUKSlcclxuICAgICAgICAgIH0gZWxzZSBpZihydWxlIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVsZXNbcHJvcGVydHlLZXldID0gcnVsZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcnVsZXNcclxuICAgIH1cclxuXHJcbiAgICB2YWxpZGF0ZSAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcnVsZXMgPSB0aGlzLmNvbGxlY3RSdWxlcygpXHJcbiAgICAgICAgbGV0IHZhbGlkYXRvciA9IG5ldyBWYWxpZGF0b3IodGhpcyBhcyBhbnksIHJ1bGVzKVxyXG5cclxuICAgICAgICBpZiAodmFsaWRhdG9yLmhhc0FzeW5jKSB7XHJcbiAgICAgICAgICB2YWxpZGF0b3IuY2hlY2tBc3luYyhyZXNvbHZlLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QoKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHZhbGlkYXRvci5jaGVjaygpKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCgpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGhhc0Vycm9ycyAoKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVycm9ycyA/PyB7fSkubGVuZ3RoID4gMFxyXG4gICAgfVxyXG5cclxuICAgIGdldEFsbEVycm9ycyAoKTogVmFsaWRhdG9yLlZhbGlkYXRpb25FcnJvcnMge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmFsbCgpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3JzIChuYW1lOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmdldChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9yIChuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZmlyc3QobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkTWFueShyZWxhdGlvbk5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD57XHJcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgZm9yKGNvbnN0IHJlbGF0aW9uIGluIHJlbGF0aW9uTmFtZXMpe1xyXG4gICAgICAgIHByb21pc2VzLnB1c2godGhpcy5sb2FkKHJlbGF0aW9uTmFtZXNbcmVsYXRpb25dKSlcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkKHJlbGF0aW9uTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXHJcbiAgICAgIGNvbnN0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgcmVsYXRpb25zID0gcmVsYXRpb25OYW1lLnNwbGl0KCcuJylcclxuICAgICAgcmVsYXRpb25OYW1lID0gcmVsYXRpb25zLnJldmVyc2UoKS5wb3AoKVxyXG5cclxuICAgICAgbGV0IGxvYWRlZFByb3BlcnR5ID0gcmVsYXRpb25OYW1lXHJcblxyXG4gICAgICBjb25zdCBwcm90b3R5cGUgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aFJlbGF0aW9ucylcclxuICAgICAgY29uc3QgcmVsYXRpb25EYXRhID0gcHJvdG90eXBlLnJlbGF0aW9ucyA/PyB7fVxyXG4gICAgICBjb25zdCByZWxhdGlvbktleXMgPSBPYmplY3Qua2V5cyhyZWxhdGlvbkRhdGEpXHJcbiAgICAgIFxyXG4gICAgICBpZighdGhpcy5yZWxhdGlvbnNMb2FkZWQuaW5jbHVkZXMocmVsYXRpb25OYW1lKSl7XHJcbiAgICAgICAgY29uc3Qgcm91dGVQYXJhbXMgPSB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpXHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKHJlbGF0aW9uS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gcmVsYXRpb25EYXRhW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW3Byb3BlcnR5S2V5XSkgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IHVuZGVmaW5lZCB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZE1hbnkoKGhhc01hbnlPcHRpb25zLm1hcElkcyA/IGhhc01hbnlPcHRpb25zLm1hcElkcyh0aGlzKSA6IGFueVRoaXNbaGFzTWFueU9wdGlvbnMucmVsYXRlZElkc10pLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNDb2xsZWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy9UT0RPIGFuIG9wdGlvbiB3aGVyZSB0aGUgcmVsYXRlZCBkYXRhIGNhbiBiZSAncGFnaW5hdGVkJ1xyXG4gICAgICAgICAgICAgICAgLy9jaGVjayBpZiBwcm9wZXJ0eSBpcyBhcnJheSwgdGhlbiBsb2FkIHRoZSBzdWJjb2xsZWN0aW9uIGludG8gaXRcclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7cHJvcGVydHlLZXl9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc09uZU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc09uZVJlbGF0aW9uQ29uZmlnXHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbaGFzT25lT3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKGhhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baGFzT25lT3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIC8vcmV2ZXJzZSBiYWNrIHRoZSBhcnJheSBcclxuICAgICAgICByZWxhdGlvbnMucmV2ZXJzZSgpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSkpe1xyXG4gICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbbG9hZGVkUHJvcGVydHldKXtcclxuICAgICAgICAgICAgcHJvbWlzZXMucHVzaChhbnlUaGlzW2xvYWRlZFByb3BlcnR5XVtpbmRleF0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhd2FpdCBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qmx1ZXByaW50PFQgZXh0ZW5kcyBNb2RlbD4odGhpczogVCk6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgIHJldHVybiBuZXcgQmx1ZXByaW50KHRoaXMsIHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGUoKTogc3RyaW5nIHtcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wdGlvbnMucm91dGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKTogUGFyYW1zT2JqZWN0IHtcclxuICAgICAgY29uc3Qgc2VhcmNoUmVnZXggPSAveyhbXn1dKyl9L2dcclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMgJiBDbGFzc1dpdGhDb2xsZWN0aW9uKVxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSBwcm90b3R5cGUuZmllbGRzID8/IHt9XHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuICAgICAgaWYocHJvdG90eXBlLmNvbGxlY3Rpb24pIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gcHJvdG90eXBlLmNvbGxlY3Rpb25cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9UT0RPIGhhdmUgYSBsb29rIGF0IHRoZSB3b3JraW5ncyBvZiB0aGlzIGdldFJPdXRlUGFyYW1ldGVyIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgc3RyYW5nZSB0aGluZ3MgaW52b2x2ZWRcclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMucm91dGVQYXJhbSl7XHJcbiAgICAgICAgICAgICAgcGFyYW1zT2JqZWN0W29wdGlvbnMubmFtZSA/PyBwcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zdCBwYXRoVGVtcGxhdGUgPSBvcHRpb25zLnJvdXRlXHJcbiAgICAgICAgLy8gY29uc3QgcGFyYW1zID0gc2VhcmNoUmVnZXguZXhlYyhwYXRoVGVtcGxhdGUpXHJcblxyXG4gICAgICAgIC8vIC8vIGNvbnN0IHJldHVyblBhcmFtczogc3RyaW5nW10gPSBbXVxyXG4gICAgICAgIC8vIC8vaWYgaGFzIHJvdXRlIHBhcmFtXHJcbiAgICAgICAgLy8gaWYocGFyYW1zKXtcclxuICAgICAgICAvLyAgIC8vY2hlY2sgdG8gc2VlIGlmIHJvdXRlIHBhcmFtIGlzIGEgcHJvcGVydHkgb2YgdGhlIG1vZGVsIGFuZCBpdCBpcyBzZXRcclxuICAgICAgICAvLyAgIHBhcmFtcy5mb3JFYWNoKChwYXJhbSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBjb25zdCBwYXJhbVN0cmlwID0gcGFyYW0ucmVwbGFjZSgvW3t9XS9nLCAnJylcclxuICAgICAgICAvLyAgICAgaWYoIXBhcmFtc09iamVjdFtwYXJhbVN0cmlwXSl7XHJcbiAgICAgICAgLy8gICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1aXJlZCByb3V0ZSBwYXJhbSAke3BhcmFtU3RyaXB9IGlzIG5vdCBzZXQgb24gdGhlIGNsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgLy8gaWYoIXJldHVyblBhcmFtcy5pbmNsdWRlcyhwYXJhbVN0cmlwKSkgcmV0dXJuUGFyYW1zLnB1c2gocGFyYW1TdHJpcClcclxuICAgICAgICAvLyAgIH0pXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyYW1zT2JqZWN0XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCBhbm5vdGF0ZWQgd2l0aCBAQ29sbGVjdGlvbmApXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9Kc29uKCk6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHt9XHJcblxyXG4gICAgICBjb25zdCBmaWVsZERhdGEgPSAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpIGFzIENsYXNzV2l0aEZpZWxkcykuZmllbGRzXHJcbiAgICAgIGNvbnN0IGZpZWxkS2V5cyA9IE9iamVjdC5rZXlzKGZpZWxkRGF0YSlcclxuXHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgLy8gaWYgcHJvcGVydHkgaGFzIGZpZWxkIG1ldGFkYXRhLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICBpZihmaWVsZEtleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldIGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIE1vZGVsKS50b0pzb24oKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBpbnRvIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KHRoaXNbcHJvcGVydHlLZXldKSkge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0VG9Kc29uKHRoaXNbcHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gaW5zdGFuY2VUb1BsYWluKHRoaXNbcHJvcGVydHlLZXldLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAvLyBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0VG9UaW1lc3RhbXAoKHRoaXNbcHJvcGVydHlLZXldIGFzIGFueSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IG51bGxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAganNvbi5pZCA9IHRoaXMuaWRcclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRUb0pzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSBBcnJheS5pc0FycmF5KHJvb3QpID8gW10gOiB7fVxyXG4gICAgICBcclxuICAgICAgT2JqZWN0LmtleXMocm9vdCkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICBpZigocm9vdCBhcyBhbnkpW2tleV0gaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICBqc29uW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV0udG9Kc29uKCkgXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KChyb290IGFzIGFueSlba2V5XSkgfHwgKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24oKHJvb3QgYXMgYW55KVtrZXldKVxyXG4gICAgICAgICAgICB9IGVsc2UgeyBcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBmcm9tSnNvbihkYXRhOiBhbnkpOiB0aGlzIHtcclxuICAgICAgbGV0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG5cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkc1xyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gZGF0YSkge1xyXG4gICAgICAgIC8vaWYgcHJvcGVydHkgZXhpc3RzIGluIGRhdGEgYW5kIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgZnJvbSBqc29uXHJcbiAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZmllbGREYXRhW3Byb3BlcnR5S2V5XSBhcyBGaWVsZENvbmZpZ1xyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkYXRhW2pzb25Qcm9wZXJ0eUtleV0pKXtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IG5ldyBBcnJheSgpXHJcbiAgICAgICAgICAgICAgICBkYXRhW2pzb25Qcm9wZXJ0eUtleV0uZm9yRWFjaCgodmFsdWU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLm1vZGVsQ2xhc3MucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKCgobmV3IG9wdGlvbnMubW9kZWxDbGFzcygpKSBhcyBNb2RlbCkuZnJvbUpzb24odmFsdWUpKVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIHZhbHVlLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMubW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKCgobmV3IG9wdGlvbnMubW9kZWxDbGFzcygpKSBhcyBNb2RlbCkuZnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIGRhdGFbanNvblByb3BlcnR5S2V5XSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0RnJvbVRpbWVzdGFtcChkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBmcm9tIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZGF0YVtqc29uUHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIG9iamVjdCB0aGVuIHdlIGFzc2lnbiB0aGUgZGF0YSB0byB0aGUgZGVmYXVsdCBwcm9wZXJ0eSB2YWx1ZSwgdXNlciBtaWdodCBuZWVkIGl0XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oT2JqZWN0LmFzc2lnbihhbnlUaGlzW3Byb3BlcnR5S2V5XSwgZGF0YVtqc29uUHJvcGVydHlLZXldKSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vb3RoZXJ3aXNlIHByb3BlcnR5IGlzIGp1c3QgYSBwcm9wZXJ0eSwgc28gd2UgY29udmVydCBpdCBiYXNlZCBvbiBpdHMgdHlwZSBvciBkZWNvcmF0b3JcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBkYXRhW2pzb25Qcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5pZCA9IGRhdGEuaWRcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRGcm9tSnNvbihyb290OiBBcnJheTxhbnk+fE9iamVjdCk6IGFueXtcclxuICAgICAgY29uc3QganNvbjogYW55ID0gQXJyYXkuaXNBcnJheShyb290KSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoKHJvb3QgYXMgYW55KVtrZXldKSB8fCAocm9vdCBhcyBhbnkpW2tleV0gaW5zdGFuY2VvZiBPYmplY3QpXHJcbiAgICAgICAgICAoanNvbiBhcyBhbnkpW2tleV0gPSB0aGlzLmNvbnZlcnRGcm9tSnNvbigocm9vdCBhcyBhbnkpW2tleV0pXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgKGpzb24gYXMgYW55KVtrZXldID0gKHJvb3QgYXMgYW55KVtrZXldXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG59XHJcbiJdfQ==