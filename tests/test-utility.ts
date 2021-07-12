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

export const loadUser = (): Observable<User> => of(
	{ id: 'asdffdgh', name: 'ted', email: 'tedrulez@tedswebsite.tv' },
);

export const loadProducts = (): Observable<Product[]> => of([
	{ id: 0, name: 'Toast' },
	{ id: 1, name: 'Butter' },
	{ id: 2, name: 'Milk' },
]);

export const loadProductOrdersByUserId = (userId: string): Observable<ProductOrder[]> => of([
	{ id: 0, userId, productId: 2 }
]);