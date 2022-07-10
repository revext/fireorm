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
    constructor(..._) {
        this.id = null;
        this.relationsLoaded = [];
        this.errors = null;
    }
    init(..._) { return; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsOERBQStDO0FBRS9DLDZEQUErSDtBQUMvSCxzQ0FBc0M7QUFDdEMsa0RBQW1EO0FBS25ELDJDQUF3QztBQUN4QywwQkFBMkI7QUFDM0IseURBQXFFO0FBS3JFLHVGQUF1RjtBQUV2RixNQUE4QixLQUFLO0lBTS9CLFlBQVksR0FBRyxDQUFRO1FBSnZCLE9BQUUsR0FBWSxJQUFJLENBQUE7UUFFbEIsb0JBQWUsR0FBYSxFQUFFLENBQUE7UUFNdEIsV0FBTSxHQUFXLElBQUksQ0FBQTtJQUpILENBQUM7SUFFM0IsSUFBSSxDQUFDLEdBQUcsQ0FBUSxJQUFVLE9BQU0sQ0FBQyxDQUFDO0lBTTFCLFlBQVk7O1FBRWxCLElBQUksS0FBSyxHQUFvQixFQUFFLENBQUE7UUFDL0IsS0FBSSxNQUFNLFdBQVcsSUFBSSxJQUFJLEVBQUM7WUFDNUIsNkNBQTZDO1lBQzdDLElBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBbUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUM7Z0JBQzdELE1BQU0sSUFBSSxHQUFHLE1BQUEsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBbUIsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLG1DQUFJLEVBQXVCLENBQUE7Z0JBRW5HLElBQUcsSUFBSSxZQUFZLFFBQVEsRUFBQztvQkFDMUIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO2lCQUN6QztxQkFBTSxJQUFHLElBQUksWUFBWSxNQUFNLEVBQUM7b0JBQy9CLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtpQkFDbkM7cUJBQU07b0JBQ0wsS0FBSyxDQUFDLFdB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QUNiLENBQUM7Q0FDSjtBQTVVRztJQURDLElBQUEsU0FBSyxHQUFFOztpQ0FDVTtBQUZ0Qix3QkE4VUMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IFZhbGlkYXRvciwgeyBFcnJvcnMgfSBmcm9tIFwidmFsaWRhdG9yanNcIlxyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwifi9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeVwiO1xyXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWV0YWRhdGFLZXksIGZpZWxkTWV0YWRhdGFLZXksIHJlbGF0aW9uTWV0YWRhdGFLZXksIHZhbGlkYXRlTWV0YWRhdGFLZXkgfSBmcm9tIFwiLi4vZGVjb3JhdG9ycy9NZXRhZGF0YUtleXNcIjtcclxuaW1wb3J0IHsgdXNlRW5naW5lIH0gZnJvbSBcIi4uL2VuZ2luZVwiO1xyXG5pbXBvcnQgeyBnZXRSZXBvc2l0b3J5Rm9yIH0gZnJvbSBcIi4uL3JlcG9zaXRvcmllc1wiO1xyXG5pbXBvcnQgeyBIYXNNYW55UmVsYXRpb25Db25maWcsIFJlbGF0aW9uQ29uZmlnV2l0aFR5cGUgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIi4uL3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIi4uL3R5cGVzL2NvbmZpZ3MvRmllbGRDb25maWdcIjtcclxuaW1wb3J0IHsgVmFsaWRhdGVDb25maWcgfSBmcm9tIFwiLi4vdHlwZXMvY29uZmlncy9WYWxpZGF0ZUNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tIFwiLi9CbHVlcHJpbnRcIjtcclxuaW1wb3J0IHsgRmllbGQgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgaW5zdGFuY2VUb1BsYWluLCBwbGFpblRvSW5zdGFuY2UgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBQYXJhbXNPYmplY3QgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xyXG5cclxuLy9UT0RPIGV2ZW50cyBiZWZvcmUgZGVsZXRlLCBhZnRlciBkZWxldCwgYmVmb3JlIGxvYWQsIGJlZm9yZS1hZnRlciBzYXZlLCB1cGRhdGUgZXRjLi4uXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBNb2RlbCB7XHJcbiAgICBARmllbGQoKVxyXG4gICAgaWQ/OiBzdHJpbmcgPSBudWxsXHJcblxyXG4gICAgcmVsYXRpb25zTG9hZGVkOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgY29uc3RydWN0b3IoLi4uXzogYW55W10pIHt9XHJcblxyXG4gICAgaW5pdCguLi5fOiBhbnlbXSk6IHZvaWQgeyByZXR1cm4gfVxyXG5cclxuICAgIHByaXZhdGUgZXJyb3JzOiBFcnJvcnMgPSBudWxsXHJcblxyXG4gICAgYWJzdHJhY3QgZ2V0TW9kZWxOYW1lKCk6IHN0cmluZ1xyXG5cclxuICAgIHByaXZhdGUgY29sbGVjdFJ1bGVzPFQ+KCk6IFZhbGlkYXRvci5SdWxlcyB7XHJcbiAgICAgIFxyXG4gICAgICBsZXQgcnVsZXM6IFZhbGlkYXRvci5SdWxlcyA9IHt9XHJcbiAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKXtcclxuICAgICAgICAvL1RPRE8gcmVjdXJzaXZlIHZhbGlkYXRpb24gb24gcmVsYXRlZCBtb2RlbHNcclxuICAgICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKHZhbGlkYXRlTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICBjb25zdCBydWxlID0gUmVmbGVjdC5nZXRNZXRhZGF0YSh2YWxpZGF0ZU1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30gYXMgVmFsaWRhdGVDb25maWc8VD5cclxuXHJcbiAgICAgICAgICBpZihydWxlIGluc3RhbmNlb2YgRnVuY3Rpb24pe1xyXG4gICAgICAgICAgICBydWxlcyA9IE9iamVjdC5hc3NpZ24ocnVsZXMsIHJ1bGUodGhpcykpXHJcbiAgICAgICAgICB9IGVsc2UgaWYocnVsZSBpbnN0YW5jZW9mIE9iamVjdCl7XHJcbiAgICAgICAgICAgIHJ1bGVzID0gT2JqZWN0LmFzc2lnbihydWxlcywgcnVsZSlcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJ1bGVzW3Byb3BlcnR5S2V5XSA9IHJ1bGVcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJ1bGVzXHJcbiAgICB9XHJcblxyXG4gICAgdmFsaWRhdGUgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5jb2xsZWN0UnVsZXMoKVxyXG4gICAgICAgIGxldCB2YWxpZGF0b3IgPSBuZXcgVmFsaWRhdG9yKHRoaXMgYXMgYW55LCBydWxlcylcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkYXRvci5oYXNBc3luYykge1xyXG4gICAgICAgICAgdmFsaWRhdG9yLmNoZWNrQXN5bmMocmVzb2x2ZSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcclxuICAgICAgICAgICAgcmVqZWN0KClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICh2YWxpZGF0b3IuY2hlY2soKSkge1xyXG4gICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xyXG4gICAgICAgICAgICByZWplY3QoKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBoYXNFcnJvcnMgKCk6IGJvb2xlYW4ge1xyXG4gICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5lcnJvcnMgPz8ge30pLmxlbmd0aCA+IDBcclxuICAgIH1cclxuXHJcbiAgICBnZXRBbGxFcnJvcnMgKCk6IFZhbGlkYXRvci5WYWxpZGF0aW9uRXJyb3JzIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5hbGwoKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEVycm9ycyAobmFtZTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB8IGZhbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZXJyb3JzPy5nZXQobmFtZSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvciAobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgZmFsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5lcnJvcnM/LmZpcnN0KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZE1hbnkocmVsYXRpb25OYW1lczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+e1xyXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdXHJcbiAgICAgIGZvcihjb25zdCByZWxhdGlvbiBpbiByZWxhdGlvbk5hbWVzKXtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMubG9hZChyZWxhdGlvbk5hbWVzW3JlbGF0aW9uXSkpXHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZChyZWxhdGlvbk5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICBsZXQgZm91bmQgPSBmYWxzZVxyXG4gICAgICBjb25zdCBhbnlUaGlzID0gdGhpcyBhcyBhbnlcclxuXHJcbiAgICAgIGNvbnN0IHJlbGF0aW9ucyA9IHJlbGF0aW9uTmFtZS5zcGxpdCgnLicpXHJcbiAgICAgIHJlbGF0aW9uTmFtZSA9IHJlbGF0aW9ucy5yZXZlcnNlKCkucG9wKClcclxuXHJcbiAgICAgIGxldCBsb2FkZWRQcm9wZXJ0eSA9IHJlbGF0aW9uTmFtZVxyXG4gICAgICBcclxuICAgICAgaWYoIXRoaXMucmVsYXRpb25zTG9hZGVkLmluY2x1ZGVzKHJlbGF0aW9uTmFtZSkpe1xyXG4gICAgICAgIGNvbnN0IHJvdXRlUGFyYW1zID0gdGhpcy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKVxyXG4gICAgICAgIGZvcihjb25zdCBwcm9wZXJ0eUtleSBpbiB0aGlzKSB7XHJcbiAgICAgICAgICBpZihSZWZsZWN0Lmhhc01ldGFkYXRhKHJlbGF0aW9uTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSl7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKHJlbGF0aW9uTWV0YWRhdGFLZXksIHRoaXMsIHByb3BlcnR5S2V5KSA/PyB7fSBhcyBSZWxhdGlvbkNvbmZpZ1dpdGhUeXBlXHJcbiAgICAgICAgICAgIC8vZ2V0IHRoZSByZXBvc2l0b3J5IGZvciB0aGUgY3VycmVudCBtb2RlbENsYXNzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlcG9zaXRvcnkgPSBnZXRSZXBvc2l0b3J5Rm9yKG9wdGlvbnMubW9kZWxDbGFzcyBhcyBDb25zdHJ1Y3RvckZ1bmN0aW9uPE1vZGVsPikgYXMgUmVwb3NpdG9yeTxNb2RlbD5cclxuICAgICAgICAgICAgaWYoKG9wdGlvbnMubmFtZSAmJiBvcHRpb25zLm5hbWUgPT09IHJlbGF0aW9uTmFtZSkgfHwgcHJvcGVydHlLZXkgPT09IHJlbGF0aW9uTmFtZSkge1xyXG4gICAgICAgICAgICAgIGxvYWRlZFByb3BlcnR5ID0gcHJvcGVydHlLZXlcclxuICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcclxuICAgICAgICAgICAgICBpZihvcHRpb25zLnR5cGUgPT09ICdoYXNNYW55Jyl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNNYW55T3B0aW9ucyA9IG9wdGlvbnMgYXMgSGFzTWFueVJlbGF0aW9uQ29uZmlnXHJcbiAgICAgICAgICAgICAgICBpZighaGFzTWFueU9wdGlvbnMubWFwSWRzICYmICFoYXNNYW55T3B0aW9ucy5yZWxhdGVkSWRzKXtcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBASGFzTWFueSByZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gb24gJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG1pc3NpbmcgJ21hcElkcycgYW5kICdyZWxhdGVkSWRzJy4gT25lIG9mIHRoZW0gbXVzdCBiZSBkZWZpbmVkLmApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihhbnlUaGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRNYW55KChoYXNNYW55T3B0aW9ucy5tYXBJZHMgPyBoYXNNYW55T3B0aW9ucy5tYXBJZHModGhpcykgOiBhbnlUaGlzW2hhc01hbnlPcHRpb25zLnJlbGF0ZWRJZHNdKSwgcm91dGVQYXJhbXMpXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZm9yZWlnblByb3BlcnR5KXtcclxuICAgICAgICAgICAgICAgICAgICBmb3IoY29uc3QgaW5kZXggaW4gYW55VGhpc1twcm9wZXJ0eUtleV0pe1xyXG4gICAgICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV1baW5kZXhdW29wdGlvbnMuZm9yZWlnblByb3BlcnR5XSA9IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVsYXRpb24gJHtyZWxhdGlvbk5hbWV9IHdpdGggJyR7b3B0aW9ucy50eXBlfScgb24gJHtvcHRpb25zLnJlbGF0ZWRJZH0gcHJvcGVydHkgaXMgbm90IGFuIGFycmF5YClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2UgaWYob3B0aW9ucy50eXBlID09PSAnaGFzQ29sbGVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETyBhbiBvcHRpb24gd2hlcmUgdGhlIHJlbGF0ZWQgZGF0YSBjYW4gYmUgJ3BhZ2luYXRlZCdcclxuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcHJvcGVydHkgaXMgYXJyYXksIHRoZW4gbG9hZCB0aGUgc3ViY29sbGVjdGlvbiBpbnRvIGl0XHJcbiAgICAgICAgICAgICAgICBpZihhbnlUaGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5IHx8IGFueVRoaXNbcHJvcGVydHlLZXldID09PSB1bmRlZmluZWQgfHwgYW55VGhpc1twcm9wZXJ0eUtleV0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKGNvbnN0IGluZGV4IGluIGFueVRoaXNbcHJvcGVydHlLZXldKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGFueVRoaXNbcHJvcGVydHlLZXldW2luZGV4XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbGF0aW9uICR7cmVsYXRpb25OYW1lfSB3aXRoICcke29wdGlvbnMudHlwZX0nIG9uICR7cHJvcGVydHlLZXl9IHByb3BlcnR5IGlzIG5vdCBhbiBhcnJheWApXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vbG9hZCBkYXRhIGludG8gdGhlICdwcm9wZXJ0eUtleScgcHJvcGVydHkgb2YgdGhlIG1vZGVsLCB3aGlsZSBsb2FkIHRoZSBtb2RlbCB3aXRoIHRoZSBpZCBmcm9tIHRoZSAncmVsYXRlZElkJyBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSBhd2FpdCByZXBvc2l0b3J5LmxvYWQoKHRoaXMgYXMgYW55KVtvcHRpb25zLnJlbGF0ZWRJZF0sIHJvdXRlUGFyYW1zKVxyXG4gICAgICAgICAgICAgICAgaWYob3B0aW9ucy5mb3JlaWduUHJvcGVydHkpe1xyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XVtvcHRpb25zLmZvcmVpZ25Qcm9wZXJ0eV0gPSB0aGlzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBcclxuICAgICAgICBpZighZm91bmQpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZWxhdGlvbiAke3JlbGF0aW9uTmFtZX0gbm90IGZvdW5kIG9uICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfWApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucmVsYXRpb25zTG9hZGVkLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZihyZWxhdGlvbnMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgLy9yZXZlcnNlIGJhY2sgdGhlIGFycmF5IFxyXG4gICAgICAgIHJlbGF0aW9ucy5yZXZlcnNlKClcclxuICAgICAgICBpZihhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSBpbnN0YW5jZW9mIEFycmF5KXtcclxuICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gW11cclxuICAgICAgICAgIGZvcihjb25zdCBpbmRleCBpbiBhbnlUaGlzW2xvYWRlZFByb3BlcnR5XSl7XHJcbiAgICAgICAgICAgIHByb21pc2VzLnB1c2goYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV1baW5kZXhdLmxvYWQocmVsYXRpb25zLmpvaW4oJy4nKSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXdhaXQgYW55VGhpc1tsb2FkZWRQcm9wZXJ0eV0ubG9hZChyZWxhdGlvbnMuam9pbignLicpKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEJsdWVwcmludDxUIGV4dGVuZHMgTW9kZWw+KHRoaXM6IFQpOiBCbHVlcHJpbnQ8VD4ge1xyXG4gICAgICByZXR1cm4gbmV3IEJsdWVwcmludCh0aGlzLCB0aGlzLmdldFJvdXRlUGFyYW1ldGVyTWFwcGluZygpKVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvdXRlKCk6IHN0cmluZyB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbGxlY3Rpb25NZXRhZGF0YUtleSwgdGhpcy5jb25zdHJ1Y3RvcikgPz8ge31cclxuICAgICAgaWYoIW9wdGlvbnMgfHwgIW9wdGlvbnMucm91dGUpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9wdGlvbnMucm91dGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcoKTogUGFyYW1zT2JqZWN0IHtcclxuICAgICAgY29uc3Qgc2VhcmNoUmVnZXggPSAveyhbXn1dKyl9L2dcclxuICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShjb2xsZWN0aW9uTWV0YWRhdGFLZXksIHRoaXMuY29uc3RydWN0b3IpKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoY29sbGVjdGlvbk1ldGFkYXRhS2V5LCB0aGlzLmNvbnN0cnVjdG9yKSA/PyB7fVxyXG4gICAgICAgIGlmKCFvcHRpb25zIHx8ICFvcHRpb25zLnJvdXRlKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2xhc3MgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGF2ZSBhIHJvdXRlIHBhcmFtZXRlciBvbiB0aGUgQENvbGxlY3Rpb24gYW5ub3RhdGlvbmApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL1RPRE8gaGF2ZSBhIGxvb2sgYXQgdGhlIHdvcmtpbmdzIG9mIHRoaXMgZ2V0Uk91dGVQYXJhbWV0ZXIgYmVjYXVzZSB0aGVyZSBhcmUgc29tZSBzdHJhbmdlIHRoaW5ncyBpbnZvbHZlZFxyXG4gICAgICAgIC8vZ2V0IGV2ZXJ5IHBhcmFtIHdoaWNoIGhhcyBiZWVuIGFubm90YXRlZCBpbiB0aGUgbW9kZWwgd2l0aCAncm91dGVQYXJhbTogdHJ1ZSdcclxuICAgICAgICBjb25zdCBwYXJhbXNPYmplY3Q6IFBhcmFtc09iamVjdCA9IHt9XHJcbiAgICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIEZpZWxkQ29uZmlnXHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zLnJvdXRlUGFyYW0pe1xyXG4gICAgICAgICAgICAgIHBhcmFtc09iamVjdFtvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXldID0gdGhpc1twcm9wZXJ0eUtleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc3QgcGF0aFRlbXBsYXRlID0gb3B0aW9ucy5yb3V0ZVxyXG4gICAgICAgIC8vIGNvbnN0IHBhcmFtcyA9IHNlYXJjaFJlZ2V4LmV4ZWMocGF0aFRlbXBsYXRlKVxyXG5cclxuICAgICAgICAvLyAvLyBjb25zdCByZXR1cm5QYXJhbXM6IHN0cmluZ1tdID0gW11cclxuICAgICAgICAvLyAvL2lmIGhhcyByb3V0ZSBwYXJhbVxyXG4gICAgICAgIC8vIGlmKHBhcmFtcyl7XHJcbiAgICAgICAgLy8gICAvL2NoZWNrIHRvIHNlZSBpZiByb3V0ZSBwYXJhbSBpcyBhIHByb3BlcnR5IG9mIHRoZSBtb2RlbCBhbmQgaXQgaXMgc2V0XHJcbiAgICAgICAgLy8gICBwYXJhbXMuZm9yRWFjaCgocGFyYW0pID0+IHtcclxuICAgICAgICAvLyAgICAgY29uc3QgcGFyYW1TdHJpcCA9IHBhcmFtLnJlcGxhY2UoL1t7fV0vZywgJycpXHJcbiAgICAgICAgLy8gICAgIGlmKCFwYXJhbXNPYmplY3RbcGFyYW1TdHJpcF0pe1xyXG4gICAgICAgIC8vICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVxdWlyZWQgcm91dGUgcGFyYW0gJHtwYXJhbVN0cmlwfSBpcyBub3Qgc2V0IG9uIHRoZSBjbGFzcyAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKVxyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIC8vIGlmKCFyZXR1cm5QYXJhbXMuaW5jbHVkZXMocGFyYW1TdHJpcCkpIHJldHVyblBhcmFtcy5wdXNoKHBhcmFtU3RyaXApXHJcbiAgICAgICAgLy8gICB9KVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcmFtc09iamVjdFxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXNzICR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBpcyBub3QgYW5ub3RhdGVkIHdpdGggQENvbGxlY3Rpb25gKVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRvSnNvbigpOiBhbnkge1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSB7fVxyXG5cclxuICAgICAgZm9yKGNvbnN0IHByb3BlcnR5S2V5IGluIHRoaXMpIHtcclxuICAgICAgICAvLyBpZiBwcm9wZXJ0eSBoYXMgZmllbGQgbWV0YWRhdGEsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgIGlmKFJlZmxlY3QuaGFzTWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpKXtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSAoUmVmbGVjdC5nZXRNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkgPz8ge30pIGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKHRoaXNbcHJvcGVydHlLZXldICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIHByb3BlcnR5IGlzIGEgbW9kZWwsIHRoZW4gd2UgbXVzdCBjb252ZXJ0IGludG8ganNvblxyXG4gICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9ICh0aGlzW3Byb3BlcnR5S2V5XSBhcyB1bmtub3duIGFzIE1vZGVsKS50b0pzb24oKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBpbnRvIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICBpZih0aGlzW3Byb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24odGhpc1twcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXNbcHJvcGVydHlLZXldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBqc29uW2pzb25Qcm9wZXJ0eUtleV0gPSBpbnN0YW5jZVRvUGxhaW4odGhpc1twcm9wZXJ0eUtleV0sIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgIC8vIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vb3RoZXJ3aXNlIHByb3BlcnR5IGlzIGp1c3QgYSBwcm9wZXJ0eSwgc28gd2UgY29udmVydCBpdCBiYXNlZCBvbiBpdHMgdHlwZSBvciBkZWNvcmF0b3JcclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMudGltZXN0YW1wKSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHVzZUVuZ2luZSgpLmNvbnZlcnRUb1RpbWVzdGFtcCgodGhpc1twcm9wZXJ0eUtleV0gYXMgYW55KSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGpzb25banNvblByb3BlcnR5S2V5XSA9IHRoaXNbcHJvcGVydHlLZXldXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAganNvbltqc29uUHJvcGVydHlLZXldID0gbnVsbFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBqc29uLmlkID0gdGhpcy5pZFxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydFRvSnNvbihyb290OiBBcnJheTxhbnk+fE9iamVjdCk6IGFueSB7XHJcbiAgICAgIGNvbnN0IGpzb246IGFueSA9IHJvb3QgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge31cclxuICAgICAgXHJcbiAgICAgIE9iamVjdC5rZXlzKHJvb3QpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgIGlmKChyb290IGFzIGFueSlba2V5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAganNvbltrZXldID0gKHJvb3QgYXMgYW55KVtrZXldLnRvSnNvbigpIFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgQXJyYXkgfHwgKHJvb3QgYXMgYW55KVtrZXldIGluc3RhbmNlb2YgT2JqZWN0KXtcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSB0aGlzLmNvbnZlcnRUb0pzb24oKHJvb3QgYXMgYW55KVtrZXldKVxyXG4gICAgICAgICAgICB9IGVsc2UgeyBcclxuICAgICAgICAgICAgICBqc29uW2tleV0gPSAocm9vdCBhcyBhbnkpW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIGpzb25cclxuICAgIH1cclxuXHJcbiAgICBmcm9tSnNvbihkYXRhOiBhbnkpOiB0aGlzIHtcclxuICAgICAgbGV0IGFueVRoaXMgPSB0aGlzIGFzIGFueVxyXG4gICAgICBmb3IoY29uc3QgcHJvcGVydHlLZXkgaW4gZGF0YSkge1xyXG4gICAgICAgIC8vaWYgcHJvcGVydHkgZXhpc3RzIGluIGRhdGEgYW5kIHByb3BlcnR5IGhhcyBmaWVsZCBtZXRhZGF0YSwgdGhlbiB3ZSBtdXN0IGNvbnZlcnQgZnJvbSBqc29uXHJcbiAgICAgICAgaWYoUmVmbGVjdC5oYXNNZXRhZGF0YShmaWVsZE1ldGFkYXRhS2V5LCB0aGlzLCBwcm9wZXJ0eUtleSkpe1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoZmllbGRNZXRhZGF0YUtleSwgdGhpcywgcHJvcGVydHlLZXkpID8/IHt9IGFzIEZpZWxkQ29uZmlnXHJcbiAgICAgICAgICBjb25zdCBqc29uUHJvcGVydHlLZXkgPSBvcHRpb25zLm5hbWUgPz8gcHJvcGVydHlLZXlcclxuICAgICAgICAgIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSl7XHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnM/Lm1vZGVsQ2xhc3MpIHtcclxuICAgICAgICAgICAgICBpZihkYXRhW2pzb25Qcm9wZXJ0eUtleV0gaW5zdGFuY2VvZiBBcnJheSl7XHJcbiAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0gPSBuZXcgQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgZGF0YVtqc29uUHJvcGVydHlLZXldLmZvckVhY2goKHZhbHVlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYob3B0aW9ucy5tb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgICBhbnlUaGlzW2pzb25Qcm9wZXJ0eUtleV0ucHVzaCgobmV3IG9wdGlvbnMubW9kZWxDbGFzcygpKS5mcm9tSnNvbih2YWx1ZSkpXHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldID0gcGxhaW5Ub0luc3RhbmNlKG9wdGlvbnMubW9kZWxDbGFzcywgdmFsdWUsIHtlbmFibGVDaXJjdWxhckNoZWNrOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYob3B0aW9ucy5tb2RlbENsYXNzLnByb3RvdHlwZSBpbnN0YW5jZW9mIE1vZGVsKXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1tqc29uUHJvcGVydHlLZXldLnB1c2goKG5ldyBvcHRpb25zLm1vZGVsQ2xhc3MoKSkuZnJvbUpzb24oZGF0YVtqc29uUHJvcGVydHlLZXldKSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGFueVRoaXNbanNvblByb3BlcnR5S2V5XSA9IHBsYWluVG9JbnN0YW5jZShvcHRpb25zLm1vZGVsQ2xhc3MsIGRhdGFbanNvblByb3BlcnR5S2V5XSwge2VuYWJsZUNpcmN1bGFyQ2hlY2s6IHRydWV9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpZihvcHRpb25zLnRpbWVzdGFtcCkge1xyXG4gICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB1c2VFbmdpbmUoKS5jb252ZXJ0RnJvbVRpbWVzdGFtcChkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgYW4gYXJyYXkgb3Igb2JqZWN0IHRoZW4gaXRlcmF0ZSBvdmVyIGl0cyBwcm9wZXJ0aWVzLCBhbmQgY29udmVydCBmcm9tIGpzb24gcmVjdXJzaXZlbHlcclxuICAgICAgICAgICAgICAgIGlmKGRhdGFbanNvblByb3BlcnR5S2V5XSBpbnN0YW5jZW9mIEFycmF5KXtcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRGcm9tSnNvbihkYXRhW2pzb25Qcm9wZXJ0eUtleV0pXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZGF0YVtqc29uUHJvcGVydHlLZXldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vaWYgcHJvcGVydHkgaXMgb2JqZWN0IHRoZW4gd2UgYXNzaWduIHRoZSBkYXRhIHRvIHRoZSBkZWZhdWx0IHByb3BlcnR5IHZhbHVlLCB1c2VyIG1pZ2h0IG5lZWQgaXRcclxuICAgICAgICAgICAgICAgICAgYW55VGhpc1twcm9wZXJ0eUtleV0gPSB0aGlzLmNvbnZlcnRGcm9tSnNvbihPYmplY3QuYXNzaWduKGFueVRoaXNbcHJvcGVydHlLZXldLCBkYXRhW2pzb25Qcm9wZXJ0eUtleV0pKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgLy9vdGhlcndpc2UgcHJvcGVydHkgaXMganVzdCBhIHByb3BlcnR5LCBzbyB3ZSBjb252ZXJ0IGl0IGJhc2VkIG9uIGl0cyB0eXBlIG9yIGRlY29yYXRvclxyXG4gICAgICAgICAgICAgICAgICBhbnlUaGlzW3Byb3BlcnR5S2V5XSA9IGRhdGFbanNvblByb3BlcnR5S2V5XVxyXG4gICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLmlkID0gZGF0YS5pZFxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY29udmVydEZyb21Kc29uKHJvb3Q6IEFycmF5PGFueT58T2JqZWN0KTogYW55e1xyXG4gICAgICBjb25zdCBqc29uOiBhbnkgPSByb290IGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9XHJcbiAgICAgIFxyXG4gICAgICBPYmplY3Qua2V5cyhyb290KS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICBpZigocm9vdCBhcyBhbnkpW2tleV0gaW5zdGFuY2VvZiBBcnJheSB8fCAocm9vdCBhcyBhbnkpW2tleV0gaW5zdGFuY2VvZiBPYmplY3QpXHJcbiAgICAgICAgICAoanNvbiBhcyBhbnkpW2tleV0gPSB0aGlzLmNvbnZlcnRGcm9tSnNvbigocm9vdCBhcyBhbnkpW2tleV0pXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgKGpzb24gYXMgYW55KVtrZXldID0gKHJvb3QgYXMgYW55KVtrZXldXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4ganNvblxyXG4gICAgfVxyXG59XHJcbiJdfQ==