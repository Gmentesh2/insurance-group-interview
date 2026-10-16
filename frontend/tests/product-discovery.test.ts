import { expect, it } from 'vitest';
import { validateProductDetails } from '../src/features/products/validation';
it('rejects missing health details, fractional ages and invalid calendar dates', () => {
 expect(validateProductDetails('health', {}, '2026-10-14').country).toBe('required');
 const values={country:'DE',people:'1',age:'32.5',period:'year',startDate:'2027-02-30'};
 expect(validateProductDetails('health', values, '2026-10-14')).toMatchObject({age:'range',startDate:'invalidDate'});
 expect(validateProductDetails('health', {...values,age:'32',startDate:'2026-10-20'}, '2026-10-14')).toEqual({});
});
it('keeps purchase and rental dates consistent without treating preferences as offers', () => {
 expect(validateProductDetails('rental_car',{country:'DE',startDate:'2026-10-20',endDate:'2026-10-19',value:'1500'},'2026-10-14').endDate).toBe('dateOrder');
 expect(validateProductDetails('device',{country:'DE',deviceType:'phone',value:'-20',purchaseDate:'2026-10-15'},'2026-10-14')).toMatchObject({value:'range',purchaseDate:'invalidDate'});
});
it('requires the actual rental excess and separates personal from business cyber preferences', () => {
 const rental={country:'DE',startDate:'2026-10-20',endDate:'2026-10-26'};
 expect(validateProductDetails('rental_car',{...rental,carClass:'premium'},'2026-10-14').value).toBe('required');
 expect(validateProductDetails('rental_car',{...rental,value:'1500'},'2026-10-14')).toEqual({});
 const cyber={country:'DE',startDate:'2026-10-20',protection:'identity'};
 expect(validateProductDetails('cyber',{...cyber,audience:'business'},'2026-10-14').audience).toBe('required');
 expect(validateProductDetails('cyber',{...cyber,audience:'family'},'2026-10-14')).toEqual({});
});
