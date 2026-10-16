import 'server-only';
import type { HomepageExample } from './contracts';
/** Fixed fictional presentation data; quotes and all business rules run in C#. */
export function homepageExample():HomepageExample {
 const plans = [
  {plan:'essential' as const,totalCents:1015,medical:10000000,baggage:50000},
  {plan:'comfort' as const,totalCents:1680,medical:50000000,baggage:150000},
 ];
 return {startDate:'2026-09-20',endDate:'2026-09-26',days:7,travelerCount:1,travelerAge:30,residenceCountry:'DE',destinationCountry:'JP',plans:plans.map((p,index)=>({
  plan:p.plan,provider:'Atlas Travel',totalCents:p.totalCents,currency:'EUR',exclusions:['pre_existing_conditions','high_risk_sports','known_events'],
  coverage:[
   {key:'medical',status:'covered',limitCents:p.medical,scope:'per_person',deductibleCents:index?0:10000},
   {key:'cancellation',status:index?'conditional':'excluded',limitCents:index?300000:null,scope:'per_person',deductibleCents:index?5000:0,...(index?{condition:'listed_reasons_only'}:{})},
   {key:'baggage',status:'covered',limitCents:p.baggage,scope:'per_person',deductibleCents:5000},
   {key:'delay',status:index?'conditional':'unknown',limitCents:index?25000:null,scope:'per_trip',deductibleCents:0,...(index?{condition:'after_six_hours'}:{})},
   {key:'assistance',status:'covered',limitCents:null,scope:'per_person',deductibleCents:0},
  ],
 }))};
}
