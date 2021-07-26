import { Observable, of } from 'rxjs';

export interface Book {
	id: number;
	name: string;
	pageCount: number;
}

export interface Game {
	id: number;
	name: string;
	playerCount: number;
}

export interface User {
	id: string;
	name: string;
	age?: number;
	email?: string;
}

export interface Product {
	id: number;
	name: string;
}

export interface ProductOrder {
	id: number;
	userId: string;
	productId: number;
}

export const getTestUsers = () => [
	{ id: 'asdf', name: 'Dennis', age: 37 },
	{ id: 'bvcx', name: 'Fred', age: 25 },
];