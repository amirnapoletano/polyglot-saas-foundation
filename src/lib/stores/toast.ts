import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
};

let nextId = 0;

const { subscribe, update } = writable<ToastItem[]>([]);

export const toasts = { subscribe };

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
	const id = nextId++;
	update((items) => [...items, { id, message, type, duration }]);
	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}
}

export function dismissToast(id: number) {
	update((items) => items.filter((t) => t.id !== id));
}
