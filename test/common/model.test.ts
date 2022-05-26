import 'reflect-metadata'
import { Collection, Field, Model } from "../../src"

class Bone extends Model {
    @Field()
    length: number = 0

    width: number = 0
}

@Collection({ route: '/humans/{humanId}/dogs'})	
class Dog extends Model {
    @Field()
    name: string    

    @Field({ routeParam: true })
    humanId: string = "1"

    @Field({ modelClass: Bone })
    bones: Bone[]

    type: string = 'terrier'

    //TODO be able to convert map values as modelClasses
    @Field({ modelClass: Map })
    tagNames: Map<string, string> = new Map([['test1','test2']])
}

@Collection({ route: '/humans/{humanId}/cats'})	
class Cat extends Model {
    @Field()
    name: string    

    type: string = 'tiger'
}


let dog = new Dog()
let bone = new Bone()
let cat = new Cat()

beforeAll(async () => {
    dog.name = "Fido"
    dog.bones = [
        new Bone(),
        new Bone()
    ]

    dog.bones[0].length = 10
    dog.bones[1].length = 20
});

test('test fromJson on model with submodels', () => {
    dog = (new Dog()).fromJson({
        name: 'Fido',
        bones: [
            { length: 10 },
            { length: 20 },
        ],
        tagNames: {
            'hello': 'world'
        }
    })

    expect(dog.name).toBe('Fido')
    expect(dog.type).toBe('terrier')
    expect(dog.tagNames.get('hello')).toBe('world')
    expect(dog.bones[0].length).toBe(10)
    expect(dog.bones[1].length).toBe(20)
    expect(dog.bones[0].width).toBe(0)
})

test('test toJson on model with submodels', () => {
    const dogJson = dog.toJson()

    expect(dogJson.name).toBe('Fido')
    expect(dogJson.type).toBeUndefined()
    expect(dogJson.tagNames['hello']).toBe('world')
    expect(dogJson.bones[0].length).toBe(10)
    expect(dogJson.bones[1].length).toBe(20)
    expect(dogJson.bones[0].width).toBe(0)
})

// test('test getRouteParameterNames for model', () => {
//     expect(dog.getRouteParameterNames()).toEqual(['humanId'])
// })

// test('test getRouteParameterNames expect error when model has no @Collection annotation', () => {
//     expect(bone.getRouteParameterNames).toThrow(Error)
// })

// test('test getRouteParameterNames expect error when class has no route param defined', () => {
//     expect(dog.getRouteParameterNames).toThrow(Error)
// })

test('test getRouteParameterMapping for model', () => {
    expect(dog.getRouteParameterMapping()).toEqual({
        humanId: '1'
    })
})

test('test getRouteParameterMapping expect error when class has no route param defined', () => {
    expect(dog.getRouteParameterMapping).toThrow(Error)
})