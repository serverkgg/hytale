const HEAP_FRACTION = 0.8;

const HEAP_FLOOR_MB = 1024;

const HEAP_HEADROOM_MB = 512;

export const heapFor = (memoryMb: number) => {
	const headroom = memoryMb - HEAP_HEADROOM_MB;

	if (headroom < HEAP_FLOOR_MB) {
		throw new Error(
			`hytale needs at least ${HEAP_FLOOR_MB + HEAP_HEADROOM_MB}mb of memory, this server has ${memoryMb}mb`,
		);
	}

	return Math.min(headroom, Math.floor(memoryMb * HEAP_FRACTION));
};

export const initialHeapFor = (heapMb: number) => {
	return Math.max(Math.floor(heapMb / 2), 1);
};
