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
            return await this.engine.saveMany(models);
        }
        catch (error) {
            throw error;
        }
    }
    async save(model) {
        try {
            await model.validate();
            return await this.engine.save(model);
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
    snapshotListener(name, id, routeParams = {}, onRecieve, onError) {
        this.engine.snapshotListener(name, this.getModelsBlueprint(routeParams), id, onRecieve, onError);
    }
    snapshotListenerForModel(name, model, onRecieve, onError) {
        this.engine.snapshotListener(name, model.getBlueprint(), model.id, onRecieve, onError);
    }
    snapshotListenerMany(name, queryParams, routeParams = {}, onRecieve, onError) {
        this.engine.snapshotListenerMany(name, this.getModelsBlueprint(routeParams), queryParams, onRecieve, onError);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yZXBvc2l0b3JpZXMvUmVwb3NpdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLE1BQThCLFVBQVU7SUFRdEMsWUFBWSxNQUF1QjtRQU5uQyxzREFBc0Q7UUFDdEQsMkJBQTJCO1FBQzNCLG9FQUFvRTtRQUNwRSxpQkFBWSxHQUF1QixFQUFFLENBQUE7UUFDckMseUJBQW9CLEdBQXdCLEVBQUUsQ0FBQTtRQUc1QyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtJQUN0QixDQUFDO0lBSU8sV0FBVyxDQUFDLE1BQVc7UUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBRU8sa0JBQWtCLENBQUMsS0FBYSxFQUFFLE1BQVc7UUFDbkQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQTtJQUMzQyxDQUFDO0lBRU8sZUFBZSxDQUFDLEVBQVU7UUFDOUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2hDLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWEsRUFBRSxJQUFTLEVBQUUsY0FBbUIsRUFBRTtRQUM5RCxJQUFJO1lBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBRXRELE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1NBQzFEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxNQUFNLEtBQUssQ0FBQTtTQUNaO0lBQ0gsQ0FBQztJ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QUNmLENBQUM7Q0FDRjtBQXBNRCw2QkFvTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW5naW5lSW50ZXJmYWNlIGZyb20gJ34vZW5naW5lL0VuZ2luZUludGVyZmFjZSdcclxuaW1wb3J0IHsgQmx1ZXByaW50IH0gZnJvbSAnfi9tb2RlbHMvQmx1ZXByaW50J1xyXG5pbXBvcnQgeyBRdWVyeVBhcmFtIH0gZnJvbSAnfi90eXBlcy9xdWVyaWVzL1F1ZXJ5UGFyYW0nXHJcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbHMvTW9kZWwnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBSZXBvc2l0b3J5PFQgZXh0ZW5kcyBNb2RlbD4ge1xyXG4gIGVuZ2luZTogRW5naW5lSW50ZXJmYWNlXHJcbiAgLy9UT0RPIGNhY2hlIHRoZSBlbnRpdGllcyBpbnRvIGxvY2Fsc3RvcmFnZSBpbiBicm93c2VyXHJcbiAgLy9hbmQgaW50byBhIGZpbGUgb24gc2VydmVyXHJcbiAgLy9UT0RPIG9uIGNsaWVudHNpZGUgcmVmcmVzaCB0aGUgY29udGVudCB3aGVuIHJlZnJlc2ggZnJvbSBsaXN0ZW5lcnNcclxuICBjYWNoZWRNb2RlbHM6IHtba2V5OiBzdHJpbmddOiBUfSA9IHt9XHJcbiAgY2FjaGVkU3ViQ29sbGVjdGlvbnM6IHtba2V5OnN0cmluZ106IFRbXX0gPSB7fVxyXG5cclxuICBjb25zdHJ1Y3RvcihlbmdpbmU6IEVuZ2luZUludGVyZmFjZSl7XHJcbiAgICB0aGlzLmVuZ2luZSA9IGVuZ2luZVxyXG4gIH1cclxuXHJcbiAgYWJzdHJhY3QgZ2V0TW9kZWwoKTogVFxyXG5cclxuICBwcml2YXRlIGNhY2hlTW9kZWxzKG1vZGVsczogVFtdKXtcclxuICAgICAgbW9kZWxzLmZvckVhY2gobW9kZWwgPT4ge1xyXG4gICAgICAgIHRoaXMuY2FjaGVkTW9kZWxzW21vZGVsLmlkXSA9IG1vZGVsXHJcbiAgICAgIH0pXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNhY2hlU3ViQ29sbGVjdGlvbihyb3V0ZTogc3RyaW5nLCBtb2RlbHM6IFRbXSl7XHJcbiAgICB0aGlzLmNhY2hlZFN1YkNvbGxlY3Rpb25zW3JvdXRlXSA9IG1vZGVsc1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmaW5kQ2FjaGVkTW9kZWwoaWQ6IHN0cmluZyl7XHJcbiAgICAgIHJldHVybiB0aGlzLmNhY2hlZE1vZGVsc1tpZF1cclxuICB9XHJcblxyXG4gIGFzeW5jIHVwZGF0ZU1hbnkoaWRzOiBzdHJpbmdbXSwgZGF0YTogYW55LCByb3V0ZVBhcmFtczogYW55ID0ge30pe1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcblxyXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUudXBkYXRlTWFueShibHVlcHJpbnQsIGlkcywgZGF0YSlcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIHRocm93IGVycm9yXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGRhdGUoaWQ6IHN0cmluZywgZGF0YTogYW55LCByb3V0ZVBhcmFtczogYW55ID0ge30pe1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcblxyXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUudXBkYXRlKGJsdWVwcmludCwgaWQsIGRhdGEpXHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgdGhyb3cgZXJyb3JcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHNhdmVNYW55IChtb2RlbHM6IFRbXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChtb2RlbHMubWFwKG1vZGVsID0+IG1vZGVsLnZhbGlkYXRlKCkpKVxyXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUuc2F2ZU1hbnkobW9kZWxzKVxyXG4gICAgfSBjYXRjaChlcnJvcil7XHJcbiAgICAgIHRocm93IGVycm9yXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBzYXZlIChtb2RlbDogVCk6IFByb21pc2U8VD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgbW9kZWwudmFsaWRhdGUoKVxyXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUuc2F2ZShtb2RlbClcclxuICAgIH0gY2F0Y2goZXJyb3Ipe1xyXG4gICAgICB0aHJvdyBlcnJvclxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgcXVlcnkocXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSwgcm91dGVQYXJhbXM6IGFueSA9IHt9KTogUHJvbWlzZTxUW10+IHtcclxuICAgIGNvbnN0IGJsdWVwcmludCA9IHRoaXMuZ2V0TW9kZWxzQmx1ZXByaW50KHJvdXRlUGFyYW1zKVxyXG4gICAgcmV0dXJuIHRoaXMuZW5naW5lLnF1ZXJ5KGJsdWVwcmludCwgcXVlcnlQYXJhbXMpXHJcbiAgfVxyXG5cclxuICBhc3luYyBxdWVyeUFzR3JvdXAocXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICBjb25zdCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludCgpXHJcbiAgICByZXR1cm4gdGhpcy5lbmdpbmUucXVlcnlBc0dyb3VwKGJsdWVwcmludCwgcXVlcnlQYXJhbXMpXHJcbiAgfVxyXG4gIFxyXG4gIGFzeW5jIGxvYWQgKGlkOiBzdHJpbmcsIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSwgZm9yY2VSZWZyZXNoID0gZmFsc2UpOiBQcm9taXNlPFQ+IHtcclxuICAgIC8vaWYgd2UgaGF2ZSB0aGUgbW9kZWwgaW4gY2FjaGUsIHJldHVybiBpdFxyXG4gICAgaWYoIWZvcmNlUmVmcmVzaCl7IFxyXG4gICAgICBjb25zdCBjYWNoZWRNb2RlbCA9IHRoaXMuZmluZENhY2hlZE1vZGVsKGlkKVxyXG4gICAgICBpZihjYWNoZWRNb2RlbCl7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlZE1vZGVsXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL290aGVyd2lzZSBjcmVhdGUgYSBibHVlcHJpbnQgYW5kIGxvYWQgdGhlIG1vZGVsXHJcbiAgICBsZXQgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcblxyXG4gICAgY29uc3QgbW9kZWwgPSBhd2FpdCB0aGlzLmVuZ2luZS5sb2FkKGJsdWVwcmludCwgaWQpXHJcblxyXG4gICAgLy8gYW5kIGZpbmFsbHkgY2FjaGUgdGhlIG1vZGVsXHJcbiAgICBpZihtb2RlbClcclxuICAgICAgdGhpcy5jYWNoZU1vZGVscyhbbW9kZWxdKVxyXG5cclxuICAgIHJldHVybiBtb2RlbCA/PyBudWxsXHJcbiAgfVxyXG5cclxuICBhc3luYyBsb2FkTWFueShpZHM6IHN0cmluZ1tdLCByb3V0ZVBhcmFtczogYW55ID0ge30sIGZvcmNlUmVmcmVzaCA9IHRydWUpe1xyXG4gICAgaWYoIWlkcy5sZW5ndGgpe1xyXG4gICAgICByZXR1cm4gW11cclxuICAgIH1cclxuICAgIC8vZ2V0IGEgbW9kZWwgYmx1ZXByaW50IGZvciB0aGUgbG9hZGluZ1xyXG4gICAgbGV0IGJsdWVwcmludCA9IHRoaXMuZ2V0TW9kZWxzQmx1ZXByaW50KHJvdXRlUGFyYW1zKVxyXG5cclxuICAgIGNvbnN0IGxvYWRlZE1vZGVsczogeyBbaWQ6IHN0cmluZ106IFQgfSA9IHt9XHJcbiAgICBsZXQgdG9CZUxvYWRlZDogc3RyaW5nW10gPSBbXVxyXG5cclxuICAgIC8vY2hlY2sgaWYgd2UgaGF2ZSBhbGwgdGhlIG1vZGVscyBpbiBjYWNoZSwgaWYgbm90LCB0aGVuIGFkZCB0aGUgaWQgdG8gdGhlIHRvQmVMb2FkZWQgYXJyYXlcclxuICAgIGlmKCFmb3JjZVJlZnJlc2gpe1xyXG4gICAgICBpZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgbGV0IGNhY2hlZE1vZGVsID0gdGhpcy5maW5kQ2FjaGVkTW9kZWwoaWQpXHJcbiAgICAgICAgaWYoY2FjaGVkTW9kZWwpe1xyXG4gICAgICAgICAgbG9hZGVkTW9kZWxzW2lkXSA9IGNhY2hlZE1vZGVsXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRvQmVMb2FkZWQucHVzaChpZClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0b0JlTG9hZGVkID0gaWRzXHJcbiAgICB9XHJcblxyXG4gICAgLy9sb2FkIHRoZSB0b0JlTG9hZGVkIG1vZGVscyBhbmQgcHV0IHRoZW0gaW50byB0aGUgbG9hZGVkTW9kZWxzIG9iamVjdFxyXG4gICAgY29uc3QgbW9kZWxzID0gYXdhaXQgdGhpcy5lbmdpbmUubG9hZE1hbnkoYmx1ZXByaW50LCB0b0JlTG9hZGVkKVxyXG4gICAgbW9kZWxzLmZvckVhY2gobW9kZWwgPT4geyBpZihtb2RlbCkgeyBsb2FkZWRNb2RlbHNbbW9kZWwuaWRdID0gbW9kZWwgfSB9KVxyXG5cclxuICAgIC8vbWFwIHRoZSBsb2FkZWRNb2RlbHMgaW50byBhbiBhcnJheVxyXG4gICAgY29uc3QgcmV0dXJuQXJyYXkgPSBpZHMubWFwKGlkID0+IGxvYWRlZE1vZGVsc1tpZF0pXHJcblxyXG4gICAgLy9jYWNoZSB0aGUgbG9hZGVkIG1vZGVsc1xyXG4gICAgdGhpcy5jYWNoZU1vZGVscyhyZXR1cm5BcnJheSlcclxuXHJcbiAgICAvL3JldHVybiB0aGUgYXJyYXlcclxuICAgIHJldHVybiByZXR1cm5BcnJheVxyXG4gIH1cclxuXHJcbiAgc25hcHNob3RMaXN0ZW5lcihuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcsIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSwgb25SZWNpZXZlOiAoKGVudGl0eTogVCkgPT4gdm9pZCksIG9uRXJyb3I6ICgoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSkge1xyXG4gICAgdGhpcy5lbmdpbmUuc25hcHNob3RMaXN0ZW5lcihuYW1lLCB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcyksIGlkLCBvblJlY2lldmUsIG9uRXJyb3IpXHJcbiAgfVxyXG5cclxuICBzbmFwc2hvdExpc3RlbmVyRm9yTW9kZWwobmFtZTogc3RyaW5nLCBtb2RlbDogVCwgb25SZWNpZXZlOiAoKGVudGl0eTogVCkgPT4gdm9pZCksIG9uRXJyb3I6ICgoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSkge1xyXG4gICAgdGhpcy5lbmdpbmUuc25hcHNob3RMaXN0ZW5lcihuYW1lLCBtb2RlbC5nZXRCbHVlcHJpbnQoKSwgbW9kZWwuaWQsIG9uUmVjaWV2ZSwgb25FcnJvcilcclxuICB9XHJcblxyXG4gIHNuYXBzaG90TGlzdGVuZXJNYW55KG5hbWU6IHN0cmluZywgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSwgcm91dGVQYXJhbXM6IGFueSA9IHt9LCBvblJlY2lldmU6ICgoZW50aXR5OiBUW10pID0+IHZvaWQpLCBvbkVycm9yOiAoKGVycm9yOiBFcnJvcikgPT4gdm9pZCkpIHtcclxuICAgIHRoaXMuZW5naW5lLnNuYXBzaG90TGlzdGVuZXJNYW55KG5hbWUsIHRoaXMuZ2V0TW9kZWxzQmx1ZXByaW50KHJvdXRlUGFyYW1zKSwgcXVlcnlQYXJhbXMsIG9uUmVjaWV2ZSwgb25FcnJvcilcclxuICB9XHJcblxyXG4gIHVuc3Vic2NyaWJlKG5hbWU6IHN0cmluZyl7XHJcbiAgICB0aGlzLmVuZ2luZS51bnN1YnNjcmliZUxpc3RlbmVyKG5hbWUpXHJcbiAgfVxyXG5cclxuICBoYXNMaXN0ZW5lcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmVuZ2luZS5oYXNMaXN0ZW5lcihuYW1lKVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgZGVsZXRlKGlkOiBzdHJpbmcsIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUuZGVsZXRlKGJsdWVwcmludCwgaWQpXHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxldGVNb2RlbChtb2RlbDogVCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZW5naW5lLmRlbGV0ZShtb2RlbC5nZXRCbHVlcHJpbnQoKSwgbW9kZWwuaWQpXHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxldGVNYW55KGlkczogc3RyaW5nW10sIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgYmx1ZXByaW50ID0gdGhpcy5nZXRNb2RlbHNCbHVlcHJpbnQocm91dGVQYXJhbXMpXHJcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5lbmdpbmUuZGVsZXRlTWFueShibHVlcHJpbnQsIGlkcylcclxuICB9XHJcblxyXG5cclxuICBwcml2YXRlIGdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtczogYW55ID0ge30pOiBCbHVlcHJpbnQ8VD4ge1xyXG4gICAgY29uc3QgbW9kZWwgPSB0aGlzLmdldE1vZGVsKCkuZnJvbUpzb24ocm91dGVQYXJhbXMpXHJcbiAgICByZXR1cm4gbW9kZWwuZ2V0Qmx1ZXByaW50KClcclxuICB9XHJcblxyXG4gIGFzeW5jIGxvYWRDb2xsZWN0aW9uKHJvdXRlUGFyYW1zOiBhbnkgPSB7fSwgZm9yY2VSZWZyZXNoID0gdHJ1ZSl7XHJcbiAgICAvL2dldCB0aGUgYmx1ZXByaXRuIGZvciB0aGUgbW9kZWxcclxuICAgIGxldCBibHVlcHJpbnQgPSB0aGlzLmdldE1vZGVsc0JsdWVwcmludChyb3V0ZVBhcmFtcylcclxuICAgIGNvbnN0IHJvdXRlID0gYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKClcclxuICAgIC8vZmluZCB0aGUgc3ViY29sbGVjdGlvbiBpbiB0aGUgY2FjaGUsIGlmIGZvdW5kLCByZXR1cm4gaXRcclxuICAgIGlmKCFmb3JjZVJlZnJlc2gpe1xyXG4gICAgICBjb25zdCBjYWNoZWRTdWJDb2xsZWN0aW9uID0gdGhpcy5jYWNoZWRTdWJDb2xsZWN0aW9uc1tyb3V0ZV1cclxuICAgICAgaWYoY2FjaGVkU3ViQ29sbGVjdGlvbil7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlZFN1YkNvbGxlY3Rpb25cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vb3RoZXJ3aXNlIGxvYWQgdGhlIHN1YmNvbGxlY3Rpb25cclxuICAgIGNvbnN0IG1vZGVscyA9IGF3YWl0IHRoaXMuZW5naW5lLmxvYWRDb2xsZWN0aW9uKGJsdWVwcmludClcclxuXHJcbiAgICAvL2FuZCBjYWNoZSB0aGUgc3ViY29sbGVjdGlvblxyXG4gICAgdGhpcy5jYWNoZVN1YkNvbGxlY3Rpb24ocm91dGUsIG1vZGVscylcclxuXHJcbiAgICByZXR1cm4gbW9kZWxzXHJcbiAgfVxyXG59XHJcbiJdfQ==