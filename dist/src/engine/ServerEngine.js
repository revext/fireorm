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
                        this.transaction.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson());
                        resolve(model);
                    }
                    else if (this.batch) {
                        this.batch.set(this.db.collection(blueprint.buildCollectionRoute()).doc(model.id), model.toJson());
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
                        this.transaction.set(docRef, model.toJson());
                        resolve(model);
                    }
                    else if (this.batch) {
                        const docRef = this.db.collection(blueprint.buildCollectionRoute()).doc();
                        model.id = docRef.id;
                        this.batch.set(docRef, model.toJson());
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
                Promise.all(promises).then(resolve);
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
                Promise.all(promises).then(() => resolve());
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
    snapshotListener(name, blueprint, id, onRecieve) {
        throw new Error('Not implemented');
    }
    snapshotListenerMany(name, blueprint, queryParams, onRecieve) {
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
                Promise.all(promises).then(() => resolve());
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
                return item.toJson();
            },
            fromFirestore(snapshot) {
                const data = snapshot.data();
                data.id = snapshot.id;
                return (new constructor()).fromJson(data);
            }
        };
    }
    async runTransaction(operations) {
        return this.db.runTransaction(async (transaction) => {
            this.transaction = transaction;
            return await operations();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyRW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2VuZ2luZS9TZXJ2ZXJFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxvRUFBa0M7QUFNbEMsTUFBcUIsWUFBWTtJQVUvQixZQUFZLEdBQWtCO1FBUDlCLGdCQUFXLEdBQWdDLElBQUksQ0FBQTtRQUMvQyxVQUFLLEdBQStCLElBQUksQ0FBQTtRQUV4Qyx3REFBd0Q7UUFFeEQsa0JBQWEsR0FBWSxLQUFLLENBQUE7UUFHNUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDZCxJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBRUQsSUFBSSxDQUFrQixLQUFRO1FBQzVCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUN0QyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsSUFBSTtnQkFDRixpR0FBaUc7Z0JBQ2pHLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRTtvQkFDWixJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7d0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTt3QkFDeEcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO3FCQUNmO3lCQUFNLElBQUcsSUFBSSxDQUFDLEtBQUssRUFBQzt3QkFDbkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO3dCQUNsRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7cUJBQ2Y7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7NkJBQ2pELGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFJLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOzZCQUNsRSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNsQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ2hCLENBQUMsQ0FBQyxDQUFBO3FCQUNMO2lCQUNGO3FCQUFNO29CQUNMLElBQUcsSUFBSSxDQUFDLFdBQVcsRUFBQzt3QkFDbEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFDekUsS0FBSyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFBO3dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7d0JBQzVDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtxQkFDZjt5QkFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7d0JBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBQ3pFLEtBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQTt3QkFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO3dCQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7cUJBQ2Y7eUJBQU07d0JBQ0wsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7NkJBQzlELGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFJLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBQzNFLEtBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQTt3QkFDcEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNwRixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ2hCLENBQUMsQ0FBQyxDQUFBO3FCQUNMO2lCQUNGO2FBQ0Y7WUFBQyxPQUFNLENBQUMsRUFBRTtnQkFDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDVjtRQUNILENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDTCxDQUFDO0lBRUQsUUFBUSxDQUFrQixNQUFXO1FBQ25DLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUN0QyxJQUFJO2dCQUNGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Z0JBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQ3BDO1lBQUMsT0FBTSxDQUFDLEVBQUU7Z0JBQ1QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQ1Y7UUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBa0IsU0FBdUIsRUFBRSxFQUFVLEVBQUUsSUFBUztRQUNwRSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDdEMsSUFBSTtnQkFDRixJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7b0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO29CQUMzRixPQUFPLEVBQUUsQ0FBQTtpQkFDVjtxQkFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7b0JBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO29CQUNyRixPQUFPLEVBQUUsQ0FBQTtpQkFDVjtxQkFBTTtvQkFDTCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt5QkFDakQsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUksU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7eUJBQ2xFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDOUIsT0FBTyxFQUFFLENBQUE7b0JBQ1gsQ0FBQyxDQUFDLENBQUE7aUJBQ0w7YUFDRjtZQUFDLE9BQU0sQ0FBQyxFQUFFO2dCQUNULE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUNWO1FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFrQixTQUF1QixFQUFFLEdBQWEsRUFBRSxJQUFTO1FBQ2pGLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUN0QyxJQUFJO2dCQUNGLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtnQkFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTthQUM1QztZQUFDLE9BQU0sQ0FBQyxFQUFFO2dCQUNULE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUNWO1FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNMLENBQUM7SUFHRCxLQUFLLENBQUMsSUFBSSxDQUFrQixTQUF1QixFQUFFLEVBQVU7UUFDN0QsSUFBRyxJQUFJLENBQUMsS0FBSyxFQUFDO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1NBQ3hDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2FBQ3ZFLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFJLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUE7UUFHckUsSUFBRyxJQUFJLENBQUMsV0FBVyxFQUFDO1lBQ2xCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFPLENBQUE7U0FDdkQ7YUFBTTtZQUNMLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBTyxDQUFBO1NBQ3ZDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQWtCLFNBQXVCLEVBQUUsR0FBYTtRQUNwRSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUE7U0FDNUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7YUFDL0UsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUksU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUU5RSxJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7WUFDbEIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQU8sQ0FBQyxDQUFBO1NBQzNFO2FBQU07WUFDTCxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBTyxDQUFDLENBQUE7U0FDbEU7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBa0IsU0FBdUI7UUFDM0QsSUFBRyxJQUFJLENBQUMsS0FBSyxFQUFDO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO1NBQ2xEO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7YUFDL0QsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUksU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQTtRQUVyRSxJQUFHLElBQUksQ0FBQyxXQUFXLEVBQUM7WUFDbEIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBTyxDQUFDLENBQUE7U0FDeEU7YUFBTTtZQUNMLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFPLENBQUMsQ0FBQTtTQUN4RDtJQUNILENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsS0FBSyxDQUFDLEtBQUssQ0FBa0IsU0FBdUIsRUFBRSxXQUF5QjtRQUMzRSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUE7U0FDekM7UUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFJLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUE7UUFFbkksV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMxQixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBUSxDQUFBO1FBQ2hFLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBRyxJQUFJLENBQUMsV0FBVyxFQUFDO1lBQ2xCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQU8sQ0FBQyxDQUFBO1NBQ3hFO2FBQU07WUFDTCxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBTyxDQUFDLENBQUE7U0FDeEQ7SUFFTCxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBa0IsU0FBdUIsRUFBRSxXQUF5QjtRQUNwRixJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUE7U0FDaEQ7UUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFJLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUE7UUFFeEksV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMxQixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBUSxDQUFBO1FBQ2hFLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBRyxJQUFJLENBQUMsV0FBVyxFQUFDO1lBQ2xCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQU8sQ0FBQyxDQUFBO1NBQ3hFO2FBQU07WUFDTCxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBTyxDQUFDLENBQUE7U0FDeEQ7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCLENBQWtCLElBQVksRUFBRSxTQUF1QixFQUFFLEVBQVUsRUFBRSxTQUFnQztRQUNqSCxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUE7SUFDdEMsQ0FBQztJQUdELG9CQUFvQixDQUFrQixJQUFZLEVBQUUsU0FBdUIsRUFBRSxXQUF5QixFQUFFLFNBQW9DO1FBQzFJLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRUQsbUJBQW1CLENBQUMsSUFBWTtRQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVELFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRUQsTUFBTSxDQUFrQixTQUF1QixFQUFFLEVBQVU7UUFDekQsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3RDLElBQUk7Z0JBQ0YsSUFBRyxJQUFJLENBQUMsV0FBVyxFQUFDO29CQUNsQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUNyRixPQUFPLEVBQUUsQ0FBQTtpQkFDVjtxQkFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7b0JBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQy9FLE9BQU8sRUFBRSxDQUFBO2lCQUNWO3FCQUFNO29CQUNMLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3lCQUNqRCxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBSSxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt5QkFDbEUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQzFCLE9BQU8sRUFBRSxDQUFBO29CQUNYLENBQUMsQ0FBQyxDQUFBO2lCQUNMO2FBQ0Y7WUFBQyxPQUFNLENBQUMsRUFBRTtnQkFDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDVjtRQUNILENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDTCxDQUFDO0lBRUQsVUFBVSxDQUFrQixTQUF1QixFQUFFLEdBQWE7UUFDaEUsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3RDLElBQUk7Z0JBQ0YsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7YUFDNUM7WUFBQyxPQUFNLENBQUMsRUFBRTtnQkFDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDVjtRQUNILENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDTCxDQUFDO0lBRUQsa0JBQWtCLENBQUMsSUFBVTtRQUMzQixPQUFPLHdCQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDakQsQ0FBQztJQUVELG9CQUFvQixDQUFDLFNBQW9DO1FBQ3ZELE9BQU8sU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFHRCxZQUFZLENBQWtCLFdBQW1DO1FBQy9ELE9BQU87WUFDTCxXQUFXLENBQUUsSUFBTztnQkFDbEIsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7WUFDdEIsQ0FBQztZQUNELGFBQWEsQ0FDWCxRQUErQztnQkFFL0MsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFBO2dCQUM1QixJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUE7Z0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQzNDLENBQUM7U0FDRixDQUFBO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBaUM7UUFDcEQsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUMsV0FBVyxFQUFDLEVBQUU7WUFDaEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUE7WUFDOUIsT0FBTyxNQUFNLFVBQVUsRUFBRSxDQUFBO1FBQzNCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFBO1lBQ3ZCLE9BQU8sTUFBTSxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ1gsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7WUFDdkIsTUFBTSxDQUFDLENBQUE7UUFDVCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxnREFBZ0Q7SUFDaEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFpQztRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxVQUFVLEVBQUUsQ0FBQTtRQUVqQyxPQUFPLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1lBRWpCLE9BQU8sTUFBTSxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ1gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7WUFFakIsTUFBTSxDQUFDLENBQUE7UUFDVCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7Q0FHRjtBQXRTRCwrQkFzU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTW9kZWwgZnJvbSAnfi9tb2RlbHMvTW9kZWwnO1xyXG5pbXBvcnQgYWRtaW4gZnJvbSAnZmlyZWJhc2UtYWRtaW4nXHJcbmltcG9ydCBFbmdpbmVJbnRlcmZhY2UgZnJvbSBcIn4vZW5naW5lL0VuZ2luZUludGVyZmFjZVwiO1xyXG5pbXBvcnQgeyBRdWVyeVBhcmFtIH0gZnJvbSAnfi90eXBlcy9xdWVyaWVzL1F1ZXJ5UGFyYW0nO1xyXG5pbXBvcnQgeyBCbHVlcHJpbnQgfSBmcm9tICd+L21vZGVscy9CbHVlcHJpbnQnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSAnfi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXJ2ZXJFbmdpbmUgaW1wbGVtZW50cyBFbmdpbmVJbnRlcmZhY2Uge1xyXG4gIGFwcDogYWRtaW4uYXBwLkFwcFxyXG4gIGRiOiBhZG1pbi5maXJlc3RvcmUuRmlyZXN0b3JlXHJcbiAgdHJhbnNhY3Rpb246IGFkbWluLmZpcmVzdG9yZS5UcmFuc2FjdGlvbiA9IG51bGxcclxuICBiYXRjaDogYWRtaW4uZmlyZXN0b3JlLldyaXRlQmF0Y2ggPSBudWxsXHJcblxyXG4gIC8vIGxpc3RlbmVyczogeyBba2V5OiBzdHJpbmddOiBhZG1pbi5maXJlc3RvcmUuU3UgfSA9IHt9XHJcblxyXG4gIGluVHJhbnNhY3Rpb246IGJvb2xlYW4gPSBmYWxzZVxyXG5cclxuICBjb25zdHJ1Y3RvcihhcHA6IGFkbWluLmFwcC5BcHApIHtcclxuICAgIHRoaXMuYXBwID0gYXBwXHJcbiAgICB0aGlzLmRiID0gYXBwLmZpcmVzdG9yZSgpXHJcbiAgfVxyXG5cclxuICBzYXZlPFQgZXh0ZW5kcyBNb2RlbD4obW9kZWw6IFQpOiBQcm9taXNlPFQ+IHtcclxuICAgIGNvbnN0IGJsdWVwcmludCA9IG1vZGVsLmdldEJsdWVwcmludCgpXHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBpZiBtb2RlbCBoYXMgaWQsIHRoZW4gdXBkYXRlIGZpcmVzdG9yZSBkb2N1bWVudCBvdGhlcndpc2UgYWRkIGZpcmVzdG9yZSBkb2N1bWVudCB0byBjb2xsZWN0aW9uXHJcbiAgICAgICAgaWYgKG1vZGVsLmlkKSB7XHJcbiAgICAgICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zZXQodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MobW9kZWwuaWQpLCBtb2RlbC50b0pzb24oKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICAgICAgdGhpcy5iYXRjaC5zZXQodGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MobW9kZWwuaWQpLCBtb2RlbC50b0pzb24oKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgICAgICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgICAgICAgICAgLmRvYyhtb2RlbC5pZCkuc2V0KG1vZGVsKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUobW9kZWwpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvY1JlZiA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKClcclxuICAgICAgICAgICAgbW9kZWwuaWQgPSBkb2NSZWYuaWRcclxuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zZXQoZG9jUmVmLCBtb2RlbC50b0pzb24oKSlcclxuICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgIH0gZWxzZSBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICAgICAgY29uc3QgZG9jUmVmID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS5kb2MoKVxyXG4gICAgICAgICAgICBtb2RlbC5pZCA9IGRvY1JlZi5pZFxyXG4gICAgICAgICAgICB0aGlzLmJhdGNoLnNldChkb2NSZWYsIG1vZGVsLnRvSnNvbigpKVxyXG4gICAgICAgICAgICByZXNvbHZlKG1vZGVsKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRvY1JlZiA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSlcclxuICAgICAgICAgICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpLmRvYygpXHJcbiAgICAgICAgICAgIG1vZGVsLmlkID0gZG9jUmVmLmlkXHJcbiAgICAgICAgICAgIHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKG1vZGVsLmlkKS5zZXQobW9kZWwpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtb2RlbClcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgc2F2ZU1hbnk8VCBleHRlbmRzIE1vZGVsPihtb2RlbHM6IFRbXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IG1vZGVscy5tYXAobW9kZWwgPT4gdGhpcy5zYXZlKG1vZGVsKSlcclxuICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICB1cGRhdGU8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWQ6IHN0cmluZywgZGF0YTogYW55KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZih0aGlzLnRyYW5zYWN0aW9uKXtcclxuICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb24udXBkYXRlKHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKSwgZGF0YSlcclxuICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgIH0gZWxzZSBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgICAgIHRoaXMuYmF0Y2gudXBkYXRlKHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKSwgZGF0YSlcclxuICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpXHJcbiAgICAgICAgICAgIC53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuICAgICAgICAgICAgLmRvYyhpZCkudXBkYXRlKGRhdGEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBkYXRlTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdLCBkYXRhOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiAobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gaWRzLm1hcChpZCA9PiB0aGlzLnVwZGF0ZShibHVlcHJpbnQsIGlkLCBkYXRhKSlcclxuICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlamVjdChlKVxyXG4gICAgICB9XHJcbiAgICB9KSlcclxuICB9XHJcblxyXG5cclxuICBhc3luYyBsb2FkPFQgZXh0ZW5kcyBNb2RlbD4oYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBsb2FkIGluIGJhdGNoJylcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbihibHVlcHJpbnQuYnVpbGRDb2xsZWN0aW9uUm91dGUoKSkuZG9jKGlkKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgIFxyXG5cclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZGF0YSgpIGFzIFRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZ2V0KCkpLmRhdGEoKSBhcyBUXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBsb2FkTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBsb2FkTWFueSBpbiBiYXRjaCcpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZG9jUmVmcyA9IGlkcy5tYXAoaWQgPT4gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpLmRvYyhpZCkpXHJcblxyXG4gICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy50cmFuc2FjdGlvbi5nZXRBbGwoLi4uZG9jUmVmcykpLm1hcChkID0+IGQuZGF0YSgpIGFzIFQpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuZGIuZ2V0QWxsKC4uLmRvY1JlZnMpKS5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgbG9hZENvbGxlY3Rpb248VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPik6IFByb21pc2U8VFtdPiB7XHJcbiAgICBpZih0aGlzLmJhdGNoKXtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgbG9hZENvbGxlY3Rpb24gaW4gYmF0Y2gnKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICBcclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIG90aGVyIHBhcmFtdGVycywgbGlrZSBsaW1pdCwgc3RhcnRBdCwgZXRjLi4uXHJcbiAgYXN5bmMgcXVlcnk8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSk6IFByb21pc2U8VFtdPiB7XHJcbiAgICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHF1ZXJ5IGluIGJhdGNoJylcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKS53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuXHJcbiAgICAgIHF1ZXJ5UGFyYW1zLmZvckVhY2gocGFyYW0gPT4ge1xyXG4gICAgICAgIHF1ZXJ5ID0gcXVlcnkud2hlcmUocGFyYW0uZmllbGQsIHBhcmFtLm9wLCBwYXJhbS52YWx1ZSkgYXMgYW55XHJcbiAgICAgIH0pXHJcbiAgXHJcbiAgICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy50cmFuc2FjdGlvbi5nZXQocXVlcnkpKS5kb2NzLm1hcChkID0+IGQuZGF0YSgpIGFzIFQpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgICB9XHJcbiAgICAgICBcclxuICB9XHJcblxyXG4gIGFzeW5jIHF1ZXJ5QXNHcm91cDxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBxdWVyeVBhcmFtczogUXVlcnlQYXJhbVtdKTogUHJvbWlzZTxUW10+IHtcclxuICAgIGlmKHRoaXMuYmF0Y2gpe1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBxdWVyeUFzR3JvdXAgaW4gYmF0Y2gnKVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBxdWVyeSA9IHRoaXMuZGIuY29sbGVjdGlvbkdyb3VwKGJsdWVwcmludC5nZXRTdWJDb2xsZWN0aW9uTmFtZSgpKS53aXRoQ29udmVydGVyKHRoaXMuZ2V0Q29udmVydGVyPFQ+KGJsdWVwcmludC5jb25zdHJ1Y3RvckZ1bmN0aW9uKSlcclxuICAgIFxyXG4gICAgcXVlcnlQYXJhbXMuZm9yRWFjaChwYXJhbSA9PiB7XHJcbiAgICAgIHF1ZXJ5ID0gcXVlcnkud2hlcmUocGFyYW0uZmllbGQsIHBhcmFtLm9wLCBwYXJhbS52YWx1ZSkgYXMgYW55XHJcbiAgICB9KVxyXG5cclxuICAgIGlmKHRoaXMudHJhbnNhY3Rpb24pe1xyXG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMudHJhbnNhY3Rpb24uZ2V0KHF1ZXJ5KSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIChhd2FpdCBxdWVyeS5nZXQoKSkuZG9jcy5tYXAoZCA9PiBkLmRhdGEoKSBhcyBUKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc25hcHNob3RMaXN0ZW5lcjxUIGV4dGVuZHMgTW9kZWw+KG5hbWU6IHN0cmluZywgYmx1ZXByaW50OiBCbHVlcHJpbnQ8VD4sIGlkOiBzdHJpbmcsIG9uUmVjaWV2ZTogKChlbnRpdHk6IFQpID0+IHZvaWQpKTogdm9pZCB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJylcclxuICB9XHJcbiAgXHJcblxyXG4gIHNuYXBzaG90TGlzdGVuZXJNYW55PFQgZXh0ZW5kcyBNb2RlbD4obmFtZTogc3RyaW5nLCBibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgcXVlcnlQYXJhbXM6IFF1ZXJ5UGFyYW1bXSwgb25SZWNpZXZlOiAoKGVudGl0aWVzOiBUW10pID0+IHZvaWQpKTogdm9pZCB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXHJcbiAgfVxyXG5cclxuICB1bnN1YnNjcmliZUxpc3RlbmVyKG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKVxyXG4gIH1cclxuXHJcbiAgaGFzTGlzdGVuZXIobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpXHJcbiAgfVxyXG5cclxuICBkZWxldGU8VCBleHRlbmRzIE1vZGVsPihibHVlcHJpbnQ6IEJsdWVwcmludDxUPiwgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYodGhpcy50cmFuc2FjdGlvbil7XHJcbiAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9uLmRlbGV0ZSh0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhpZCkpXHJcbiAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICB9IGVsc2UgaWYodGhpcy5iYXRjaCl7XHJcbiAgICAgICAgICB0aGlzLmJhdGNoLmRlbGV0ZSh0aGlzLmRiLmNvbGxlY3Rpb24oYmx1ZXByaW50LmJ1aWxkQ29sbGVjdGlvblJvdXRlKCkpLmRvYyhpZCkpXHJcbiAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5kYi5jb2xsZWN0aW9uKGJsdWVwcmludC5idWlsZENvbGxlY3Rpb25Sb3V0ZSgpKVxyXG4gICAgICAgICAgICAud2l0aENvbnZlcnRlcih0aGlzLmdldENvbnZlcnRlcjxUPihibHVlcHJpbnQuY29uc3RydWN0b3JGdW5jdGlvbikpXHJcbiAgICAgICAgICAgIC5kb2MoaWQpLmRlbGV0ZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgIH1cclxuICAgIH0pKVxyXG4gIH1cclxuXHJcbiAgZGVsZXRlTWFueTxUIGV4dGVuZHMgTW9kZWw+KGJsdWVwcmludDogQmx1ZXByaW50PFQ+LCBpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwcm9taXNlcyA9IGlkcy5tYXAoaWQgPT4gdGhpcy5kZWxldGUoYmx1ZXByaW50LCBpZCkpXHJcbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKVxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZWplY3QoZSlcclxuICAgICAgfVxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICBjb252ZXJ0VG9UaW1lc3RhbXAoZGF0ZTogRGF0ZSk6IGFkbWluLmZpcmVzdG9yZS5UaW1lc3RhbXB7XHJcbiAgICByZXR1cm4gYWRtaW4uZmlyZXN0b3JlLlRpbWVzdGFtcC5mcm9tRGF0ZShkYXRlKVxyXG4gIH1cclxuXHJcbiAgY29udmVydEZyb21UaW1lc3RhbXAodGltZXN0YW1wOiBhZG1pbi5maXJlc3RvcmUuVGltZXN0YW1wKXtcclxuICAgIHJldHVybiB0aW1lc3RhbXAudG9EYXRlKClcclxuICB9XHJcblxyXG5cclxuICBnZXRDb252ZXJ0ZXI8VCBleHRlbmRzIE1vZGVsPihjb25zdHJ1Y3RvcjogQ29uc3RydWN0b3JGdW5jdGlvbjxUPikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdG9GaXJlc3RvcmUgKGl0ZW06IFQpOiBhZG1pbi5maXJlc3RvcmUuRG9jdW1lbnREYXRhIHtcclxuICAgICAgICByZXR1cm4gaXRlbS50b0pzb24oKVxyXG4gICAgICB9LFxyXG4gICAgICBmcm9tRmlyZXN0b3JlIChcclxuICAgICAgICBzbmFwc2hvdDogYWRtaW4uZmlyZXN0b3JlLlF1ZXJ5RG9jdW1lbnRTbmFwc2hvdCxcclxuICAgICAgKTogVCB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHNuYXBzaG90LmRhdGEoKVxyXG4gICAgICAgIGRhdGEuaWQgPSBzbmFwc2hvdC5pZFxyXG4gICAgICAgIHJldHVybiAobmV3IGNvbnN0cnVjdG9yKCkpLmZyb21Kc29uKGRhdGEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHJ1blRyYW5zYWN0aW9uKG9wZXJhdGlvbnM6ICgoKSA9PiBQcm9taXNlPHZvaWQ+KSk6IFByb21pc2U8YW55PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYi5ydW5UcmFuc2FjdGlvbihhc3luYyB0cmFuc2FjdGlvbiA9PiB7XHJcbiAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvblxyXG4gICAgICByZXR1cm4gYXdhaXQgb3BlcmF0aW9ucygpXHJcbiAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgdGhpcy50cmFuc2FjdGlvbiA9IG51bGxcclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSkuY2F0Y2goZSA9PiB7XHJcbiAgICAgIHRoaXMudHJhbnNhY3Rpb24gPSBudWxsXHJcbiAgICAgIHRocm93IGVcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvL1RPRE8gb3ZlciA1MDAgb3BlcmF0aW9ucyBwZXIgdHJhbnNhY3Rpb24gY2hlY2tcclxuICBhc3luYyBydW5CYXRjaChvcGVyYXRpb25zOiAoKCkgPT4gUHJvbWlzZTx2b2lkPikpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdGhpcy5iYXRjaCA9IHRoaXMuZGIuYmF0Y2goKVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wZXJhdGlvbnMoKVxyXG5cclxuICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoLmNvbW1pdCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICB0aGlzLmJhdGNoID0gbnVsbFxyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSkuY2F0Y2goZSA9PiB7XHJcbiAgICAgIHRoaXMuYmF0Y2ggPSBudWxsXHJcblxyXG4gICAgICB0aHJvdyBlXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy9UT0RPIGRlbGV0ZSBvcGVyYXRpb25cclxufSJdfQ==