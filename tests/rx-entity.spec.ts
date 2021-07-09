import { RxEntity } from '../src';

describe('RxEntity', () => {

	it('can select arbitrary properties', () => {

		interface TestThing {
			potato: boolean;
		}

		const entity = new RxEntity<TestThing>({ potato: true });
		entity.select('potato').subscribe(v => console.log(v));
	});
});