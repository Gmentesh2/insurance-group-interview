import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '../src/lib/client';
import { withRequestDeadline } from '../src/lib/request-deadline';
import { activatePrivateOwner, clearPrivateDrafts } from '../src/lib/private-drafts';
import { SESSION_EXPIRED } from '../src/lib/session-recovery';
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('window',new EventTarget());clearPrivateDrafts();activatePrivateOwner('owner');});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();clearPrivateDrafts();});
it('ends an unresponsive mutation once without repeating or expiring authentication',async()=>{
 const expiry=vi.fn();window.addEventListener(SESSION_EXPIRED,expiry);
 const fetcher=vi.fn(()=>new Promise<Response>(()=>{}));vi.stubGlobal('fetch',fetcher);
 const result=api('/orders/order/pay',{method:'POST',body:'{}',timeoutMs:30_000}).catch(e=>e);
 await vi.advanceTimersByTimeAsync(30_000);
 expect(await result).toMatchObject({code:'REQUEST_TIMEOUT'});expect(fetcher).toHaveBeenCalledTimes(1);expect(expiry).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
});
it('bounds a response body that stalls after successful headers',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,status:200,json:()=>new Promise(()=>{})})));
 const result=api('/orders',{timeoutMs:30_000}).catch(e=>e);
 await vi.advanceTimersByTimeAsync(30_000);expect(await result).toMatchObject({code:'REQUEST_TIMEOUT'});
});
it('preserves caller cancellation and cancels the deadline timer',async()=>{
 const caller=new AbortController();
 const result=withRequestDeadline(()=>new Promise(()=>{}),caller.signal).catch(e=>e);
 caller.abort();expect(await result).toMatchObject({name:'AbortError'});expect(vi.getTimerCount()).toBe(0);
});
it('rejects an unreadable success response instead of treating it as confirmation',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response('invalid-json')));
 await expect(api('/orders/order/pay',{method:'POST'})).rejects.toMatchObject({code:'INVALID_RESPONSE',status:502});
});
