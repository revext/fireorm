import 'reflect-metadata'
import { Dog, Bone } from '../data/models'


let dog = new Dog()
beforeAll(async () => {
    dog.name = "Fido"
    dog.bones = [
        new Bone(),
        new Bone()
    ]

    dog.bones[0].length = 10
    dog.bones[0].dog = dog
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
    expect(dog.bones[0].width).toBeUndefined()
    // expect().toBe(0)
})

test('test toJson on model with submodels', () => {
    const dogJson = dog.toJson()

    expect(dogJson.name).toBe('Fido')
    expect(dogJson.type).toBeUndefined()
    expect(dogJson.tagNames['hello']).toBe('world')
    expect(dogJson.bones[0].length).toBe(10)
    expect(dogJson.bones[0].dog).toBeUndefined()
    expect(dogJson.bones[1].length).toBe(20)
    expect(dogJson.bones[0].width).toBeUndefined()
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'width')).toBe(false)
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'errors')).toBe(false)
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'dog')).toBe(false)
})

//FIXME multi depth relationship

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