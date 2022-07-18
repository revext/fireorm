"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../data/models");
let dog = new models_1.Dog();
beforeAll(async () => {
    dog.name = "Fido";
    dog.bones = [
        new models_1.Bone(),
        new models_1.Bone()
    ];
    dog.bones[0].length = 10;
    dog.bones[0].dog = dog;
    dog.bones[1].length = 20;
});
test('test fromJson on model with submodels', () => {
    dog = (new models_1.Dog()).fromJson({
        name: 'Fido',
        bones: [
            { length: 10 },
            { length: 20 },
        ],
        tagNames: {
            'hello': 'world'
        }
    });
    expect(dog.name).toBe('Fido');
    expect(dog.type).toBe('terrier');
    expect(dog.tagNames.get('hello')).toBe('world');
    expect(dog.bones[0].length).toBe(10);
    expect(dog.bones[1].length).toBe(20);
    expect(dog.bones[0].width).toBeUndefined();
    // expect().toBe(0)
});
test('test toJson on model with submodels', () => {
    const dogJson = dog.toJson();
    expect(dogJson.name).toBe('Fido');
    expect(dogJson.type).toBeUndefined();
    expect(dogJson.tagNames['hello']).toBe('world');
    expect(dogJson.bones[0].length).toBe(10);
    expect(dogJson.bones[0].dog).toBeUndefined();
    expect(dogJson.bones[1].length).toBe(20);
    expect(dogJson.bones[0].width).toBeUndefined();
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'width')).toBe(false);
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'errors')).toBe(false);
    expect(Object.hasOwnProperty.call(dogJson.bones[0], 'dog')).toBe(false);
});
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
    });
});
test('test getRouteParameterMapping expect error when class has no route param defined', () => {
    expect(dog.getRouteParameterMapping).toThrow(Error);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3QvY29tbW9uL21vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBMEM7QUFHMUMsSUFBSSxHQUFHLEdBQUcsSUFBSSxZQUFHLEVBQUUsQ0FBQTtBQUNuQixTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7SUFDakIsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUE7SUFDakIsR0FBRyxDQUFDLEtBQUssR0FBRztRQUNSLElBQUksYUFBSSxFQUFFO1FBQ1YsSUFBSSxhQUFJLEVBQUU7S0FDYixDQUFBO0lBRUQsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO0lBQ3hCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQTtJQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7QUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO0lBQy9DLEdBQUcsR0FBRyxDQUFDLElBQUksWUFBRyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDdkIsSUFBSSxFQUFFLE1BQU07UUFDWixLQUFLLEVBQUU7WUFDSCxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7WUFDZCxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7U0FDakI7UUFDRCxRQUFRLEVBQUU7WUFDTixPQUFPLEVBQUUsT0FBTztTQUNuQjtLQUNKLENBQUMsQ0FBQTtJQUVGLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FB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O0FBQ3ZELENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRG9nLCBCb25lIH0gZnJvbSAnLi4vZGF0YS9tb2RlbHMnXHJcblxyXG5cclxubGV0IGRvZyA9IG5ldyBEb2coKVxyXG5iZWZvcmVBbGwoYXN5bmMgKCkgPT4ge1xyXG4gICAgZG9nLm5hbWUgPSBcIkZpZG9cIlxyXG4gICAgZG9nLmJvbmVzID0gW1xyXG4gICAgICAgIG5ldyBCb25lKCksXHJcbiAgICAgICAgbmV3IEJvbmUoKVxyXG4gICAgXVxyXG5cclxuICAgIGRvZy5ib25lc1swXS5sZW5ndGggPSAxMFxyXG4gICAgZG9nLmJvbmVzWzBdLmRvZyA9IGRvZ1xyXG4gICAgZG9nLmJvbmVzWzFdLmxlbmd0aCA9IDIwXHJcbn0pO1xyXG5cclxudGVzdCgndGVzdCBmcm9tSnNvbiBvbiBtb2RlbCB3aXRoIHN1Ym1vZGVscycsICgpID0+IHtcclxuICAgIGRvZyA9IChuZXcgRG9nKCkpLmZyb21Kc29uKHtcclxuICAgICAgICBuYW1lOiAnRmlkbycsXHJcbiAgICAgICAgYm9uZXM6IFtcclxuICAgICAgICAgICAgeyBsZW5ndGg6IDEwIH0sXHJcbiAgICAgICAgICAgIHsgbGVuZ3RoOiAyMCB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdGFnTmFtZXM6IHtcclxuICAgICAgICAgICAgJ2hlbGxvJzogJ3dvcmxkJ1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgZXhwZWN0KGRvZy5uYW1lKS50b0JlKCdGaWRvJylcclxuICAgIGV4cGVjdChkb2cudHlwZSkudG9CZSgndGVycmllcicpXHJcbiAgICBleHBlY3QoZG9nLnRhZ05hbWVzLmdldCgnaGVsbG8nKSkudG9CZSgnd29ybGQnKVxyXG4gICAgZXhwZWN0KGRvZy5ib25lc1swXS5sZW5ndGgpLnRvQmUoMTApXHJcbiAgICBleHBlY3QoZG9nLmJvbmVzWzFdLmxlbmd0aCkudG9CZSgyMClcclxuICAgIGV4cGVjdChkb2cuYm9uZXNbMF0ud2lkdGgpLnRvQmVVbmRlZmluZWQoKVxyXG4gICAgLy8gZXhwZWN0KCkudG9CZSgwKVxyXG59KVxyXG5cclxudGVzdCgndGVzdCB0b0pzb24gb24gbW9kZWwgd2l0aCBzdWJtb2RlbHMnLCAoKSA9PiB7XHJcbiAgICBjb25zdCBkb2dKc29uID0gZG9nLnRvSnNvbigpXHJcblxyXG4gICAgZXhwZWN0KGRvZ0pzb24ubmFtZSkudG9CZSgnRmlkbycpXHJcbiAgICBleHBlY3QoZG9nSnNvbi50eXBlKS50b0JlVW5kZWZpbmVkKClcclxuICAgIGV4cGVjdChkb2dKc29uLnRhZ05hbWVzWydoZWxsbyddKS50b0JlKCd3b3JsZCcpXHJcbiAgICBleHBlY3QoZG9nSnNvbi5ib25lc1swXS5sZW5ndGgpLnRvQmUoMTApXHJcbiAgICBleHBlY3QoZG9nSnNvbi5ib25lc1swXS5kb2cpLnRvQmVVbmRlZmluZWQoKVxyXG4gICAgZXhwZWN0KGRvZ0pzb24uYm9uZXNbMV0ubGVuZ3RoKS50b0JlKDIwKVxyXG4gICAgZXhwZWN0KGRvZ0pzb24uYm9uZXNbMF0ud2lkdGgpLnRvQmVVbmRlZmluZWQoKVxyXG4gICAgZXhwZWN0KE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRvZ0pzb24uYm9uZXNbMF0sICd3aWR0aCcpKS50b0JlKGZhbHNlKVxyXG4gICAgZXhwZWN0KE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRvZ0pzb24uYm9uZXNbMF0sICdlcnJvcnMnKSkudG9CZShmYWxzZSlcclxuICAgIGV4cGVjdChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChkb2dKc29uLmJvbmVzWzBdLCAnZG9nJykpLnRvQmUoZmFsc2UpXHJcbn0pXHJcblxyXG4vL0ZJWE1FIG11bHRpIGRlcHRoIHJlbGF0aW9uc2hpcFxyXG5cclxuLy8gdGVzdCgndGVzdCBnZXRSb3V0ZVBhcmFtZXRlck5hbWVzIGZvciBtb2RlbCcsICgpID0+IHtcclxuLy8gICAgIGV4cGVjdChkb2cuZ2V0Um91dGVQYXJhbWV0ZXJOYW1lcygpKS50b0VxdWFsKFsnaHVtYW5JZCddKVxyXG4vLyB9KVxyXG5cclxuLy8gdGVzdCgndGVzdCBnZXRSb3V0ZVBhcmFtZXRlck5hbWVzIGV4cGVjdCBlcnJvciB3aGVuIG1vZGVsIGhhcyBubyBAQ29sbGVjdGlvbiBhbm5vdGF0aW9uJywgKCkgPT4ge1xyXG4vLyAgICAgZXhwZWN0KGJvbmUuZ2V0Um91dGVQYXJhbWV0ZXJOYW1lcykudG9UaHJvdyhFcnJvcilcclxuLy8gfSlcclxuXHJcbi8vIHRlc3QoJ3Rlc3QgZ2V0Um91dGVQYXJhbWV0ZXJOYW1lcyBleHBlY3QgZXJyb3Igd2hlbiBjbGFzcyBoYXMgbm8gcm91dGUgcGFyYW0gZGVmaW5lZCcsICgpID0+IHtcclxuLy8gICAgIGV4cGVjdChkb2cuZ2V0Um91dGVQYXJhbWV0ZXJOYW1lcykudG9UaHJvdyhFcnJvcilcclxuLy8gfSlcclxuXHJcbnRlc3QoJ3Rlc3QgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nIGZvciBtb2RlbCcsICgpID0+IHtcclxuICAgIGV4cGVjdChkb2cuZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nKCkpLnRvRXF1YWwoe1xyXG4gICAgICAgIGh1bWFuSWQ6ICcxJ1xyXG4gICAgfSlcclxufSlcclxuXHJcbnRlc3QoJ3Rlc3QgZ2V0Um91dGVQYXJhbWV0ZXJNYXBwaW5nIGV4cGVjdCBlcnJvciB3aGVuIGNsYXNzIGhhcyBubyByb3V0ZSBwYXJhbSBkZWZpbmVkJywgKCkgPT4ge1xyXG4gICAgZXhwZWN0KGRvZy5nZXRSb3V0ZVBhcmFtZXRlck1hcHBpbmcpLnRvVGhyb3coRXJyb3IpXHJcbn0pIl19