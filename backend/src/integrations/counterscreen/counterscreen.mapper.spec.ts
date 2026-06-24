import { mapCounterScreenItem } from './counterscreen.mapper';

const source = {
    id: 'test-source',
    name: 'Test source',
    country: 'Jordan',
    baseUrl: 'https://example.test',
};

describe('mapCounterScreenItem', () => {
    it('keeps duplicate chassis rows independent and recognizes Available as in stock', () => {
        const available = mapCounterScreenItem(
            { Chassis: 'DUPLICATE-CHASSIS', Chassis_Status: 'Available' },
            source,
        );
        const sold = mapCounterScreenItem(
            { Chassis: 'DUPLICATE-CHASSIS', Chassis_Status: 'Sold' },
            source,
        );

        expect(available.chassis).toBe(sold.chassis);
        expect(available).toMatchObject({
            rawStatus: 'Available',
            normalizedStatus: 'inStock',
            displayStatus: 'In-Stock',
            isInStock: true,
            isSold: false,
        });
        expect(sold).toMatchObject({
            rawStatus: 'Sold',
            normalizedStatus: 'sold',
            isSold: true,
            isInStock: false,
        });
    });
});
