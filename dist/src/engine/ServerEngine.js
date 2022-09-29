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
        return this.db.runTransaction(async (transaction) => {
            this.transaction = transaction;
            // this.transaction.
            return operations();
        }).then((result) => {
            this.transaction = null;
            return result;
        }).catch(e => {
            this.transaction = null;
            throw e;
        });
    }
    //TODO over 500 operations per transaction check
    async runBatch(operations) {
        this.batch = this.db.batch();
        const result = await operations();
        return await this.batch.commit().then(() => {
            this.batch = null;
            return result;
        }).catch(e => {
            this.batch = null;
            throw e;
        });
    }
}
exports.default = ServerEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyRW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2VuZ2luZS9TZXJ2ZXJFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxvRUFBa0M7QUFNbEMsTUFBcUIsWUFBWTtJQVUvQixZQUFZLEdBQWtCO1FBUDlCLGdCQUFXLEdBQWdDLElBQUksQ0FBQTtRQUMvQyxVQUFLLEdBQStCLElBQUksQ0FBQTtRQUV4Qyx3REFBd0Q7UUFFeEQsa0JBQWEsR0FBWSxLQUFLLENBQUE7UUFHNUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDZCxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBRUQsSUFBSSxDQUFrQixLQUFRO1FBQzVCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUN0QyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsSUFBSTtnQkFDRixpR0FBaUc7Z0JBQ2pHLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRTtvQkFDWixJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7d0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7d0JBQzVHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtxQkFDZjt5QkFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7d0JBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMs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QUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQTtZQUN2QixPQUFPLE1BQU0sQ0FBQTtRQUNmLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNYLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFBO1lBQ3ZCLE1BQU0sQ0FBQyxDQUFBO1FBQ1QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsZ0RBQWdEO0lBQ2hELEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBaUM7UUFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBRTVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxFQUFFLENBQUE7UUFFakMsT0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUN6QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtZQUVqQixPQUFPLE1BQU0sQ0FBQTtRQUNmLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNYLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1lBRWpCLE1BQU0sQ0FBQyxDQUFBO1FBQ1QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0NBR0Y7QUF2U0QsK0JBdVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE1vZGVsIGZyb20gJ34vbW9kZWxzL01vZGVsJztcclxuaW1wb3J0IGFkbWluIGZyb20gJ2ZpcmViYXNlLWFkbWluJ1xyXG5pbXBvcnQgRW5naW5lSW50ZXJmYWNlIGZyb20gXCJ+L2VuZ2luZS9FbmdpbmVJbnRlcmZhY2VcIjtcclxuaW1wb3J0IHsgUXVlcnlQYXJhbSB9IGZyb20gJ34vdHlwZXMvcXVlcmllcy9RdWVyeVBhcmFtJztcclxuaW1wb3J0IHsgQmx1ZXByaW50IH0gZnJvbSAnfi9tb2RlbHMvQmx1ZXByaW50JztcclxuaW1wb3J0IHsgQ29uc3RydWN0b3JGdW5jdGlvbiB9IGZyb20gJ34vdHlwZXMvZnVuY3Rpb25zL0NvbnN0cnVjdG9yRnVuY3Rpb24nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VydmVyRW5naW5lIGltcGxlbWVudHMgRW5naW5lSW50ZXJmYWNlIHtcclxuICBhcHA6IGFkbWluLmFwcC5BcHBcclxuICBkYjogYWRtaW4uZmlyZXN0b3JlLkZpcmVzdG9yZVxyXG4gIHRyYW5zYWN0aW9uOiBhZG1pbi5maXJlc3RvcmUuVHJhbnNhY3Rpb24gPSBudWxsXHJcbiAgYmF0Y2g6IGFkbWluLmZpcmVzdG9yZS5Xcml0ZUJhdGNoID0gbnVsbFxyXG5cclxuICAvLyBsaXN0ZW5lcnM6IHsgW2tleTogc3RyaW5nXTogYWRtaW4uZmlyZXN0b3JlLlN1IH0gPSB7fVxyXG5cclxuICBpblRyYW5zYWN0aW9uOiBib29sZWFuID0gZmFsc2VcclxuXHJcbiAgY29uc3RydWN0b3IoYXBwOiBhZG1pbi5hcHAuQXBwKSB7XHJcbiAgICB0aGlzLmFwcCA9IGFwcFxyXG4gICAgdGhpcy5kYiA9IGFwcC5maXJlc3RvcmUoKVxyXG4gIH1cclxuXHJcbiAgc2F2ZTxUIGV4dGVuZHMgTW9kZWw+KG1vZGVsOiBUKTogUHJvbWlzZTxUPiB7XHJcbiAgICBjb25zdCBibHVlcHJpbnQgPSBtb2RlbC5nZXRCbHVlcHJpbnQoKVxyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gaWYgbW9kZWwgaGFzIGlkLCB0aGVuIHVwZGF0ZSBmaXJlc3RvcmUgZG9jdW1lbnQgb3RoZXJ3aXNlIGFkZCBmaXJlc3RvcmUgZG9jdW1lbnQgdG8gY29sbGVjdGlvblxyXG4gICAgICAgIGlmIChtb2RlbC5pZCkge1xyXG4gICAgICAgICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb24uc2V0KHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKG1vZGVsLmlkKSwgbW9kZWwudG9Kc29uKHRydWUpKVxyXG4gICAgICAgICAgICByZXNvbHZlKG1vZGVsKVxyXG4gICAgICAgICAgfSBlbHNlIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICAgICAgICB0aGlzLmJhdGNoLnNldCh0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhtb2RlbC5pZCksIG1vZGVsLnRvSnNvbih0cnVlKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgICAgICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgICAgICAgICAgLmRvYyhtb2RlbC5pZCkuc2V0KG1vZGVsKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvY1JlZiA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKClcclxuICAgICAgICAgICAgbW9kZWwuaWQgPSBkb2NSZWYuaWRcclxuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zZXQoZG9jUmVmLCBtb2RlbC50b0pzb24odHJ1ZSkpXHJcbiAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICB9IGVsc2UgaWYodGhpcy5iYXRjaCl7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvY1JlZiA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKClcclxuICAgICAgICAgICAgbW9kZWwuaWQgPSBkb2NSZWYuaWRcclxuICAgICAgICAgICAgdGhpcy5iYXRjaC5zZXQoZG9jUmVmLCBtb2RlbC50b0pzb24odHJ1ZSkpXHJcbiAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgZG9jUmVmID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAgICAgICAgIC53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSkuZG9jKClcclxuICAgICAgICAgICAgbW9kZWwuaWQgPSBkb2NSZWYuaWRcclxuICAgICAgICAgICAgdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MobW9kZWwuaWQpLnNldChtb2RlbCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKG1vZGVsKVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICBzYXZlTWFueTxUIGV4dGVuZHMgTW9kZWw+KG1vZGVsczogVFtdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIHJldHVybiAobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gbW9kZWxzLm1hcChtb2RlbCA9PiB0aGlzLnNhdmUobW9kZWwpKVxyXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKGUgPT4gcmVqZWN0KGUpKVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICB1cGRhdGU8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWQ6IHN0cmluZywgZGF0YTogYW55KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb24udXBkYXRlKHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKSwgZGF0YSlcclxuICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgIH0gZWxzZSBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICAgIHRoaXMuYmF0Y2gudXBkYXRlKHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKSwgZGF0YSlcclxuICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpXHJcbiAgICAgICAgICAgIC53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuICAgICAgICAgICAgLmRvYyhpZCkudXBkYXRlKGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdLCBkYXRhOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiAobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gaWRzLm1hcChpZCA9PiB0aGlzLnVwZGF0ZShibHVlcHJpbnQsIGlkLCBkYXRhKSlcclxuICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpLmNhdGNoKGUgPT4gcmVqZWN0KGUpKVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuXHJcbiAgYXN5bmMgbG9hZDxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XHJcbiAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbG9hZCBpbiBiYXRjaCcpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhpZClcclxuICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKVxyXG4gICAgICBcclxuXHJcbiAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLnRyYW5zYWN0aW9uLmdldChxdWVyeSkpLmRhdGEoKSBhcyBUXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHF1ZXJ5LmdldCgpKS5kYXRhKCkgYXMgVFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgbG9hZE1hbnk8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWRzOiBzdHJpbmdbXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbG9hZE1hbnkgaW4gYmF0Y2gnKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRvY1JlZnMgPSBpZHMubWFwKGlkID0+IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKS5kb2MoaWQpKVxyXG5cclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0QWxsKC4uLmRvY1JlZnMpKS5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmRiLmdldEFsbCguLi5kb2NSZWZzKSkubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGxvYWRDb2xsZWN0aW9uPFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4pOiBQcm9taXNlPFRbXT4ge1xyXG4gICAgaWYodGhpcy5iYXRjaCl7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGxvYWRDb2xsZWN0aW9uIGluIGJhdGNoJylcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKVxyXG4gICAgXHJcbiAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLnRyYW5zYWN0aW9uLmdldChxdWVyeSkpLmRvY3MubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZ2V0KCkpLmRvY3MubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vVE9ETyBvdGhlciBwYXJhbXRlcnMsIGxpa2UgbGltaXQsIHN0YXJ0QXQsIGV0Yy4uLlxyXG4gIGFzeW5jIHF1ZXJ5PFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIHF1ZXJ5UGFyYW1zOiBRdWVyeVBhcmFtW10pOiBQcm9taXNlPFRbXT4ge1xyXG4gICAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBxdWVyeSBpbiBiYXRjaCcpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcblxyXG4gICAgICBxdWVyeVBhcmFtcy5mb3JFYWNoKHBhcmFtID0+IHtcclxuICAgICAgICBxdWVyeSA9IHF1ZXJ5LndoZXJlKHBhcmFtLmZpZWxkLCBwYXJhbS5vcCwgcGFyYW0udmFsdWUpIGFzIGFueVxyXG4gICAgICB9KVxyXG4gIFxyXG4gICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZ2V0KCkpLmRvY3MubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgICAgfVxyXG4gICAgICAgXHJcbiAgfVxyXG5cclxuICBhc3luYyBxdWVyeUFzR3JvdXA8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcXVlcnlBc0dyb3VwIGluIGJhdGNoJylcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmRiLmNvbGxlY3Rpb25Hcm91cChibHVlcHJpbnQuZ2V0U3ViQ29sbGVjdGlvbk5hbWUoKSkud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICBcclxuICAgIHF1ZXJ5UGFyYW1zLmZvckVhY2gocGFyYW0gPT4ge1xyXG4gICAgICBxdWVyeSA9IHF1ZXJ5LndoZXJlKHBhcmFtLmZpZWxkLCBwYXJhbS5vcCwgcGFyYW0udmFsdWUpIGFzIGFueVxyXG4gICAgfSlcclxuXHJcbiAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLnRyYW5zYWN0aW9uLmdldChxdWVyeSkpLmRvY3MubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZ2V0KCkpLmRvY3MubWFwKGQgPT4gZC5kYXRhKCkgYXMgVClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNuYXBzaG90TGlzdGVuZXI8VCBleHRlbmRzIE1vZGVsPihuYW1lOiBzdHJpbmcsIGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZDogc3RyaW5nLCBvblJlY2lldmU6ICgoZW50aXR5OiBUKSA9PiB2b2lkKSwgb25FcnJvcjogKChlcnJvcjogRXJyb3IpID0+IHZvaWQpID0gbnVsbCk6IHZvaWQge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXHJcbiAgfVxyXG4gIFxyXG5cclxuICBzbmFwc2hvdExpc3RlbmVyTWFueTxUIGV4dGVuZHMgTW9kZWw+KG5hbWU6IHN0cmluZywgYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIHF1ZXJ5UGFyYW1zOiBRdWVyeVBhcmFtW10sIG9uUmVjaWV2ZTogKChlbnRpdGllczogVFtdKSA9PiB2b2lkKSwgb25FcnJvcjogKChlcnJvcjogRXJyb3IpID0+IHZvaWQpID0gbnVsbCk6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKVxyXG4gIH1cclxuXHJcbiAgdW5zdWJzY3JpYmVMaXN0ZW5lcihuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJylcclxuICB9XHJcblxyXG4gIGhhc0xpc3RlbmVyKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKVxyXG4gIH1cclxuXHJcbiAgZGVsZXRlPFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiAobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5kZWxldGUodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoaWQpKVxyXG4gICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICAgICAgdGhpcy5iYXRjaC5kZWxldGUodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoaWQpKVxyXG4gICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgICAgICAgLndpdGhDb252ZXJ0ZXIodGhpcy5nZXRDb252ZXJ0ZXI8VD4oYmx1ZXByaW50LmNvbnN0cnVjdG9yRnVuY3Rpb24pKVxyXG4gICAgICAgICAgICAuZG9jKGlkKS5kZWxldGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG4gIGRlbGV0ZU1hbnk8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWRzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBpZHMubWFwKGlkID0+IHRoaXMuZGVsZXRlKGJsdWVwcmludCwgaWQpKVxyXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHJlc29sdmUoKSkuY2F0Y2goZSA9PiByZWplY3QoZSkpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG4gIGNvbnZlcnRUb1RpbWVzdGFtcChkYXRlOiBEYXRlKTogYWRtaW4uZmlyZXN0b3JlLlRpbWVzdGFtcHtcclxuICAgIHJldHVybiBhZG1pbi5maXJlc3RvcmUuVGltZXN0YW1wLmZyb21EYXRlKGRhdGUpXHJcbiAgfVxyXG5cclxuICBjb252ZXJ0RnJvbVRpbWVzdGFtcCh0aW1lc3RhbXA6IGFkbWluLmZpcmVzdG9yZS5UaW1lc3RhbXApe1xyXG4gICAgcmV0dXJuIHRpbWVzdGFtcC50b0RhdGUoKVxyXG4gIH1cclxuXHJcblxyXG4gIGdldENvbnZlcnRlcjxUIGV4dGVuZHMgTW9kZWw+KGNvbnN0cnVjdG9yOiBDb25zdHJ1Y3RvckZ1bmN0aW9uPFQ+KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0b0ZpcmVzdG9yZSAoaXRlbTogVCk6IGFkbWluLmZpcmVzdG9yZS5Eb2N1bWVudERhdGEge1xyXG4gICAgICAgIHJldHVybiBpdGVtLnRvSnNvbih0cnVlKVxyXG4gICAgICB9LFxyXG4gICAgICBmcm9tRmlyZXN0b3JlIChcclxuICAgICAgICBzbmFwc2hvdDogYWRtaW4uZmlyZXN0b3JlLlF1ZXJ5RG9jdW1lbnRTbmFwc2hvdCxcclxuICAgICAgKTogVCB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LmRhdGEoKVxyXG4gICAgICAgIGRhdGEuaWQgPSBzbmFwc2hvdC5pZFxyXG4gICAgICAgIHJldHVybiAobmV3IGNvbnN0cnVjdG9yKCkpLmZyb21Kc29uKGRhdGEsIHRydWUpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHJ1blRyYW5zYWN0aW9uKG9wZXJhdGlvbnM6ICgoKSA9PiBQcm9taXNlPHZvaWQ+KSk6IFByb21pc2U8YW55PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYi5ydW5UcmFuc2FjdGlvbihhc3luYyB0cmFuc2FjdGlvbiA9PiB7XHJcbiAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvblxyXG4gICAgICAvLyB0aGlzLnRyYW5zYWN0aW9uLlxyXG4gICAgICByZXR1cm4gb3BlcmF0aW9ucygpXHJcbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgdGhpcy50cmFuc2FjdGlvbiA9IG51bGxcclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSkuY2F0Y2goZSA9PiB7XHJcbiAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSBudWxsXHJcbiAgICAgIHRocm93IGVcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvL1RPRE8gb3ZlciA1MDAgb3BlcmF0aW9ucyBwZXIgdHJhbnNhY3Rpb24gY2hlY2tcclxuICBhc3luYyBydW5CYXRjaChvcGVyYXRpb25zOiAoKCkgPT4gUHJvbWlzZTx2b2lkPikpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdGhpcy5iYXRjaCA9IHRoaXMuZGIuYmF0Y2goKVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wZXJhdGlvbnMoKVxyXG5cclxuICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoLmNvbW1pdCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICB0aGlzLmJhdGNoID0gbnVsbFxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSkuY2F0Y2goZSA9PiB7XHJcbiAgICAgIHRoaXMuYmF0Y2ggPSBudWxsXHJcblxyXG4gICAgICB0aHJvdyBlXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIGRlbGV0ZSBvcGVyYXRpb25cclxufSJdfQ==