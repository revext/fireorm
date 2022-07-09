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
const MetadataKeys_1 = require("../decorators/MetadataKeys");
const engine_1 = require("../engine");
const repositories_1 = require("../repositories");
const Blueprint_1 = require("./Blueprint");
const __1 = require("..");
const class_transformer_1 = require("class-transformer");
//TODO events before delete, after delet, before load, before-after save, update etc...
class Model {
    constructor(...params) {
        this.id = null;
        this.relationsLoaded = [];
        this.errors = null;
        this.init(params);
    }
    init(_) { return; }
    collectRules() {
        var _a;
        let rules = {};
        for (const propertyKey in this) {
            //TODO recursive validation on related models
            if (Reflect.hasMetadata(MetadataKeys_1.validateMetadataKey, this, propertyKey)) {
                const rule = (_a = Reflect.getMetadata(MetadataKeys_1.validateMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
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
        if (!this.relationsLoaded.includes(relationName)) {
            const routeParams = this.getRouteParameterMapping();
            for (const propertyKey in this) {
                if (Reflect.hasMetadata(MetadataKeys_1.relationMetadataKey, this, propertyKey)) {
                    const options = (_a = Reflect.getMetadata(MetadataKeys_1.relationMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
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
                            if (anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
                                anyThis[propertyKey] = await repository.loadMany((hasManyOptions.mapIds ? hasManyOptions.mapIds(this) : anyThis[hasManyOptions.relatedIds]), routeParams);
                                if (options.foreignProperty) {
                                    for (const index in anyThis[propertyKey]) {
                                        anyThis[propertyKey][index][options.foreignProperty] = this;
                                    }
                                }
                            }
                            else {
                                throw new Error(`Relation ${relationName} with '${options.type}' on ${options.relatedId} property is not an array`);
                            }
                        }
                        else if (options.type === 'hasCollection') {
                            //TODO an option where the related data can be 'paginated'
                            //check if property is array, then load the subcollection into it
                            if (anyThis[propertyKey] instanceof Array || anyThis[propertyKey] === undefined || anyThis[propertyKey] === null) {
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
                            //load data into the 'propertyKey' property of the model, while load the model with the id from the 'relatedId' property
                            anyThis[propertyKey] = await repository.load(this[options.relatedId], routeParams);
                            if (options.foreignProperty) {
                                anyThis[propertyKey][options.foreignProperty] = this;
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
            if (anyThis[loadedProperty] instanceof Array) {
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
        var _a;
        const options = (_a = Reflect.getMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) !== null && _a !== void 0 ? _a : {};
        if (!options || !options.route) {
            throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
        }
        return options.route;
    }
    getRouteParameterMapping() {
        var _a, _b, _c;
        const searchRegex = /{([^}]+)}/g;
        if (Reflect.hasMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) {
            const options = (_a = Reflect.getMetadata(MetadataKeys_1.collectionMetadataKey, this.constructor)) !== null && _a !== void 0 ? _a : {};
            if (!options || !options.route) {
                throw new Error(`Class ${this.constructor.name} doesn't have a route parameter on the @Collection annotation`);
            }
            //TODO have a look at the workings of this getROuteParameter because there are some strange things involved
            //get every param which has been annotated in the model with 'routeParam: true'
            const paramsObject = {};
            for (const propertyKey in this) {
                if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                    const options = (_b = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _b !== void 0 ? _b : {};
                    if (options.routeParam) {
                        paramsObject[(_c = options.name) !== null && _c !== void 0 ? _c : propertyKey] = this[propertyKey];
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
        var _a, _b;
        const json = {};
        for (const propertyKey in this) {
            // if property has field metadata, then we must convert into json
            if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                const options = ((_a = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {});
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (this[propertyKey] !== undefined) {
                    if (this[propertyKey] instanceof Model) {
                        // if the property is a model, then we must convert into json
                        json[jsonPropertyKey] = this[propertyKey].toJson();
                    }
                    else {
                        //if property is an array or object then iterate over its properties, and convert into json recursively
                        if (this[propertyKey] instanceof Array) {
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
        const json = root instanceof Array ? [] : {};
        Object.keys(root).forEach((key) => {
            if (root[key] !== undefined)
                if (root[key] instanceof Model) {
                    json[key] = root[key].toJson();
                }
                else {
                    if (root[key] instanceof Array || root[key] instanceof Object) {
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
        var _a, _b;
        let anyThis = this;
        for (const propertyKey in data) {
            //if property exists in data and property has field metadata, then we must convert from json
            if (Reflect.hasMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) {
                const options = (_a = Reflect.getMetadata(MetadataKeys_1.fieldMetadataKey, this, propertyKey)) !== null && _a !== void 0 ? _a : {};
                const jsonPropertyKey = (_b = options.name) !== null && _b !== void 0 ? _b : propertyKey;
                if (data[jsonPropertyKey]) {
                    if (options === null || options === void 0 ? void 0 : options.modelClass) {
                        if (data[jsonPropertyKey] instanceof Array) {
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
                            if (data[jsonPropertyKey] instanceof Array) {
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
        const json = root instanceof Array ? [] : {};
        Object.keys(root).forEach((key) => {
            if (root[key] instanceof Array || root[key] instanceof Object)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLDZEQUErSDtBQUMvSCxzQ0FBc0M7QUFDdEMsa0RBQW1EO0FBS25ELDJDQUF3QztBQUN4QywwQkFBMkI7QUFDM0IseURBQXFFO0FBS3JFLHVGQUF1RjtBQUV2RixNQUE4QixLQUFLO0lBTS9CLFlBQVksR0FBRyxNQUFhO1FBSjVCLE9BQUUsR0FBWSxJQUFJLENBQUE7UUFFbEIsb0JBQWUsR0FBYSxFQUFFLENBQUE7UUFRdEIsV0FBTSxHQUFXLElBQUksQ0FBQTtRQUwzQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFFRCxJQUFJLENBQUMsQ0FBUSxJQUFVLE9BQU0sQ0FBQyxDQUFDO0lBTXZCLFlBQVk7O1FBRWxCLElBQUksS0FBSyxHQUFvQixFQUFFLENBQUE7UUFDL0IsS0FBSSxNQUFNLFdBQVcsSUFBSSxJQUFJLEVBQUM7WUFDNUIsNkNBQTZDO1lBQzdDLElBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBbUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUM7Z0JBQzdELE1BQU0sSUFBSSxHQUFHLE1BQUEsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBbUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLG1DQUFJLEVBQXVCLENBQUE7Z0JBRW5HLElBQUcsSUFBSSxZQUFZLFFBQVEsRUFBQztvQkFDMUIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO2lCQUN6QztxQkFBTSxJQUFHLElBQUksWUFBWSxNQUFNLEVBQUM7b0JBQy9CLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMs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Q0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDSjtBQTlVRztJQURDLElBQUEsU0FBSyxHQUFFOztpQ0FDVTtBQUZ0Qix3QkFnVkMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IFZhbGlkYXRvciwgeyBFcnJvcnMgfSBmcm9tIFwidmFsaWRhdG9yanNcIlxyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwifi9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeVwiO1xyXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWV0YWRhdGFLZXksIGZpZWxkTWV0YWRhdGFLZXksIHJlbGF0aW9uTWV0YWRhdGFLZXksIHZhbGlkYXRlTWV0YWRhdGFLZXkgfSBmcm9tIFwiLi4vZGVjb3JhdG9ycy9NZXRhZGF0YUtleXNcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvRmllbGRDb25maWdcIjtcclxuaW1wb3J0IHsgVmFsaWRhdGVDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9WYWxpZGF0ZUNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tIFwiLi9CbHVlcHJpbnRcIjtcclxuaW1wb3J0IHsgRmllbGQgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgaW5zdGFuY2VUb1BsYWluLCBwbGFpblRvSW5zdGFuY2UgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBQYXJhbXNPYmplY3QgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xyXG5cclxuLy9UT0RPIGV2ZW50cyBiZWZvcmUgZGVsZXRlLCBhZnRlciBkZWxldCwgYmVmb3JlIGxvYWQsIGJlZm9yZS1hZnRlciBzYXZlLCB1cGRhdGUgZXRjLi4uXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBNb2RlbCB7XHJcbiAgICBARmllbGQoKVxyXG4gICAgaWQ/OiBzdHJpbmcgPSBudWxsXHJcblxyXG4gICAgcmVsYXRpb25zTG9hZGVkOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgY29uc3RydWN0b3IoLi4ucGFyYW1zOiBhbnlbXSkge1xyXG4gICAgICB0aGlzLmluaXQocGFyYW1zKVxyXG4gICAgfVxyXG5cclxuICAgIGluaXQoXzogYW55W10pOiB2b2lkIHsgcmV0dXJuIH1cclxuXHJcbiAgICBwcml2YXRlIGVycm9yczogRXJyb3JzID0gbnVsbFxyXG5cclxuICAgIGFic3RyYWN0IGdldE1vZGVsTmFtZSgpOiBzdHJpbmdcclxuXHJcbiAgICBwcml2YXRlIGNvbGxlY3RSdWxlczxUPigpOiBWYWxpZGF0b3IuUnVsZXMge1xyXG4gICAgICBcclxuICAgICAgbGV0IHJ1bGVzOiBWYWxpZGF0b3IuUnVsZXMgPSB7fVxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcyl7XHJcbiAgICAgICAgLy9UT0RPIHJlY3Vyc2l2ZSB2YWxpZGF0aW9uIG9uIHJlbGF0ZWQgbW9kZWxzXHJcbiAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YSh2YWxpZGF0ZU1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3QgcnVsZSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEodmFsaWRhdGVNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIFZhbGlkYXRlQ29uZmlnPFQ+XHJcblxyXG4gICAgICAgICAgaWYocnVsZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcclxuICAgICAgICAgICAgcnVsZXMgPSBPYmplY3QuYXNzaWduKHJ1bGVzLCBydWxlKHRoaXMpKVxyXG4gICAgICAgICAgfSBlbHNlIGlmKHJ1bGUgaW5zdGFuY2VvZiBPYmplY3Qpe1xyXG4gICAgICAgICAgICBydWxlcyA9IE9iamVjdC5hc3NpZ24ocnVsZXMsIHJ1bGUpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBydWxlc1twcm9wZXJ0eUtleV0gPSBydWxlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBydWxlc1xyXG4gICAgfVxyXG5cclxuICAgIHZhbGlkYXRlICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCBydWxlcyA9IHRoaXMuY29sbGVjdFJ1bGVzKClcclxuICAgICAgICBsZXQgdmFsaWRhdG9yID0gbmV3IFZhbGlkYXRvcih0aGlzIGFzIGFueSwgcnVsZXMpXHJcblxyXG4gICAgICAgIGlmICh2YWxpZGF0b3IuaGFzQXN5bmMpIHtcclxuICAgICAgICAgIHZhbGlkYXRvci5jaGVja0FzeW5jKHJlc29sdmUsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXHJcbiAgICAgICAgICAgIHJlamVjdCgpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodmFsaWRhdG9yLmNoZWNrKCkpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzICgpOiBib29sZWFuIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzID8/IHt9KS5sZW5ndGggPiAwXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWxsRXJyb3JzICgpOiBWYWxpZGF0b3IuVmFsaWRhdGlvbkVycm9ycyB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uYWxsKClcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvcnMgKG5hbWU6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gfCBmYWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVycm9ycz8uZ2V0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3IgKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5maXJzdChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRNYW55KHJlbGF0aW9uTmFtZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPntcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXVxyXG4gICAgICBmb3IoY29uc3QgcmVsYXRpb24gaW4gcmVsYXRpb25OYW1lcyl7XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLmxvYWQocmVsYXRpb25OYW1lc1tyZWxhdGlvbl0pKVxyXG4gICAgICB9XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWQocmVsYXRpb25OYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgbGV0IGZvdW5kID0gZmFsc2VcclxuICAgICAgY29uc3QgYW55VGhpcyA9IHRoaXMgYXMgYW55XHJcblxyXG4gICAgICBjb25zdCByZWxhdGlvbnMgPSByZWxhdGlvbk5hbWUuc3BsaXQoJy4nKVxyXG4gICAgICByZWxhdGlvbk5hbWUgPSByZWxhdGlvbnMucmV2ZXJzZSgpLnBvcCgpXHJcblxyXG4gICAgICBsZXQgbG9hZGVkUHJvcGVydHkgPSByZWxhdGlvbk5hbWVcclxuICAgICAgXHJcbiAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc0xvYWRlZC5pbmNsdWRlcyhyZWxhdGlvbk5hbWUpKXtcclxuICAgICAgICBjb25zdCByb3V0ZVBhcmFtcyA9IHRoaXMuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKClcclxuICAgICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gdGhpcykge1xyXG4gICAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShyZWxhdGlvbk1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShyZWxhdGlvbk1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30gYXMgUmVsYXRpb25Db25maWdXaXRoVHlwZVxyXG4gICAgICAgICAgICAvL2dldCB0aGUgcmVwb3NpdG9yeSBmb3IgdGhlIGN1cnJlbnQgbW9kZWxDbGFzc1xyXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZ2V0UmVwb3NpdG9yeUZvcihvcHRpb25zLm1vZGVsQ2xhc3MgYXMgQ29uc3RydWN0b3JGdW5jdGlvbjxNb2RlbD4pIGFzIFJlcG9zaXRvcnk8TW9kZWw+XHJcbiAgICAgICAgICAgIGlmKChvcHRpb25zLm5hbWUgJiYgb3B0aW9ucy5uYW1lID09PSByZWxhdGlvbk5hbWUpIHx8IHByb3BlcnR5S2V5ID09PSByZWxhdGlvbk5hbWUpIHtcclxuICAgICAgICAgICAgICBsb2FkZWRQcm9wZXJ0eSA9IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50eXBlID09PSAnaGFzTWFueScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzTWFueU9wdGlvbnMgPSBvcHRpb25zIGFzIEhhc01hbnlSZWxhdGlvbkNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgaWYoIWhhc01hbnlPcHRpb25zLm1hcElkcyAmJiAhaGFzTWFueU9wdGlvbnMucmVsYXRlZElkcyl7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQEhhc01hbnkgcmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBtaXNzaW5nICdtYXBJZHMnIGFuZCAncmVsYXRlZElkcycuIE9uZSBvZiB0aGVtIG11c3QgYmUgZGVmaW5lZC5gKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoYW55VGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkTWFueSgoaGFzTWFueU9wdGlvbnMubWFwSWRzID8gaGFzTWFueU9wdGlvbnMubWFwSWRzKHRoaXMpIDogYW55VGhpc1toYXNNYW55T3B0aW9ucy5yZWxhdGVkSWRzXSksIHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7b3B0aW9ucy5yZWxhdGVkSWR9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKG9wdGlvbnMudHlwZSA9PT0gJ2hhc0NvbGxlY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAvL1RPRE8gYW4gb3B0aW9uIHdoZXJlIHRoZSByZWxhdGVkIGRhdGEgY2FuIGJlICdwYWdpbmF0ZWQnXHJcbiAgICAgICAgICAgICAgICAvL2NoZWNrIGlmIHByb3BlcnR5IGlzIGFycmF5LCB0aGVuIGxvYWQgdGhlIHN1YmNvbGxlY3Rpb24gaW50byBpdFxyXG4gICAgICAgICAgICAgICAgaWYoYW55VGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSB8fCBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9PT0gdW5kZWZpbmVkIHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkQ29sbGVjdGlvbihyb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW3Byb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtpbmRleF1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gd2l0aCAnJHtvcHRpb25zLnR5cGV9JyBvbiAke3Byb3BlcnR5S2V5fSBwcm9wZXJ0eSBpcyBub3QgYW4gYXJyYXlgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL2xvYWQgZGF0YSBpbnRvIHRoZSAncHJvcGVydHlLZXknIHByb3BlcnR5IG9mIHRoZSBtb2RlbCwgd2hpbGUgbG9hZCB0aGUgbW9kZWwgd2l0aCB0aGUgaWQgZnJvbSB0aGUgJ3JlbGF0ZWRJZCcgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gYXdhaXQgcmVwb3NpdG9yeS5sb2FkKCh0aGlzIGFzIGFueSlbb3B0aW9ucy5yZWxhdGVkSWRdLCByb3V0ZVBhcmFtcylcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1bb3B0aW9ucy5mb3JlaWduUHJvcGVydHldID0gdGhpc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXHJcbiAgICAgICAgaWYoIWZvdW5kKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IG5vdCBmb3VuZCBvbiAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlbGF0aW9uc0xvYWRlZC5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYocmVsYXRpb25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgIC8vcmV2ZXJzZSBiYWNrIHRoZSBhcnJheSBcclxuICAgICAgICByZWxhdGlvbnMucmV2ZXJzZSgpXHJcbiAgICAgICAgaWYoYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0gaW5zdGFuY2VvZiBBcnJheSl7XHJcbiAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdXHJcbiAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0pe1xyXG4gICAgICAgICAgICBwcm9taXNlcy5wdXNoKGFueVRoaXNbbG9hZGVkUHJvcGVydHldW2luZGV4XS5sb2FkKHJlbGF0aW9ucy5qb2luKCcuJykpKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGF3YWl0IGFueVRoaXNbbG9hZGVkUHJvcGVydHldLmxvYWQocmVsYXRpb25zLmpvaW4oJy4nKSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRCbHVlcHJpbnQ8VCBleHRlbmRzIE1vZGVsPih0aGlzOiBUKTogQmx1ZXByaW50PFQ+IHtcclxuICAgICAgcmV0dXJuIG5ldyBCbHVlcHJpbnQodGhpcywgdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZSgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShjb2xsZWN0aW9uTWV0YWRhdGFLZXksIHRoaXMuY29uc3RydWN0b3IpID8/IHt9XHJcbiAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvcHRpb25zLnJvdXRlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCk6IFBhcmFtc09iamVjdCB7XHJcbiAgICAgIGNvbnN0IHNlYXJjaFJlZ2V4ID0gL3soW159XSspfS9nXHJcbiAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoY29sbGVjdGlvbk1ldGFkYXRhS2V5LCB0aGlzLmNvbnN0cnVjdG9yKSkge1xyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbGxlY3Rpb25NZXRhZGF0YUtleSwgdGhpcy5jb25zdHJ1Y3RvcikgPz8ge31cclxuICAgICAgICBpZighb3B0aW9ucyB8fCAhb3B0aW9ucy5yb3V0ZSl7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2Vzbid0IGhhdmUgYSByb3V0ZSBwYXJhbWV0ZXIgb24gdGhlIEBDb2xsZWN0aW9uIGFubm90YXRpb25gKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9UT0RPIGhhdmUgYSBsb29rIGF0IHRoZSB3b3JraW5ncyBvZiB0aGlzIGdldFJPdXRlUGFyYW1ldGVyIGJlY2F1c2UgdGhlcmUgYXJlIHNvbWUgc3RyYW5nZSB0aGluZ3MgaW52b2x2ZWRcclxuICAgICAgICAvL2dldCBldmVyeSBwYXJhbSB3aGljaCBoYXMgYmVlbiBhbm5vdGF0ZWQgaW4gdGhlIG1vZGVsIHdpdGggJ3JvdXRlUGFyYW06IHRydWUnXHJcbiAgICAgICAgY29uc3QgcGFyYW1zT2JqZWN0OiBQYXJhbXNPYmplY3QgPSB7fVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBGaWVsZENvbmZpZ1xyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucy5yb3V0ZVBhcmFtKXtcclxuICAgICAgICAgICAgICBwYXJhbXNPYmplY3Rbb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnN0IHBhdGhUZW1wbGF0ZSA9IG9wdGlvbnMucm91dGVcclxuICAgICAgICAvLyBjb25zdCBwYXJhbXMgPSBzZWFyY2hSZWdleC5leGVjKHBhdGhUZW1wbGF0ZSlcclxuXHJcbiAgICAgICAgLy8gLy8gY29uc3QgcmV0dXJuUGFyYW1zOiBzdHJpbmdbXSA9IFtdXHJcbiAgICAgICAgLy8gLy9pZiBoYXMgcm91dGUgcGFyYW1cclxuICAgICAgICAvLyBpZihwYXJhbXMpe1xyXG4gICAgICAgIC8vICAgLy9jaGVjayB0byBzZWUgaWYgcm91dGUgcGFyYW0gaXMgYSBwcm9wZXJ0eSBvZiB0aGUgbW9kZWwgYW5kIGl0IGlzIHNldFxyXG4gICAgICAgIC8vICAgcGFyYW1zLmZvckVhY2goKHBhcmFtKSA9PiB7XHJcbiAgICAgICAgLy8gICAgIGNvbnN0IHBhcmFtU3RyaXAgPSBwYXJhbS5yZXBsYWNlKC9be31dL2csICcnKVxyXG4gICAgICAgIC8vICAgICBpZighcGFyYW1zT2JqZWN0W3BhcmFtU3RyaXBdKXtcclxuICAgICAgICAvLyAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlcXVpcmVkIHJvdXRlIHBhcmFtICR7cGFyYW1TdHJpcH0gaXMgbm90IHNldCBvbiB0aGUgY2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YClcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vICAgICAvLyBpZighcmV0dXJuUGFyYW1zLmluY2x1ZGVzKHBhcmFtU3RyaXApKSByZXR1cm5QYXJhbXMucHVzaChwYXJhbVN0cmlwKVxyXG4gICAgICAgIC8vICAgfSlcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJhbXNPYmplY3RcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gaXMgbm90IGFubm90YXRlZCB3aXRoIEBDb2xsZWN0aW9uYClcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b0pzb24oKTogYW55IHtcclxuICAgICAgY29uc3QganNvbjogYW55ID0ge31cclxuXHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgLy8gaWYgcHJvcGVydHkgaGFzIGZpZWxkIG1ldGFkYXRhLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gKFJlZmxlY3QuZ2V0TWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9KSBhcyBGaWVsZENvbmZpZ1xyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgaWYodGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgIC8vIGlmIHRoZSBwcm9wZXJ0eSBpcyBhIG1vZGVsLCB0aGVuIHdlIG11c3QgY29udmVydCBpbnRvIGpzb25cclxuICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSAodGhpc1twcm9wZXJ0eUtleV0gYXMgdW5rbm93biBhcyBNb2RlbCkudG9Kc29uKClcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIGFuIGFycmF5IG9yIG9iamVjdCB0aGVuIGl0ZXJhdGUgb3ZlciBpdHMgcHJvcGVydGllcywgYW5kIGNvbnZlcnQgaW50byBqc29uIHJlY3Vyc2l2ZWx5XHJcbiAgICAgICAgICAgICAgaWYodGhpc1twcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0VG9Kc29uKHRoaXNbcHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gaW5zdGFuY2VUb1BsYWluKHRoaXNbcHJvcGVydHlLZXldLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAvLyBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL290aGVyd2lzZSBwcm9wZXJ0eSBpcyBqdXN0IGEgcHJvcGVydHksIHNvIHdlIGNvbnZlcnQgaXQgYmFzZWQgb24gaXRzIHR5cGUgb3IgZGVjb3JhdG9yXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0VG9UaW1lc3RhbXAoKHRoaXNbcHJvcGVydHlLZXldIGFzIGFueSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzW3Byb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IG51bGxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAganNvbi5pZCA9IHRoaXMuaWRcclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRUb0pzb24ocm9vdDogQXJyYXk8YW55PnxPYmplY3QpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSByb290IGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9XHJcbiAgICAgIFxyXG4gICAgICBPYmplY3Qua2V5cyhyb290KS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICBpZigocm9vdCBhcyBhbnkpW2tleV0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgIGpzb25ba2V5XSA9IChyb290IGFzIGFueSlba2V5XS50b0pzb24oKSBcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IChyb290IGFzIGFueSlba2V5XSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gdGhpcy5jb252ZXJ0VG9Kc29uKChyb290IGFzIGFueSlba2V5XSlcclxuICAgICAgICAgICAgfSBlbHNlIHsgXHJcbiAgICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBqc29uXHJcbiAgICB9XHJcblxyXG4gICAgZnJvbUpzb24oZGF0YTogYW55KTogdGhpcyB7XHJcbiAgICAgIGxldCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIGRhdGEpIHtcclxuICAgICAgICAvL2lmIHByb3BlcnR5IGV4aXN0cyBpbiBkYXRhIGFuZCBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGZyb20ganNvblxyXG4gICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGZpZWxkTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBGaWVsZENvbmZpZ1xyXG4gICAgICAgICAgY29uc3QganNvblByb3BlcnR5S2V5ID0gb3B0aW9ucy5uYW1lID8/IHByb3BlcnR5S2V5XHJcbiAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICBpZihvcHRpb25zPy5tb2RlbENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldIGluc3RhbmNlb2YgQXJyYXkpe1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gbmV3IEFycmF5KClcclxuICAgICAgICAgICAgICAgIGRhdGFbanNvblByb3BlcnR5S2V5XS5mb3JFYWNoKCh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMubW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldLnB1c2goKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkuZnJvbUpzb24odmFsdWUpKVxyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIHZhbHVlLCB7ZW5hYmxlQ2lyY3VsYXJDaGVjazogdHJ1ZX0pXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMubW9kZWxDbGFzcy5wcm90b3R5cGUgaW5zdGFuY2VvZiBNb2RlbCl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XS5wdXNoKChuZXcgb3B0aW9ucy5tb2RlbENsYXNzKCkpLmZyb21Kc29uKGRhdGFbanNvblByb3BlcnR5S2V5XSkpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBwbGFpblRvSW5zdGFuY2Uob3B0aW9ucy5tb2RlbENsYXNzLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0sIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy50aW1lc3RhbXApIHtcclxuICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdXNlRW5naW5lKCkuY29udmVydEZyb21UaW1lc3RhbXAoZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIGFuIGFycmF5IG9yIG9iamVjdCB0aGVuIGl0ZXJhdGUgb3ZlciBpdHMgcHJvcGVydGllcywgYW5kIGNvbnZlcnQgZnJvbSBqc29uIHJlY3Vyc2l2ZWx5XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSl7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAvL2lmIHByb3BlcnR5IGlzIG9iamVjdCB0aGVuIHdlIGFzc2lnbiB0aGUgZGF0YSB0byB0aGUgZGVmYXVsdCBwcm9wZXJ0eSB2YWx1ZSwgdXNlciBtaWdodCBuZWVkIGl0XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oT2JqZWN0LmFzc2lnbihhbnlUaGlzW3Byb3BlcnR5S2V5XSwgZGF0YVtqc29uUHJvcGVydHlLZXldKSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vb3RoZXJ3aXNlIHByb3BlcnR5IGlzIGp1c3QgYSBwcm9wZXJ0eSwgc28gd2UgY29udmVydCBpdCBiYXNlZCBvbiBpdHMgdHlwZSBvciBkZWNvcmF0b3JcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBkYXRhW2pzb25Qcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5pZCA9IGRhdGEuaWRcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvbnZlcnRGcm9tSnNvbihyb290OiBBcnJheTxhbnk+fE9iamVjdCk6IGFueXtcclxuICAgICAgY29uc3QganNvbjogYW55ID0gcm9vdCBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fVxyXG4gICAgICBcclxuICAgICAgT2JqZWN0LmtleXMocm9vdCkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgQXJyYXkgfHwgKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgT2JqZWN0KVxyXG4gICAgICAgICAgKGpzb24gYXMgYW55KVtrZXldID0gdGhpcy5jb252ZXJ0RnJvbUpzb24oKHJvb3QgYXMgYW55KVtrZXldKVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIChqc29uIGFzIGFueSlba2V5XSA9IChyb290IGFzIGFueSlba2V5XVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxufVxyXG4iXX0=