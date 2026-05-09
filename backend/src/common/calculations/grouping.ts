export function groupBy<T, R>(
    items: T[],
    keyFactory: (item: T) => string,
    mapper: (items: T[], key: string) => R,
): Record<string, R> {
    const grouped = items.reduce<Record<string, T[]>>((groups, item) => {
        const key = keyFactory(item) || 'Unknown';
        groups[key] = groups[key] ?? [];
        groups[key].push(item);
        return groups;
    }, {});

    return Object.fromEntries(
        Object.entries(grouped).map(([key, groupItems]) => [
            key,
            mapper(groupItems, key),
        ]),
    );
}

export function sumBy<T>(items: T[], valueFactory: (item: T) => number) {
    return items.reduce((sum, item) => sum + valueFactory(item), 0);
}

export function round(value: number): number {
    return Math.round(value * 100) / 100;
}
