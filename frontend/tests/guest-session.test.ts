import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(()=>({api:vi.fn()}));
vi.mock('../src/lib/client',()=>({api:mocks.api}));
import { startGuestCheckout } from '../src/lib/guest-session';
beforeEach(()=>{
  vi.resetAllMocks();
  vi.stubGlobal('navigator',{locks:{request:vi.fn(async (_name,_options,callback)=>callback())}});
});
afterEach(()=>vi.unstubAllGlobals());
it('shares bootstrap across remounts and confirms the owner before advancing',async()=>{
  const user={id:'private-owner',email:'',role:'customer',isGuest:true};
  mocks.api.mockResolvedValueOnce({user:null}).mockResolvedValueOnce({user}).mockResolvedValueOnce({user});
  const [first,second]=await Promise.all([startGuestCheckout(),startGuestCheckout()]);
  expect(first.user?.id).toBe(user.id); expect(second).toBe(first);
  expect(mocks.api.mock.calls.map(args=>args[0])).toEqual(['/auth/session','/auth/guest','/auth/session']);
});
it('reconciles a timed-out guest creation with a fresh deadline instead of repeating creation',async()=>{
  const user={id:'confirmed-owner'};
  mocks.api.mockResolvedValueOnce({user:null}).mockImplementationOnce(async(_path,options)=>{ Object.defineProperty(options.signal,'aborted',{value:true}); throw new DOMException('deadline','TimeoutError'); }).mockResolvedValueOnce({user});
  expect((await startGuestCheckout()).user).toEqual(user);
  const post=mocks.api.mock.calls[1][1].signal, confirm=mocks.api.mock.calls[2][1].signal;
  expect(post.aborted).toBe(true); expect(confirm.aborted).toBe(false); expect(confirm).not.toBe(post);
});
it('does not replace an owner when initial verification fails or an existing session is found',async()=>{
  mocks.api.mockRejectedValueOnce(new Error('verification unavailable'));
  await expect(startGuestCheckout()).rejects.toThrow('verification unavailable');
  expect(mocks.api).toHaveBeenCalledTimes(1);
  mocks.api.mockResolvedValueOnce({user:{id:'existing'}});
  expect((await startGuestCheckout()).user?.id).toBe('existing');
  expect(mocks.api.mock.calls.every(args=>args[0]==='/auth/session')).toBe(true);
});
