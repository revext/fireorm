"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
class ServerEngine {
    constructor(app) {
        this.transaction = null;
        this.batch = null;
        // listeners: { [key: string]: admin.firestore.Su } = {}
        this.inTransaction = false;
        this.app = app;
        this.db = app.firestore();
    }
    save(model) {
        const blueprint = model.getBlueprint();
        return (new Promise((resolve, reject) => {
            try {
                // if model has id, then update firestore document otherwise add firestore document to collection
                if (model.id) {
                    if (this.transaction) {
                        this.transaction.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson(true));
                        resolve(model);
                    }
                    else if (this.batch) {
                        this.batch.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson(true));
                        resolve(model);
                    }
                    else {
                        this.db.collection(blueprint.buildCollectionRoute())
                            .withConverter(this.getConverter(blueprint.constructorFunction))
                            .doc(model.id).set(model).then(() => {
                            resolve(model);
                        });
                    }
                }
                else {
                    if (this.transaction) {
                        const docRef = this.db.collection(blueprint.buildCollectionRoute()).doc();
                        model.id = docRef.id;
                        this.transaction.set(docRef, model.toJson(true));
                        resolve(model);
                    }
                    else if (this.batch) {
                        const docRef = this.db.collection(blueprint.buildCollectionRoute()).doc();
                        model.id = docRef.id;
                        this.batch.set(docRef, model.toJson(true));
                        resolve(model);
                    }
                    else {
                        let docRef = this.db.collection(blueprint.buildCollectionRoute())
                            .withConverter(this.getConverter(blueprint.constructorFunction)).doc();
                        model.id = docRef.id;
                        this.db.collection(blueprint.buildCollectionRoute()).doc(model.id).set(model).then(() => {
                            resolve(model);
                        });
                    }
                }
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    saveMany(models) {
        return (new Promise((resolve, reject) => {
            try {
                const promises = models.map(model => this.save(model));
                Promise.all(promises).then(resolve).catch(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    update(blueprint, id, data) {
        return (new Promise((resolve, reject) => {
            try {
                if (this.transaction) {
                    this.transaction.update(this.db.collection(blueprint.buildCollectionRoute()).doc(id), data);
                    resolve();
                }
                else if (this.batch) {
                    this.batch.update(this.db.collection(blueprint.buildCollectionRoute()).doc(id), data);
                    resolve();
                }
                else {
                    this.db.collection(blueprint.buildCollectionRoute())
                        .withConverter(this.getConverter(blueprint.constructorFunction))
                        .doc(id).update(data).then(() => {
                        resolve();
                    });
                }
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    async updateMany(blueprint, ids, data) {
        return (new Promise((resolve, reject) => {
            try {
                const promises = ids.map(id => this.update(blueprint, id, data));
                Promise.all(promises).then(() => resolve()).catch(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    async load(blueprint, id) {
        if (this.batch) {
            throw new Error('Cannot load in batch');
        }
        const query = this.db.collection(blueprint.buildCollectionRoute()).doc(id)
            .withConverter(this.getConverter(blueprint.constructorFunction));
        if (this.transaction) {
            return (await this.transaction.get(query)).data();
        }
        else {
            return (await query.get()).data();
        }
    }
    async loadMany(blueprint, ids) {
        if (this.batch) {
            throw new Error('Cannot loadMany in batch');
        }
        const docRefs = ids.map(id => this.db.collection(blueprint.buildCollectionRoute())
            .withConverter(this.getConverter(blueprint.constructorFunction)).doc(id));
        if (this.transaction) {
            return (await this.transaction.getAll(...docRefs)).map(d => d.data());
        }
        else {
            return (await this.db.getAll(...docRefs)).map(d => d.data());
        }
    }
    async loadCollection(blueprint) {
        if (this.batch) {
            throw new Error('Cannot loadCollection in batch');
        }
        const query = this.db.collection(blueprint.buildCollectionRoute())
            .withConverter(this.getConverter(blueprint.constructorFunction));
        if (this.transaction) {
            return (await this.transaction.get(query)).docs.map(d => d.data());
        }
        else {
            return (await query.get()).docs.map(d => d.data());
        }
    }
    //TODO other paramters, like limit, startAt, etc...
    async query(blueprint, queryParams) {
        if (this.batch) {
            throw new Error('Cannot query in batch');
        }
        let query = this.db.collection(blueprint.buildCollectionRoute()).withConverter(this.getConverter(blueprint.constructorFunction));
        queryParams.forEach(param => {
            query = query.where(param.field, param.op, param.value);
        });
        if (this.transaction) {
            return (await this.transaction.get(query)).docs.map(d => d.data());
        }
        else {
            return (await query.get()).docs.map(d => d.data());
        }
    }
    async queryAsGroup(blueprint, queryParams) {
        if (this.batch) {
            throw new Error('Cannot queryAsGroup in batch');
        }
        let query = this.db.collectionGroup(blueprint.getSubCollectionName()).withConverter(this.getConverter(blueprint.constructorFunction));
        queryParams.forEach(param => {
            query = query.where(param.field, param.op, param.value);
        });
        if (this.transaction) {
            return (await this.transaction.get(query)).docs.map(d => d.data());
        }
        else {
            return (await query.get()).docs.map(d => d.data());
        }
    }
    snapshotListener(name, blueprint, id, onRecieve, onError = null) {
        throw new Error('Not implemented');
    }
    snapshotListenerMany(name, blueprint, queryParams, onRecieve, onError = null) {
        throw new Error('Not implemented');
    }
    unsubscribeListener(name) {
        throw new Error('Not implemented');
    }
    hasListener(name) {
        throw new Error('Not implemented');
    }
    delete(blueprint, id) {
        return (new Promise((resolve, reject) => {
            try {
                if (this.transaction) {
                    this.transaction.delete(this.db.collection(blueprint.buildCollectionRoute()).doc(id));
                    resolve();
                }
                else if (this.batch) {
                    this.batch.delete(this.db.collection(blueprint.buildCollectionRoute()).doc(id));
                    resolve();
                }
                else {
                    this.db.collection(blueprint.buildCollectionRoute())
                        .withConverter(this.getConverter(blueprint.constructorFunction))
                        .doc(id).delete().then(() => {
                        resolve();
                    });
                }
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    deleteMany(blueprint, ids) {
        return (new Promise((resolve, reject) => {
            try {
                const promises = ids.map(id => this.delete(blueprint, id));
                Promise.all(promises).then(() => resolve()).catch(e => reject(e));
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    convertToTimestamp(date) {
        return firebase_admin_1.default.firestore.Timestamp.fromDate(date);
    }
    convertFromTimestamp(timestamp) {
        return timestamp.toDate();
    }
    getConverter(constructor) {
        return {
            toFirestore(item) {
                return item.toJson(true);
            },
            fromFirestore(snapshot) {
                const data = snapshot.data();
                data.id = snapshot.id;
                return (new constructor()).fromJson(data, true);
            }
        };
    }
    async runTransaction(operations) {
        return new Promise((resolve, reject) => {
            this.db.runTransaction(async (transaction) => {
                this.transaction = transaction;
                // this.transaction.
                return operations();
            }).then((result) => {
                this.transaction = null;
                resolve(result);
            }).catch(e => {
                this.transaction = null;
                reject(e);
            });
        });
    }
    //TODO over 500 operations per transaction check
    async runBatch(operations) {
        return new Promise((resolve, reject) => {
            this.batch = this.db.batch();
            operations().then(() => {
                return this.batch.commit();
            }).then((result) => {
                this.batch = null;
                resolve(result);
            }).catch(e => {
                this.batch = null;
                reject(e);
            });
        });
    }
}
exports.default = ServerEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyRW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2VuZ2luZS9TZXJ2ZXJFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxvRUFBa0M7QUFNbEMsTUFBcUIsWUFBWTtJQVUvQixZQUFZLEdBQWtCO1FBUDlCLGdCQUFXLEdBQWdDLElBQUksQ0FBQTtRQUMvQyxVQUFLLEdBQStCLElBQUksQ0FBQTtRQUV4Qyx3REFBd0Q7UUFFeEQsa0JBQWEsR0FBWSxLQUFLLENBQUE7UUFHNUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDZCxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBRUQsSUFBSSxDQUFrQixLQUFRO1FBQzVCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUN0QyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsSUFBSTtnQkFDRixpR0FBaUc7Z0JBQ2pHLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRTtvQkFDWixJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7d0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7d0JBQzVHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtxQkFDZjt5QkFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7d0JBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMs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QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7Z0JBQ3ZCLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNqQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7Z0JBQ3ZCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNYLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFFSixDQUFDO0lBRUQsZ0RBQWdEO0lBQ2hELEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBaUM7UUFDOUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDNUIsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDckIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBQzVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtnQkFDakIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2pCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDWCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtnQkFDakIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ1gsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7Q0FHRjtBQXpTRCwrQkF5U0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTW9kZWwgZnJvbSAnfi9tb2RlbHMvTW9kZWwnO1xyXG5pbXBvcnQgYWRtaW4gZnJvbSAnZmlyZWJhc2UtYWRtaW4nXHJcbmltcG9ydCBFbmdpbmVJbnRlcmZhY2UgZnJvbSBcIn4vZW5naW5lL0VuZ2luZUludGVyZmFjZVwiO1xyXG5pbXBvcnQgeyBRdWVyeVBhcmFtIH0gZnJvbSAnfi90eXBlcy9xdWVyaWVzL1F1ZXJ5UGFyYW0nO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tICd+L21vZGVscy9CbHVlcHJpbnQnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSAnfi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2ZXJFbmdpbmUgaW1wbGVtZW50cyBFbmdpbmVJbnRlcmZhY2Uge1xyXG4gIGFwcDogYWRtaW4uYXBwLkFwcFxyXG4gIGRiOiBhZG1pbi5maXJlc3RvcmUuRmlyZXN0b3JlXHJcbiAgdHJhbnNhY3Rpb246IGFkbWluLmZpcmVzdG9yZS5UcmFuc2FjdGlvbiA9IG51bGxcclxuICBiYXRjaDogYWRtaW4uZmlyZXN0b3JlLldyaXRlQmF0Y2ggPSBudWxsXHJcblxyXG4gIC8vIGxpc3RlbmVyczogeyBba2V5OiBzdHJpbmddOiBhZG1pbi5maXJlc3RvcmUuU3UgfSA9IHt9XHJcblxyXG4gIGluVHJhbnNhY3Rpb246IGJvb2xlYW4gPSBmYWxzZVxyXG5cclxuICBjb25zdHJ1Y3RvcihhcHA6IGFkbWluLmFwcC5BcHApIHtcclxuICAgIHRoaXMuYXBwID0gYXBwXHJcbiAgICB0aGlzLmRiID0gYXBwLmZpcmVzdG9yZSgpXHJcbiAgfVxyXG5cclxuICBzYXZlPFQgZXh0ZW5kcyBNb2RlbD4obW9kZWw6IFQpOiBQcm9taXNlPFQ+IHtcclxuICAgIGNvbnN0IGJsdWVwcmludCA9IG1vZGVsLmdldEJsdWVwcmludCgpXHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBpZiBtb2RlbCBoYXMgaWQsIHRoZW4gdXBkYXRlIGZpcmVzdG9yZSBkb2N1bWVudCBvdGhlcndpc2UgYWRkIGZpcmVzdG9yZSBkb2N1bWVudCB0byBjb2xsZWN0aW9uXHJcbiAgICAgICAgaWYgKG1vZGVsLmlkKSB7XHJcbiAgICAgICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zZXQodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MobW9kZWwuaWQpLCBtb2RlbC50b0pzb24odHJ1ZSkpXHJcbiAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICB9IGVsc2UgaWYodGhpcy5iYXRjaCl7XHJcbiAgICAgICAgICAgIHRoaXMuYmF0Y2guc2V0KHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKG1vZGVsLmlkKSwgbW9kZWwudG9Kc29uKHRydWUpKVxyXG4gICAgICAgICAgICByZXNvbHZlKG1vZGVsKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAgICAgICAgIC53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuICAgICAgICAgICAgICAuZG9jKG1vZGVsLmlkKS5zZXQobW9kZWwpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICAgICAgY29uc3QgZG9jUmVmID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoKVxyXG4gICAgICAgICAgICBtb2RlbC5pZCA9IGRvY1JlZi5pZFxyXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9uLnNldChkb2NSZWYsIG1vZGVsLnRvSnNvbih0cnVlKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICAgICAgY29uc3QgZG9jUmVmID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoKVxyXG4gICAgICAgICAgICBtb2RlbC5pZCA9IGRvY1JlZi5pZFxyXG4gICAgICAgICAgICB0aGlzLmJhdGNoLnNldChkb2NSZWYsIG1vZGVsLnRvSnNvbih0cnVlKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkb2NSZWYgPSB0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpXHJcbiAgICAgICAgICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKS5kb2MoKVxyXG4gICAgICAgICAgICBtb2RlbC5pZCA9IGRvY1JlZi5pZFxyXG4gICAgICAgICAgICB0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhtb2RlbC5pZCkuc2V0KG1vZGVsKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG4gIHNhdmVNYW55PFQgZXh0ZW5kcyBNb2RlbD4obW9kZWxzOiBUW10pOiBQcm9taXNlPFRbXT4ge1xyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBtb2RlbHMubWFwKG1vZGVsID0+IHRoaXMuc2F2ZShtb2RlbCkpXHJcbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2goZSA9PiByZWplY3QoZSkpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG4gIHVwZGF0ZTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZDogc3RyaW5nLCBkYXRhOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiAobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi51cGRhdGUodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoaWQpLCBkYXRhKVxyXG4gICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICAgICAgdGhpcy5iYXRjaC51cGRhdGUodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoaWQpLCBkYXRhKVxyXG4gICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKVxyXG4gICAgICAgICAgICAuZG9jKGlkKS51cGRhdGUoZGF0YSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGRhdGVNYW55PFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkczogc3RyaW5nW10sIGRhdGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBpZHMubWFwKGlkID0+IHRoaXMudXBkYXRlKGJsdWVwcmludCwgaWQsIGRhdGEpKVxyXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHJlc29sdmUoKSkuY2F0Y2goZSA9PiByZWplY3QoZSkpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG5cclxuICBhc3luYyBsb2FkPFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBsb2FkIGluIGJhdGNoJylcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgIFxyXG5cclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZGF0YSgpIGFzIFRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZ2V0KCkpLmRhdGEoKSBhcyBUXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBsb2FkTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBsb2FkTWFueSBpbiBiYXRjaCcpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZG9jUmVmcyA9IGlkcy5tYXAoaWQgPT4gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpLmRvYyhpZCkpXHJcblxyXG4gICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy50cmFuc2FjdGlvbi5nZXRBbGwoLi4uZG9jUmVmcykpLm1hcChkID0+IGQuZGF0YSgpIGFzIFQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuZGIuZ2V0QWxsKC4uLmRvY1JlZnMpKS5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgbG9hZENvbGxlY3Rpb248VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPik6IFByb21pc2U8VFtdPiB7XHJcbiAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbG9hZENvbGxlY3Rpb24gaW4gYmF0Y2gnKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICBcclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIG90aGVyIHBhcmFtdGVycywgbGlrZSBsaW1pdCwgc3RhcnRBdCwgZXRjLi4uXHJcbiAgYXN5bmMgcXVlcnk8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHF1ZXJ5IGluIGJhdGNoJylcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuXHJcbiAgICAgIHF1ZXJ5UGFyYW1zLmZvckVhY2gocGFyYW0gPT4ge1xyXG4gICAgICAgIHF1ZXJ5ID0gcXVlcnkud2hlcmUocGFyYW0uZmllbGQsIHBhcmFtLm9wLCBwYXJhbS52YWx1ZSkgYXMgYW55XHJcbiAgICAgIH0pXHJcbiAgXHJcbiAgICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy50cmFuc2FjdGlvbi5nZXQocXVlcnkpKS5kb2NzLm1hcChkID0+IGQuZGF0YSgpIGFzIFQpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgICB9XHJcbiAgICAgICBcclxuICB9XHJcblxyXG4gIGFzeW5jIHF1ZXJ5QXNHcm91cDxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBxdWVyeVBhcmFtczogUXVlcnlQYXJhbVtdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBxdWVyeUFzR3JvdXAgaW4gYmF0Y2gnKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbkdyb3VwKGJsdWVwcmludC5nZXRTdWJDb2xsZWN0aW9uTmFtZSgpKS53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuICAgIFxyXG4gICAgcXVlcnlQYXJhbXMuZm9yRWFjaChwYXJhbSA9PiB7XHJcbiAgICAgIHF1ZXJ5ID0gcXVlcnkud2hlcmUocGFyYW0uZmllbGQsIHBhcmFtLm9wLCBwYXJhbS52YWx1ZSkgYXMgYW55XHJcbiAgICB9KVxyXG5cclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc25hcHNob3RMaXN0ZW5lcjxUIGV4dGVuZHMgTW9kZWw+KG5hbWU6IHN0cmluZywgYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkOiBzdHJpbmcsIG9uUmVjaWV2ZTogKChlbnRpdHk6IFQpID0+IHZvaWQpLCBvbkVycm9yOiAoKGVycm9yOiBFcnJvcikgPT4gdm9pZCkgPSBudWxsKTogdm9pZCB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJylcclxuICB9XHJcbiAgXHJcblxyXG4gIHNuYXBzaG90TGlzdGVuZXJNYW55PFQgZXh0ZW5kcyBNb2RlbD4obmFtZTogc3RyaW5nLCBibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSwgb25SZWNpZXZlOiAoKGVudGl0aWVzOiBUW10pID0+IHZvaWQpLCBvbkVycm9yOiAoKGVycm9yOiBFcnJvcikgPT4gdm9pZCkgPSBudWxsKTogdm9pZCB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXHJcbiAgfVxyXG5cclxuICB1bnN1YnNjcmliZUxpc3RlbmVyKG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKVxyXG4gIH1cclxuXHJcbiAgaGFzTGlzdGVuZXIobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXHJcbiAgfVxyXG5cclxuICBkZWxldGU8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9uLmRlbGV0ZSh0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhpZCkpXHJcbiAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5iYXRjaCl7XHJcbiAgICAgICAgICB0aGlzLmJhdGNoLmRlbGV0ZSh0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhpZCkpXHJcbiAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAgICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgICAgICAgIC5kb2MoaWQpLmRlbGV0ZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgZGVsZXRlTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IGlkcy5tYXAoaWQgPT4gdGhpcy5kZWxldGUoYmx1ZXByaW50LCBpZCkpXHJcbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChlID0+IHJlamVjdChlKSlcclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgY29udmVydFRvVGltZXN0YW1wKGRhdGU6IERhdGUpOiBhZG1pbi5maXJlc3RvcmUuVGltZXN0YW1we1xyXG4gICAgcmV0dXJuIGFkbWluLmZpcmVzdG9yZS5UaW1lc3RhbXAuZnJvbURhdGUoZGF0ZSlcclxuICB9XHJcblxyXG4gIGNvbnZlcnRGcm9tVGltZXN0YW1wKHRpbWVzdGFtcDogYWRtaW4uZmlyZXN0b3JlLlRpbWVzdGFtcCl7XHJcbiAgICByZXR1cm4gdGltZXN0YW1wLnRvRGF0ZSgpXHJcbiAgfVxyXG5cclxuXHJcbiAgZ2V0Q29udmVydGVyPFQgZXh0ZW5kcyBNb2RlbD4oY29uc3RydWN0b3I6IENvbnN0cnVjdG9yRnVuY3Rpb248VD4pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRvRmlyZXN0b3JlIChpdGVtOiBUKTogYWRtaW4uZmlyZXN0b3JlLkRvY3VtZW50RGF0YSB7XHJcbiAgICAgICAgcmV0dXJuIGl0ZW0udG9Kc29uKHRydWUpXHJcbiAgICAgIH0sXHJcbiAgICAgIGZyb21GaXJlc3RvcmUgKFxyXG4gICAgICAgIHNuYXBzaG90OiBhZG1pbi5maXJlc3RvcmUuUXVlcnlEb2N1bWVudFNuYXBzaG90LFxyXG4gICAgICApOiBUIHtcclxuICAgICAgICBjb25zdCBkYXRhID0gc25hcHNob3QuZGF0YSgpXHJcbiAgICAgICAgZGF0YS5pZCA9IHNuYXBzaG90LmlkXHJcbiAgICAgICAgcmV0dXJuIChuZXcgY29uc3RydWN0b3IoKSkuZnJvbUpzb24oZGF0YSwgdHJ1ZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgcnVuVHJhbnNhY3Rpb24ob3BlcmF0aW9uczogKCgpID0+IFByb21pc2U8dm9pZD4pKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZGIucnVuVHJhbnNhY3Rpb24oYXN5bmMgdHJhbnNhY3Rpb24gPT4ge1xyXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvblxyXG4gICAgICAgIC8vIHRoaXMudHJhbnNhY3Rpb24uXHJcbiAgICAgICAgcmV0dXJuIG9wZXJhdGlvbnMoKVxyXG4gICAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uID0gbnVsbFxyXG4gICAgICAgIHJlc29sdmUocmVzdWx0KVxyXG4gICAgICB9KS5jYXRjaChlID0+IHtcclxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uID0gbnVsbFxyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICAgIFxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIG92ZXIgNTAwIG9wZXJhdGlvbnMgcGVyIHRyYW5zYWN0aW9uIGNoZWNrXHJcbiAgYXN5bmMgcnVuQmF0Y2gob3BlcmF0aW9uczogKCgpID0+IFByb21pc2U8dm9pZD4pKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuYmF0Y2ggPSB0aGlzLmRiLmJhdGNoKClcclxuICAgICAgb3BlcmF0aW9ucygpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhdGNoLmNvbW1pdCgpXHJcbiAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYmF0Y2ggPSBudWxsXHJcbiAgICAgICAgcmVzb2x2ZShyZXN1bHQpXHJcbiAgICAgIH0pLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgIHRoaXMuYmF0Y2ggPSBudWxsXHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIGRlbGV0ZSBvcGVyYXRpb25cclxufSJdfQ==