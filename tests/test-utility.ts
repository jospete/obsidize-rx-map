import { RxStore } from '../src';

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

export class AppStore extends RxStore {

	public readonly darkMode = this.defineProperty(true);
	public readonly clickCount = this.defineProperty(0);
	public readonly users = this.defineEntity((user: User) => user.id);
	public readonly products = this.defineEntity((product: Product) => product.id);
	public readonly productOrders = this.defineEntity((order: ProductOrder) => order.id);
	public readonly productOrdersByProductId = this.defineEntityForeignKey(this.productOrders, order => order.productId);
}