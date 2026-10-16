import { z } from 'zod';
/** Contact information is not proof of ownership or an authentication identity. */
export const contactEmailSchema = z.string().trim().email().max(254);
