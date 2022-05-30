import 'reflect-metadata'
import admin from 'firebase-admin'
import { startOrm, useEngine, Blueprint } from "../../src"
import ServerEngine from '../../src/engine/ServerEngine'
import { Human } from '../data/models'

admin.initializeApp({
    credential: admin.credential.cert(require('../../service-account.json'))
})
startOrm(new ServerEngine(admin.app()))

beforeAll(async () => {
    const snapshot = await admin.firestore().collection('humans').get()
    snapshot.forEach(async doc => {
        await doc.ref.delete()
    })

    await admin.firestore().collection('humans').doc('1').set({
        name: 'John'
    })
    await admin.firestore().collection('humans').doc('2').set({
        name: 'Jim'
    })
});

test('save on engine, create and save model', async () => {
    const human = new Human()
    human.name = 'John'
    const savedHuman = await useEngine().save(human)

    expect(savedHuman.name).toBe('John')
    expect(savedHuman.createdAt.valueOf()).toBe(human.createdAt.valueOf())
})

test('saveMany on engine, create and save model', async () => {
    const human1 = new Human()
    human1.name = 'John'
    const human2 = new Human()
    human2.name = 'Jim'
    const savedHumans = await useEngine().saveMany([human1, human2])

    const docs: any = []
    savedHumans.forEach(human => {
        docs.push(admin.firestore().collection('humans').doc(human.id))
    })

    const snapshots = await admin.firestore().getAll(...docs)
    expect(snapshots[0].data().name).toBe('John')
    expect(snapshots[1].data().name).toBe('Jim')

})

test('update on engine', async () => {
    await useEngine().update(Blueprint.createBlueprint(Human), "1", { name: "Test" })
    const doc = await admin.firestore().collection('humans').doc("1").get()

    expect(doc.data().name).toBe('Test')
})

test('updateMany on engine', async () => {
    const ids = ["1", "2"]
    await useEngine().updateMany(Blueprint.createBlueprint(Human), ids, { name: "Test" })

    const docs: any = []
    ids.forEach(id => {
        docs.push(admin.firestore().collection('humans').doc(id))
    })
    const snapshot = await admin.firestore().getAll(...docs)

    expect(snapshot[0].data().name).toBe('Test')
    expect(snapshot[1].data().name).toBe('Test')
})


test('load on engine', async () => {
    const loadedHuman = await useEngine().load(Blueprint.createBlueprint(Human), "1")

    expect(loadedHuman.name).toBe('Test')
})

test('loadMany on engine', async () => {
    const humans = await useEngine().loadMany(Blueprint.createBlueprint(Human), ["1", "2"])

    expect(humans[0].name).toBe('Test')
    expect(humans[1].name).toBe('Test')
})

test('loadCollection on engine', async () => {
    const humans = await useEngine().loadCollection(Blueprint.createBlueprint(Human))

    expect(humans.length).toBe(5)
    expect(humans[0].id).toBe("1")
    expect(humans[1].id).toBe("2")
})


//TODO batch and transaction tests


// test('loadMany by ids on repository', async () => {
//     const humans = await humanRepository.loadMany(["1", "2"])

//     expect(humans.length).toBe(2)
//     expect(humans[0].name).toBe('John')
//     expect(humans[1].name).toBe('Jim')
// })

// test('loadMany on model by repository', async () => {
//     const human = await humanRepository.load("1")
//     await human.load('relatives')
//     human.relatives

//     expect(human.relatives.length).toBe(1)
//     expect(human.relatives[0].name).toBe('Jim')
// })

// test('load by id with additional route params on repository', async () => {
//     const dog = await dogRepository.load("1", { humanId: "1" })

//     expect(dog.name).toBe('Fido')
//     expect(dog.bones[0].length).toBe(10)
//     expect(dog.bones[1].length).toBe(20)
// })

// test('load subcollection on model with repository', async () => {
//     const human = await humanRepository.load("1")

//     await human.load("dogs")
//     expect(human.dogs.length).toBe(1)
//     expect(human.dogs[0].name).toBe("Fido")
// })