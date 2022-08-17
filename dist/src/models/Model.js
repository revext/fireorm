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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLHNDQUFzQztBQUN0QyxrREFBbUQ7QUFLbkQsMkNBQXdDO0FBQ3hDLDBCQUEyQjtBQUMzQix5REFBcUU7QUFTckUsdUZBQXVGO0FBRXZGLE1BQThCLEtBQUs7SUFNL0IsWUFBWSxHQUFHLENBQVE7UUFKdkIsT0FBRSxHQUFZLElBQUksQ0FBQTtRQUVsQixvQkFBZSxHQUFhLEVBQUUsQ0FBQTtRQU10QixXQUFNLEdBQVcsSUFBSSxDQUFBO0lBSkgsQ0FBQztJQUUzQixJQUFJLENBQUMsR0FBRyxDQUFRLElBQVUsT0FBTSxDQUFDLENBQUM7SUFNMUIsWUFBWTs7UUFFbEIsTUFBTSxTQUFTLEdBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQXVCLENBQUE7UUFDcEUsTUFBTSxRQUFRLEdBQUcsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxFQUFFLENBQUE7UUFDdEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUV0QyxJQUFJLEtBQUssR0FBb0IsRUFBRSxDQUFBO1FBQy9CLEtBQUksTUFBTSxXQUFXLElBQUksSUFBSSxFQUFDO1lBQzVCLDZDQUE2QztZQUM3QyxJQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUM7Z0JBQ2hDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQXNCLENBQUE7Z0JBRXZELElBQUcsSUFBSSxZQUFZLFFBQVEsRUFBQztvQkFDMUIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFvQixDQUFDLENBQUMsQ0FBQTtpQkFDekQ7cUJBQU0sSUFBRyxJQUFJLFlBQVksTUFBTSxFQUFDO29CQUMv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Q0Y7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBQ2pCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVPLGVBQWUsQ0FBQyxJQUF1QjtRQUM3QyxNQUFNLElBQUksR0FBUSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtRQUUvQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2hDLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBRSxJQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSyxJQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksTUFBTTtnQkFDekUsSUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUUsSUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7O2dCQUU1RCxJQUFZLENBQUMsR0FBRyxDQUFDLEdBQUksSUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzNDLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0NBQ0o7QUFqV0c7SUFEQyxJQUFBLFNBQUssR0FBRTs7aUNBQ1U7QUFGdEIsd0JBbVdDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCBWYWxpZGF0b3IsIHsgRXJyb3JzIH0gZnJvbSBcInZhbGlkYXRvcmpzXCJcclxuaW1wb3J0IFJlcG9zaXRvcnkgZnJvbSBcIn4vcmVwb3NpdG9yaWVzL1JlcG9zaXRvcnlcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIEhhc09uZVJlbGF0aW9uQ29uZmlnLCBSZWxhdGlvbkNvbmZpZ1dpdGhUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvUmVsYXRpb25Db25maWdcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0b3JGdW5jdGlvbiB9IGZyb20gXCIuLi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvblwiO1xyXG5pbXBvcnQgeyBGaWVsZENvbmZpZyB9IGZyb20gXCIuLi90eXBlcy9jb25maWdzL0ZpZWxkQ29uZmlnXCI7XHJcbmltcG9ydCB7IFZhbGlkYXRlQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvVmFsaWRhdGVDb25maWdcIjtcclxuaW1wb3J0IHsgQmx1ZXByaW50IH0gZnJvbSBcIi4vQmx1ZXByaW50XCI7XHJcbmltcG9ydCB7IEZpZWxkIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IGluc3RhbmNlVG9QbGFpbiwgcGxhaW5Ub0luc3RhbmNlIH0gZnJvbSBcImNsYXNzLXRyYW5zZm9ybWVyXCI7XHJcbmltcG9ydCB7IENsYXNzV2l0aEZpZWxkcyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aEZpZWxkc1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhDb2xsZWN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoQ29sbGVjdGlvblwiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSZWxhdGlvbnMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSZWxhdGlvbnNcIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoUnVsZXMgfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9DbGFzc1dpdGhSdWxlc1wiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFBhcmFtc09iamVjdCA9IHsgW2tleTogc3RyaW5nXTogYW55IH07XHJcblxyXG4vL1RPRE8gZXZlbnRzIGJlZm9yZSBkZWxldGUsIGFmdGVyIGRlbGV0LCBiZWZvcmUgbG9hZCwgYmVmb3JlLWFmdGVyIHNhdmUsIHVwZGF0ZSBldGMuLi5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIE1vZGVsIHtcclxuICAgIEBGaWVsZCgpXHJcbiAgICBpZD86IHN0cmluZyA9IG51bGxcclxuXHJcbiAgICByZWxhdGlvbnNMb2FkZWQ6IHN0cmluZ1tdID0gW11cclxuXHJcbiAgICBjb25zdHJ1Y3RvciguLi5fOiBhbnlbXSkge31cclxuXHJcbiAgICBpbml0KC4uLl86IGFueVtdKTogdm9pZCB7IHJldHVybiB9XHJcblxyXG4gICAgcHJpdmF0ZSBlcnJvcnM6IEVycm9ycyA9IG51bGxcclxuXHJcbiAgICBhYnN0cmFjdCBnZXRNb2RlbE5hbWUoKTogc3RyaW5nXHJcblxyXG4gICAgcHJpdmF0ZSBjb2xsZWN0UnVsZXM8VD4oKTogVmFsaWRhdG9yLlJ1bGVzIHtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoUnVsZXM8VD4pXHJcbiAgICAgIGNvbnN0IHJ1bGVEYXRhID0gcHJvdG90eXBlLnJ1bGVzID8/IHt9XHJcbiAgICAgIGNvbnN0IHJ1bGVLZXlzID0gT2JqZWN0LmtleXMocnVsZURhdGEpXHJcblxyXG4gICAgICBsZXQgcnVsZXM6IFZhbGlkYXRvci5SdWxlcyA9IHt9XHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKXtcclxuICAgICAgICAvL1RPRE8gcmVjdXJzaXZlIHZhbGlkYXRpb24gb24gcmVsYXRlZCBtb2RlbHNcclxuICAgICAgICBpZihydWxlS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3QgcnVsZSA9IHJ1bGVEYXRhW3Byb3BlcnR5S2V5XSBhcyBWYWxpZGF0ZUNvbmZpZzxUPlxyXG5cclxuICAgICAgICAgIGlmKHJ1bGUgaW5zdGFuY2VvZiBGdW5jdGlvbil7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSh0aGlzIGFzIHVua25vd24gYXMgVCkpXHJcbiAgICAgICAgICB9IGVsc2UgaWYocnVsZSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJ1bGVzW3Byb3BlcnR5S2V5XSA9IHJ1bGVcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJ1bGVzXHJcbiAgICB9XHJcblxyXG4gICAgdmFsaWRhdGUgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5jb2xsZWN0UnVsZXMoKVxyXG4gICAgICAgIGxldCB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKHRoaXMgYXMgYW55LCBydWxlcylcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkYXRvci5oYXNBc3luYykge1xyXG4gICAgICAgICAgdmFsaWRhdG9yLmNoZWNrQXN5bmMocmVzb2x2ZSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JzKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHZhbGlkYXRvci5jaGVjaygpKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCh0aGlzLmVycm9ycylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzICgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzID8/IHt9KS5sZW5ndGggPiAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWxsRXJyb3JzICgpOiBWYWxpZGF0b3IuVmFsaWRhdGlvbkVycm9ycyB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uYWxsKClcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvcnMgKG5hbWU6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZ2V0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3IgKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5maXJzdChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRNYW55KHJlbGF0aW9uTmFtZXM6IHN0cmluZ1tdLCBmb3JjZVJlbG9hZDogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPHZvaWQ+e1xyXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdXHJcbiAgICAgIGZvcihjb25zdCByZWxhdGlvbiBpbiByZWxhdGlvbk5hbWVzKXtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZChyZWxhdGlvbk5hbWVzW3JlbGF0aW9uXSwgZm9yY2VSZWxvYWQpKVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWQocmVsYXRpb25OYW1lOiBzdHJpbmcsIGZvcmNlUmVsb2FkOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZVxyXG4gICAgICBjb25zdCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9ucyA9IHJlbGF0aW9uTmFtZS5zcGxpdCgnLicpXHJcbiAgICAgIHJlbGF0aW9uTmFtZSA9IHJlbGF0aW9ucy5yZXZlcnNlKCkucG9wKClcclxuXHJcbiAgICAgIGxldCBsb2FkZWRQcm9wZXJ0eSA9IHJlbGF0aW9uTmFtZVxyXG5cclxuICAgICAgY29uc3QgcHJvdG90eXBlID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9uRGF0YSA9IHByb3RvdHlwZS5yZWxhdGlvbnMgPz8ge31cclxuICAgICAgY29uc3QgcmVsYXRpb25LZXlzID0gT2JqZWN0LmtleXMocmVsYXRpb25EYXRhKVxyXG4gICAgICBcclxuICAgICAgaWYoIXRoaXMucmVsYXRpb25zTG9hZGVkLmluY2x1ZGVzKHJlbGF0aW9uTmFtZSkgfHwgZm9yY2VSZWxvYWQpe1xyXG4gICAgICAgIGNvbnN0IHJvdXRlUGFyYW1zID0gdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihyZWxhdGlvbktleXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHJlbGF0aW9uRGF0YVtwcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgLy9nZXQgdGhlIHJlcG9zaXRvcnkgZm9yIHRoZSBjdXJyZW50IG1vZGVsQ2xhc3NcclxuICAgICAgICAgICAgY29uc3QgcmVwb3NpdG9yeSA9IGdldFJlcG9zaXRvcnlGb3Iob3B0aW9ucy5tb2RlbENsYXNzIGFzIENvbnN0cnVjdG9yRnVuY3Rpb248TW9kZWw+KSBhcyBSZXBvc2l0b3J5PE1vZGVsPlxyXG4gICAgICAgICAgICBpZigob3B0aW9ucy5uYW1lICYmIG9wdGlvbnMubmFtZSA9PT0gcmVsYXRpb25OYW1lKSB8fCBwcm9wZXJ0eUtleSA9PT0gcmVsYXRpb25OYW1lKSB7XHJcbiAgICAgICAgICAgICAgbG9hZGVkUHJvcGVydHkgPSBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxyXG4gICAgICAgICAgICAgIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc01hbnknKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc01hbnlPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNNYW55UmVsYXRpb25Db25maWdcclxuICAgICAgICAgICAgICAgIGlmKCFoYXNNYW55T3B0aW9ucy5tYXBJZHMgJiYgIWhhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHMpe1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEBIYXNNYW55IHJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gaXMgbWlzc2luZyAnbWFwSWRzJyBhbmQgJ3JlbGF0ZWRJZHMnLiBPbmUgb2YgdGhlbSBtdXN0IGJlIGRlZmluZWQuYClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1twcm9wZXJ0eUtleV0pIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRNYW55KChoYXNNYW55T3B0aW9ucy5tYXBJZHMgPyBoYXNNYW55T3B0aW9ucy5tYXBJZHModGhpcykgOiBhbnlUaGlzW2hhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHNdKSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1twcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baW5kZXhdW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IHdpdGggJyR7b3B0aW9ucy50eXBlfScgb24gJHtwcm9wZXJ0eUtleX0gcHJvcGVydHkgaXMgbm90IGFuIGFycmF5YClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2UgaWYob3B0aW9ucy50eXBlID09PSAnaGFzQ29sbGVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETyBhbiBvcHRpb24gd2hlcmUgdGhlIHJlbGF0ZWQgZGF0YSBjYW4gYmUgJ3BhZ2luYXRlZCdcclxuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcHJvcGVydHkgaXMgYXJyYXksIHRoZW4gbG9hZCB0aGUgc3ViY29sbGVjdGlvbiBpbnRvIGl0XHJcbiAgICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGFueVRoaXNbcHJvcGVydHlLZXldKSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkQ29sbGVjdGlvbihyb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNPbmVPcHRpb25zID0gb3B0aW9ucyBhcyBIYXNPbmVSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgLy9sb2FkIGRhdGEgaW50byB0aGUgJ3Byb3BlcnR5S2V5JyBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwsIHdoaWxlIGxvYWQgdGhlIG1vZGVsIHdpdGggdGhlIGlkIGZyb20gdGhlICdyZWxhdGVkSWQnIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGF3YWl0IHJlcG9zaXRvcnkubG9hZCgodGhpcyBhcyBhbnkpW2hhc09uZU9wdGlvbnMucmVsYXRlZElkXSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICBpZihoYXNPbmVPcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2hhc09uZU9wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAgIGlmKCFmb3VuZCl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSBub3QgZm91bmQgb24gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5yZWxhdGlvbnNMb2FkZWQucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGggPiAwKXtcclxuICAgICAgICAvL3JldmVyc2UgYmFjayB0aGUgYXJyYXkgXHJcbiAgICAgICAgcmVsYXRpb25zLnJldmVyc2UoKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0pKXtcclxuICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSl7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV1baW5kZXhdLmxvYWQocmVsYXRpb25zLmpvaW4oJy4nKSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXdhaXQgYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEJsdWVwcmludDxUIGV4dGVuZHMgTW9kZWw+KHRoaXM6IFQpOiBCbHVlcHJpbnQ8VD4ge1xyXG4gICAgICByZXR1cm4gbmV3IEJsdWVwcmludCh0aGlzLCB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpKVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvdXRlKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHRpb25zLnJvdXRlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCk6IFBhcmFtc09iamVjdCB7XHJcbiAgICAgIGNvbnN0IHNlYXJjaFJlZ2V4ID0gL3soW159XSspfS9nXHJcbiAgICAgIGNvbnN0IHByb3RvdHlwZSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzICYgQ2xhc3NXaXRoQ29sbGVjdGlvbilcclxuICAgICAgY29uc3QgZmllbGREYXRhID0gcHJvdG90eXBlLmZpZWxkcyA/PyB7fVxyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcbiAgICAgIGlmKHByb3RvdHlwZS5jb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb3RvdHlwZS5jb2xsZWN0aW9uXHJcbiAgICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYXZlIGEgcm91dGUgcGFyYW1ldGVyIG9uIHRoZSBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uYClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVE9ETyBoYXZlIGEgbG9vayBhdCB0aGUgd29ya2luZ3Mgb2YgdGhpcyBnZXRST3V0ZVBhcmFtZXRlciBiZWNhdXNlIHRoZXJlIGFyZSBzb21lIHN0cmFuZ2UgdGhpbmdzIGludm9sdmVkXHJcbiAgICAgICAgLy9nZXQgZXZlcnkgcGFyYW0gd2hpY2ggaGFzIGJlZW4gYW5ub3RhdGVkIGluIHRoZSBtb2RlbCB3aXRoICdyb3V0ZVBhcmFtOiB0cnVlJ1xyXG4gICAgICAgIGNvbnN0IHBhcmFtc09iamVjdDogUGFyYW1zT2JqZWN0ID0ge31cclxuICAgICAgICBcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZERhdGFbcHJvcGVydHlLZXldXHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLnJvdXRlUGFyYW0pe1xyXG4gICAgICAgICAgICAgIHBhcmFtc09iamVjdFtvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc3QgcGF0aFRlbXBsYXRlID0gb3B0aW9ucy5yb3V0ZVxyXG4gICAgICAgIC8vIGNvbnN0IHBhcmFtcyA9IHNlYXJjaFJlZ2V4LmV4ZWMocGF0aFRlbXBsYXRlKVxyXG5cclxuICAgICAgICAvLyAvLyBjb25zdCByZXR1cm5QYXJhbXM6IHN0cmluZ1tdID0gW11cclxuICAgICAgICAvLyAvL2lmIGhhcyByb3V0ZSBwYXJhbVxyXG4gICAgICAgIC8vIGlmKHBhcmFtcyl7XHJcbiAgICAgICAgLy8gICAvL2NoZWNrIHRvIHNlZSBpZiByb3V0ZSBwYXJhbSBpcyBhIHByb3BlcnR5IG9mIHRoZSBtb2RlbCBhbmQgaXQgaXMgc2V0XHJcbiAgICAgICAgLy8gICBwYXJhbXMuZm9yRWFjaCgocGFyYW0pID0+IHtcclxuICAgICAgICAvLyAgICAgY29uc3QgcGFyYW1TdHJpcCA9IHBhcmFtLnJlcGxhY2UoL1t7fV0vZywgJycpXHJcbiAgICAgICAgLy8gICAgIGlmKCFwYXJhbXNPYmplY3RbcGFyYW1TdHJpcF0pe1xyXG4gICAgICAgIC8vICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVxdWlyZWQgcm91dGUgcGFyYW0gJHtwYXJhbVN0cmlwfSBpcyBub3Qgc2V0IG9uIHRoZSBjbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIC8vIGlmKCFyZXR1cm5QYXJhbXMuaW5jbHVkZXMocGFyYW1TdHJpcCkpIHJldHVyblBhcmFtcy5wdXNoKHBhcmFtU3RyaXApXHJcbiAgICAgICAgLy8gICB9KVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcmFtc09iamVjdFxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBub3QgYW5ub3RhdGVkIHdpdGggQENvbGxlY3Rpb25gKVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvSnNvbigpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSB7fVxyXG5cclxuICAgICAgY29uc3QgZmllbGREYXRhID0gKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSBhcyBDbGFzc1dpdGhGaWVsZHMpLmZpZWxkc1xyXG4gICAgICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZERhdGEpXHJcblxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgIC8vIGlmIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgaW50byBqc29uXHJcbiAgICAgICAgaWYoZmllbGRLZXlzLmluY2x1ZGVzKHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZmllbGREYXRhW3Byb3BlcnR5S2V5XSBhcyBGaWVsZENvbmZpZ1xyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgaWYodGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgIC8vIGlmIHRoZSBwcm9wZXJ0eSBpcyBhIG1vZGVsLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSAodGhpc1twcm9wZXJ0eUtleV0gYXMgdW5rbm93biBhcyBNb2RlbCkudG9Kc29uKClcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIGFuIGFycmF5IG9yIG9iamVjdCB0aGVuIGl0ZXJhdGUgb3ZlciBpdHMgcHJvcGVydGllcywgYW5kIGNvbnZlcnQgaW50byBqc29uIHJlY3Vyc2l2ZWx5XHJcbiAgICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh0aGlzW3Byb3BlcnR5S2V5XSkpIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydFRvSnNvbih0aGlzW3Byb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IGluc3RhbmNlVG9QbGFpbih0aGlzW3Byb3BlcnR5S2V5XSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgLy8ganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9vdGhlcndpc2UgcHJvcGVydHkgaXMganVzdCBhIHByb3BlcnR5LCBzbyB3ZSBjb252ZXJ0IGl0IGJhc2VkIG9uIGl0cyB0eXBlIG9yIGRlY29yYXRvclxyXG4gICAgICAgICAgICAgICAgaWYob3B0aW9ucy50aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydFRvVGltZXN0YW1wKCh0aGlzW3Byb3BlcnR5S2V5XSBhcyBhbnkpKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBudWxsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGpzb24uaWQgPSB0aGlzLmlkXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9Kc29uKHJvb3Q6IEFycmF5PGFueT58T2JqZWN0KTogYW55IHtcclxuICAgICAgY29uc3QganNvbjogYW55ID0gQXJyYXkuaXNBcnJheShyb290KSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldLnRvSnNvbigpIFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheSgocm9vdCBhcyBhbnkpW2tleV0pIHx8IChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gdGhpcy5jb252ZXJ0VG9Kc29uKChyb290IGFzIGFueSlba2V5XSlcclxuICAgICAgICAgICAgfSBlbHNlIHsgXHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgZnJvbUpzb24oZGF0YTogYW55KTogdGhpcyB7XHJcbiAgICAgIGxldCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IGZpZWxkRGF0YSA9IChPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgYXMgQ2xhc3NXaXRoRmllbGRzKS5maWVsZHNcclxuICAgICAgY29uc3QgZmllbGRLZXlzID0gT2JqZWN0LmtleXMoZmllbGREYXRhKVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIGRhdGEpIHtcclxuICAgICAgICAvL2lmIHByb3BlcnR5IGV4aXN0cyBpbiBkYXRhIGFuZCBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGZyb20ganNvblxyXG4gICAgICAgIGlmKGZpZWxkS2V5cy5pbmNsdWRlcyhwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkRGF0YVtwcm9wZXJ0eUtleV0gYXMgRmllbGRDb25maWdcclxuICAgICAgICAgIGNvbnN0IGpzb25Qcm9wZXJ0eUtleSA9IG9wdGlvbnMubmFtZSA/PyBwcm9wZXJ0eUtleVxyXG4gICAgICAgICAgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgaWYob3B0aW9ucz8ubW9kZWxDbGFzcykge1xyXG4gICAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZGF0YVtqc29uUHJvcGVydHlLZXldKSl7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBuZXcgQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgZGF0YVtqc29uUHJvcGVydHlLZXldLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5tb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCgoKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkgYXMgTW9kZWwpLmZyb21Kc29uKHZhbHVlKSlcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBwbGFpblRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCB2YWx1ZSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLm1vZGVsQ2xhc3MucHJvdG90eXBlIGluc3RhbmNlb2YgTW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCgoKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkgYXMgTW9kZWwpLmZyb21Kc29uKGRhdGFbanNvblByb3BlcnR5S2V5XSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBwbGFpblRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0sIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydEZyb21UaW1lc3RhbXAoZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIGFuIGFycmF5IG9yIG9iamVjdCB0aGVuIGl0ZXJhdGUgb3ZlciBpdHMgcHJvcGVydGllcywgYW5kIGNvbnZlcnQgZnJvbSBqc29uIHJlY3Vyc2l2ZWx5XHJcbiAgICAgICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGRhdGFbanNvblByb3BlcnR5S2V5XSkpe1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydEZyb21Kc29uKGRhdGFbanNvblByb3BlcnR5S2V5XSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgLy9pZiBwcm9wZXJ0eSBpcyBvYmplY3QgdGhlbiB3ZSBhc3NpZ24gdGhlIGRhdGEgdG8gdGhlIGRlZmF1bHQgcHJvcGVydHkgdmFsdWUsIHVzZXIgbWlnaHQgbmVlZCBpdFxyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IHRoaXMuY29udmVydEZyb21Kc29uKE9iamVjdC5hc3NpZ24oYW55VGhpc1twcm9wZXJ0eUtleV0sIGRhdGFbanNvblByb3BlcnR5S2V5XSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gZGF0YVtqc29uUHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaWQgPSBkYXRhLmlkXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb252ZXJ0RnJvbUpzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnl7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IEFycmF5LmlzQXJyYXkocm9vdCkgPyBbXSA6IHt9XHJcbiAgICAgIFxyXG4gICAgICBPYmplY3Qua2V5cyhyb290KS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KChyb290IGFzIGFueSlba2V5XSkgfHwgKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgT2JqZWN0KVxyXG4gICAgICAgICAgKGpzb24gYXMgYW55KVtrZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oKHJvb3QgYXMgYW55KVtrZXldKVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIChqc29uIGFzIGFueSlba2V5XSA9IChyb290IGFzIGFueSlba2V5XVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxufVxyXG4iXX0=