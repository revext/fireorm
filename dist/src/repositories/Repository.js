"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Repository {
    constructor(engine) {
        //TODO cache the entities into localstorage in browser
        //and into a file on server
        //TODO on clientside refresh the content when refresh from listeners
        this.cachedModels = {};
        this.cachedSubCollections = {};
        this.engine = engine;
    }
    cacheModels(models) {
        models.forEach(model => {
            this.cachedModels[model.id] = model;
        });
    }
    cacheSubCollection(route, models) {
        this.cachedSubCollections[route] = models;
    }
    findCachedModel(id) {
        return this.cachedModels[id];
    }
    async updateMany(ids, data, routeParams = {}) {
        try {
            const blueprint = this.getModelsBlueprint(routeParams);
            return await this.engine.updateMany(blueprint, ids, data);
        }
        catch (error) {
            throw error;
        }
    }
    async update(id, data, routeParams = {}) {
        try {
            const blueprint = this.getModelsBlueprint(routeParams);
            return await this.engine.update(blueprint, id, data);
        }
        catch (error) {
            throw error;
        }
    }
    async saveMany(models) {
        try {
            await Promise.all(models.map(model => model.validate()));
            return this.engine.saveMany(models);
        }
        catch (error) {
            throw error;
        }
    }
    async save(model) {
        try {
            await model.validate();
            return this.engine.save(model);
        }
        catch (error) {
            throw error;
        }
    }
    async query(queryParams, routeParams = {}) {
        const blueprint = this.getModelsBlueprint(routeParams);
        return this.engine.query(blueprint, queryParams);
    }
    async queryAsGroup(queryParams) {
        const blueprint = this.getModelsBlueprint();
        return this.engine.queryAsGroup(blueprint, queryParams);
    }
    async load(id, routeParams = {}, forceRefresh = false) {
        //if we have the model in cache, return it
        if (!forceRefresh) {
            const cachedModel = this.findCachedModel(id);
            if (cachedModel) {
                return cachedModel;
            }
        }
        //otherwise create a blueprint and load the model
        let blueprint = this.getModelsBlueprint(routeParams);
        const model = await this.engine.load(blueprint, id);
        // and finally cache the model
        if (model)
            this.cacheModels([model]);
        return model !== null && model !== void 0 ? model : null;
    }
    async loadMany(ids, routeParams = {}, forceRefresh = true) {
        if (!ids.length) {
            return [];
        }
        //get a model blueprint for the loading
        let blueprint = this.getModelsBlueprint(routeParams);
        const loadedModels = {};
        let toBeLoaded = [];
        //check if we have all the models in cache, if not, then add the id to the toBeLoaded array
        if (!forceRefresh) {
            ids.forEach(id => {
                let cachedModel = this.findCachedModel(id);
                if (cachedModel) {
                    loadedModels[id] = cachedModel;
                }
                else {
                    toBeLoaded.push(id);
                }
            });
        }
        else {
            toBeLoaded = ids;
        }
        //load the toBeLoaded models and put them into the loadedModels object
        const models = await this.engine.loadMany(blueprint, toBeLoaded);
        models.forEach(model => { if (model) {
            loadedModels[model.id] = model;
        } });
        //map the loadedModels into an array
        const returnArray = ids.map(id => loadedModels[id]);
        //cache the loaded models
        this.cacheModels(returnArray);
        //return the array
        return returnArray;
    }
    snapshotListener(name, id, routeParams = {}, onRecieve) {
        this.engine.snapshotListener(name, this.getModelsBlueprint(routeParams), id, onRecieve);
    }
    snapshotListenerForModel(name, model, onRecieve) {
        this.engine.snapshotListener(name, model.getBlueprint(), model.id, onRecieve);
    }
    snapshotListenerMany(name, queryParams, routeParams = {}, onRecieve) {
        this.engine.snapshotListenerMany(name, this.getModelsBlueprint(routeParams), queryParams, onRecieve);
    }
    unsubscribe(name) {
        this.engine.unsubscribeListener(name);
    }
    hasListener(name) {
        return this.engine.hasListener(name);
    }
    async delete(id, routeParams = {}) {
        const blueprint = this.getModelsBlueprint(routeParams);
        return await this.engine.delete(blueprint, id);
    }
    async deleteModel(model) {
        return await this.engine.delete(model.getBlueprint(), model.id);
    }
    async deleteMany(ids, routeParams = {}) {
        const blueprint = this.getModelsBlueprint(routeParams);
        return await this.engine.deleteMany(blueprint, ids);
    }
    getModelsBlueprint(routeParams = {}) {
        const model = this.getModel().fromJson(routeParams);
        return model.getBlueprint();
    }
    async loadCollection(routeParams = {}, forceRefresh = true) {
        //get the bluepritn for the model
        let blueprint = this.getModelsBlueprint(routeParams);
        const route = blueprint.buildCollectionRoute();
        //find the subcollection in the cache, if found, return it
        if (!forceRefresh) {
            const cachedSubCollection = this.cachedSubCollections[route];
            if (cachedSubCollection) {
                return cachedSubCollection;
            }
        }
        //otherwise load the subcollection
        const models = await this.engine.loadCollection(blueprint);
        //and cache the subcollection
        this.cacheSubCollection(route, models);
        return models;
    }
}
exports.default = Repository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLE1BQThCLFVBQVU7SUFRdEMsWUFBWSxNQUF1QjtRQU5uQyxzREFBc0Q7UUFDdEQsMkJBQTJCO1FBQzNCLG9FQUFvRTtRQUNwRSxpQkFBWSxHQUF1QixFQUFFLENBQUE7UUFDckMseUJBQW9CLEdBQXdCLEVBQUUsQ0FBQTtRQUc1QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtJQUN0QixDQUFDO0lBSU8sV0FBVyxDQUFDLE1BQVc7UUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBRU8sa0JBQWtCLENBQUMsS0FBYSxFQUFFLE1BQVc7UUFDbkQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQTtJQUMzQyxDQUFDO0lBRU8sZUFBZSxDQUFDLEVBQVU7UUFDOUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2hDLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWEsRUFBRSxJQUFTLEVBQUUsY0FBbUIsRUFBRTtRQUM5RCxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBRXRELE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1NBQzFEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxNQUFNLEtBQUssQ0FBQTtTQUNaO0lBQ0gsQ0FBQztJ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bSAnfi9lbmdpbmUvRW5naW5lSW50ZXJmYWNlJ1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tICd+L21vZGVscy9CbHVlcHJpbnQnXHJcbmltcG9ydCB7IFF1ZXJ5UGFyYW0gfSBmcm9tICd+L3R5cGVzL3F1ZXJpZXMvUXVlcnlQYXJhbSdcclxuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVscy9Nb2RlbCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIFJlcG9zaXRvcnk8VCBleHRlbmRzIE1vZGVsPiB7XHJcbiAgZW5naW5lOiBFbmdpbmVJbnRlcmZhY2VcclxuICAvL1RPRE8gY2FjaGUgdGhlIGVudGl0aWVzIGludG8gbG9jYWxzdG9yYWdlIGluIGJyb3dzZXJcclxuICAvL2FuZCBpbnRvIGEgZmlsZSBvbiBzZXJ2ZXJcclxuICAvL1RPRE8gb24gY2xpZW50c2lkZSByZWZyZXNoIHRoZSBjb250ZW50IHdoZW4gcmVmcmVzaCBmcm9tIGxpc3RlbmVyc1xyXG4gIGNhY2hlZE1vZGVsczoge1trZXk6IHN0cmluZ106IFR9ID0ge31cclxuICBjYWNoZWRTdWJDb2xsZWN0aW9uczoge1trZXk6c3RyaW5nXTogVFtdfSA9IHt9XHJcblxyXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lSW50ZXJmYWNlKXtcclxuICAgIHRoaXMuZW5naW5lID0gZW5naW5lXHJcbiAgfVxyXG5cclxuICBhYnN0cmFjdCBnZXRNb2RlbCgpOiBUXHJcblxyXG4gIHByaXZhdGUgY2FjaGVNb2RlbHMobW9kZWxzOiBUW10pe1xyXG4gICAgICBtb2RlbHMuZm9yRWFjaChtb2RlbCA9PiB7XHJcbiAgICAgICAgdGhpcy5jYWNoZWRNb2RlbHNbbW9kZWwuaWRdID0gbW9kZWxcclxuICAgICAgfSlcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY2FjaGVTdWJDb2xsZWN0aW9uKHJvdXRlOiBzdHJpbmcsIG1vZGVsczogVFtdKXtcclxuICAgIHRoaXMuY2FjaGVkU3ViQ29sbGVjdGlvbnNbcm91dGVdID0gbW9kZWxzXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGZpbmRDYWNoZWRNb2RlbChpZDogc3RyaW5nKXtcclxuICAgICAgcmV0dXJuIHRoaXMuY2FjaGVkTW9kZWxzW2lkXVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlTWFueShpZHM6IHN0cmluZ1tdLCBkYXRhOiBhbnksIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSl7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuXHJcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVuZ2luZS51cGRhdGVNYW55KGJsdWVwcmludCwgaWRzLCBkYXRhKVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgdGhyb3cgZXJyb3JcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZShpZDogc3RyaW5nLCBkYXRhOiBhbnksIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSl7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuXHJcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVuZ2luZS51cGRhdGUoYmx1ZXByaW50LCBpZCwgZGF0YSlcclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICB0aHJvdyBlcnJvclxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2F2ZU1hbnkgKG1vZGVsczogVFtdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKG1vZGVscy5tYXAobW9kZWwgPT4gbW9kZWwudmFsaWRhdGUoKSkpXHJcbiAgICAgIHJldHVybiB0aGlzLmVuZ2luZS5zYXZlTWFueShtb2RlbHMpXHJcbiAgICB9IGNhdGNoKGVycm9yKXtcclxuICAgICAgdGhyb3cgZXJyb3JcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmUgKG1vZGVsOiBUKTogUHJvbWlzZTxUPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBtb2RlbC52YWxpZGF0ZSgpXHJcbiAgICAgIHJldHVybiB0aGlzLmVuZ2luZS5zYXZlKG1vZGVsKVxyXG4gICAgfSBjYXRjaChlcnJvcil7XHJcbiAgICAgIHRocm93IGVycm9yXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBxdWVyeShxdWVyeVBhcmFtczogUXVlcnlQYXJhbVtdLCByb3V0ZVBhcmFtczogYW55ID0ge30pOiBQcm9taXNlPFRbXT4ge1xyXG4gICAgY29uc3QgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcbiAgICByZXR1cm4gdGhpcy5lbmdpbmUucXVlcnkoYmx1ZXByaW50LCBxdWVyeVBhcmFtcylcclxuICB9XHJcblxyXG4gIGFzeW5jIHF1ZXJ5QXNHcm91cChxdWVyeVBhcmFtczogUXVlcnlQYXJhbVtdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIGNvbnN0IGJsdWVwcmludCA9IHRoaXMuZ2V0TW9kZWxzQmx1ZXByaW50KClcclxuICAgIHJldHVybiB0aGlzLmVuZ2luZS5xdWVyeUFzR3JvdXAoYmx1ZXByaW50LCBxdWVyeVBhcmFtcylcclxuICB9XHJcbiAgXHJcbiAgYXN5bmMgbG9hZCAoaWQ6IHN0cmluZywgcm91dGVQYXJhbXM6IGFueSA9IHt9LCBmb3JjZVJlZnJlc2ggPSBmYWxzZSk6IFByb21pc2U8VD4ge1xyXG4gICAgLy9pZiB3ZSBoYXZlIHRoZSBtb2RlbCBpbiBjYWNoZSwgcmV0dXJuIGl0XHJcbiAgICBpZighZm9yY2VSZWZyZXNoKXsgXHJcbiAgICAgIGNvbnN0IGNhY2hlZE1vZGVsID0gdGhpcy5maW5kQ2FjaGVkTW9kZWwoaWQpXHJcbiAgICAgIGlmKGNhY2hlZE1vZGVsKXtcclxuICAgICAgICByZXR1cm4gY2FjaGVkTW9kZWxcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vb3RoZXJ3aXNlIGNyZWF0ZSBhIGJsdWVwcmludCBhbmQgbG9hZCB0aGUgbW9kZWxcclxuICAgIGxldCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuXHJcbiAgICBjb25zdCBtb2RlbCA9IGF3YWl0IHRoaXMuZW5naW5lLmxvYWQoYmx1ZXByaW50LCBpZClcclxuXHJcbiAgICAvLyBhbmQgZmluYWxseSBjYWNoZSB0aGUgbW9kZWxcclxuICAgIGlmKG1vZGVsKVxyXG4gICAgICB0aGlzLmNhY2hlTW9kZWxzKFttb2RlbF0pXHJcblxyXG4gICAgcmV0dXJuIG1vZGVsID8/IG51bGxcclxuICB9XHJcblxyXG4gIGFzeW5jIGxvYWRNYW55KGlkczogc3RyaW5nW10sIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSwgZm9yY2VSZWZyZXNoID0gdHJ1ZSl7XHJcbiAgICBpZighaWRzLmxlbmd0aCl7XHJcbiAgICAgIHJldHVybiBbXVxyXG4gICAgfVxyXG4gICAgLy9nZXQgYSBtb2RlbCBibHVlcHJpbnQgZm9yIHRoZSBsb2FkaW5nXHJcbiAgICBsZXQgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcblxyXG4gICAgY29uc3QgbG9hZGVkTW9kZWxzOiB7IFtpZDogc3RyaW5nXTogVCB9ID0ge31cclxuICAgIGxldCB0b0JlTG9hZGVkOiBzdHJpbmdbXSA9IFtdXHJcblxyXG4gICAgLy9jaGVjayBpZiB3ZSBoYXZlIGFsbCB0aGUgbW9kZWxzIGluIGNhY2hlLCBpZiBub3QsIHRoZW4gYWRkIHRoZSBpZCB0byB0aGUgdG9CZUxvYWRlZCBhcnJheVxyXG4gICAgaWYoIWZvcmNlUmVmcmVzaCl7XHJcbiAgICAgIGlkcy5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgICBsZXQgY2FjaGVkTW9kZWwgPSB0aGlzLmZpbmRDYWNoZWRNb2RlbChpZClcclxuICAgICAgICBpZihjYWNoZWRNb2RlbCl7XHJcbiAgICAgICAgICBsb2FkZWRNb2RlbHNbaWRdID0gY2FjaGVkTW9kZWxcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdG9CZUxvYWRlZC5wdXNoKGlkKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRvQmVMb2FkZWQgPSBpZHNcclxuICAgIH1cclxuXHJcbiAgICAvL2xvYWQgdGhlIHRvQmVMb2FkZWQgbW9kZWxzIGFuZCBwdXQgdGhlbSBpbnRvIHRoZSBsb2FkZWRNb2RlbHMgb2JqZWN0XHJcbiAgICBjb25zdCBtb2RlbHMgPSBhd2FpdCB0aGlzLmVuZ2luZS5sb2FkTWFueShibHVlcHJpbnQsIHRvQmVMb2FkZWQpXHJcbiAgICBtb2RlbHMuZm9yRWFjaChtb2RlbCA9PiB7IGlmKG1vZGVsKSB7IGxvYWRlZE1vZGVsc1ttb2RlbC5pZF0gPSBtb2RlbCB9IH0pXHJcblxyXG4gICAgLy9tYXAgdGhlIGxvYWRlZE1vZGVscyBpbnRvIGFuIGFycmF5XHJcbiAgICBjb25zdCByZXR1cm5BcnJheSA9IGlkcy5tYXAoaWQgPT4gbG9hZGVkTW9kZWxzW2lkXSlcclxuXHJcbiAgICAvL2NhY2hlIHRoZSBsb2FkZWQgbW9kZWxzXHJcbiAgICB0aGlzLmNhY2hlTW9kZWxzKHJldHVybkFycmF5KVxyXG5cclxuICAgIC8vcmV0dXJuIHRoZSBhcnJheVxyXG4gICAgcmV0dXJuIHJldHVybkFycmF5XHJcbiAgfVxyXG5cclxuICBzbmFwc2hvdExpc3RlbmVyKG5hbWU6IHN0cmluZywgaWQ6IHN0cmluZywgcm91dGVQYXJhbXM6IGFueSA9IHt9LCBvblJlY2lldmU6ICgoZW50aXR5OiBUKSA9PiB2b2lkKSkge1xyXG4gICAgdGhpcy5lbmdpbmUuc25hcHNob3RMaXN0ZW5lcihuYW1lLCB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcyksIGlkLCBvblJlY2lldmUpXHJcbiAgfVxyXG5cclxuICBzbmFwc2hvdExpc3RlbmVyRm9yTW9kZWwobmFtZTogc3RyaW5nLCBtb2RlbDogVCwgb25SZWNpZXZlOiAoKGVudGl0eTogVCkgPT4gdm9pZCkpIHtcclxuICAgIHRoaXMuZW5naW5lLnNuYXBzaG90TGlzdGVuZXIobmFtZSwgbW9kZWwuZ2V0Qmx1ZXByaW50KCksIG1vZGVsLmlkLCBvblJlY2lldmUpXHJcbiAgfVxyXG5cclxuICBzbmFwc2hvdExpc3RlbmVyTWFueShuYW1lOiBzdHJpbmcsIHF1ZXJ5UGFyYW1zOiBRdWVyeVBhcmFtW10sIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSwgb25SZWNpZXZlOiAoKGVudGl0eTogVFtdKSA9PiB2b2lkKSkge1xyXG4gICAgdGhpcy5lbmdpbmUuc25hcHNob3RMaXN0ZW5lck1hbnkobmFtZSwgdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpLCBxdWVyeVBhcmFtcywgb25SZWNpZXZlKVxyXG4gIH1cclxuXHJcbiAgdW5zdWJzY3JpYmUobmFtZTogc3RyaW5nKXtcclxuICAgIHRoaXMuZW5naW5lLnVuc3Vic2NyaWJlTGlzdGVuZXIobmFtZSlcclxuICB9XHJcblxyXG4gIGhhc0xpc3RlbmVyKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLmhhc0xpc3RlbmVyKG5hbWUpXHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZywgcm91dGVQYXJhbXM6IGFueSA9IHt9KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuICAgIHJldHVybiBhd2FpdCB0aGlzLmVuZ2luZS5kZWxldGUoYmx1ZXByaW50LCBpZClcclxuICB9XHJcblxyXG4gIGFzeW5jIGRlbGV0ZU1vZGVsKG1vZGVsOiBUKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUuZGVsZXRlKG1vZGVsLmdldEJsdWVwcmludCgpLCBtb2RlbC5pZClcclxuICB9XHJcblxyXG4gIGFzeW5jIGRlbGV0ZU1hbnkoaWRzOiBzdHJpbmdbXSwgcm91dGVQYXJhbXM6IGFueSA9IHt9KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuICAgIHJldHVybiBhd2FpdCB0aGlzLmVuZ2luZS5kZWxldGVNYW55KGJsdWVwcmludCwgaWRzKVxyXG4gIH1cclxuXHJcblxyXG4gIHByaXZhdGUgZ2V0TW9kZWxzQmx1ZXByaW50KHJvdXRlUGFyYW1zOiBhbnkgPSB7fSk6IEJsdWVwcmludDxUPiB7XHJcbiAgICBjb25zdCBtb2RlbCA9IHRoaXMuZ2V0TW9kZWwoKS5mcm9tSnNvbihyb3V0ZVBhcmFtcylcclxuICAgIHJldHVybiBtb2RlbC5nZXRCbHVlcHJpbnQoKVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgbG9hZENvbGxlY3Rpb24ocm91dGVQYXJhbXM6IGFueSA9IHt9LCBmb3JjZVJlZnJlc2ggPSB0cnVlKXtcclxuICAgIC8vZ2V0IHRoZSBibHVlcHJpdG4gZm9yIHRoZSBtb2RlbFxyXG4gICAgbGV0IGJsdWVwcmludCA9IHRoaXMuZ2V0TW9kZWxzQmx1ZXByaW50KHJvdXRlUGFyYW1zKVxyXG4gICAgY29uc3Qgcm91dGUgPSBibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKVxyXG4gICAgLy9maW5kIHRoZSBzdWJjb2xsZWN0aW9uIGluIHRoZSBjYWNoZSwgaWYgZm91bmQsIHJldHVybiBpdFxyXG4gICAgaWYoIWZvcmNlUmVmcmVzaCl7XHJcbiAgICAgIGNvbnN0IGNhY2hlZFN1YkNvbGxlY3Rpb24gPSB0aGlzLmNhY2hlZFN1YkNvbGxlY3Rpb25zW3JvdXRlXVxyXG4gICAgICBpZihjYWNoZWRTdWJDb2xsZWN0aW9uKXtcclxuICAgICAgICByZXR1cm4gY2FjaGVkU3ViQ29sbGVjdGlvblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9vdGhlcndpc2UgbG9hZCB0aGUgc3ViY29sbGVjdGlvblxyXG4gICAgY29uc3QgbW9kZWxzID0gYXdhaXQgdGhpcy5lbmdpbmUubG9hZENvbGxlY3Rpb24oYmx1ZXByaW50KVxyXG5cclxuICAgIC8vYW5kIGNhY2hlIHRoZSBzdWJjb2xsZWN0aW9uXHJcbiAgICB0aGlzLmNhY2hlU3ViQ29sbGVjdGlvbihyb3V0ZSwgbW9kZWxzKVxyXG5cclxuICAgIHJldHVybiBtb2RlbHNcclxuICB9XHJcbn1cclxuIl19