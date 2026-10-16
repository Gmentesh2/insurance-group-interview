/** Only non-secret auth fields survive locale navigation; never serialized. */
export type AuthFormDraft={email:string;register:boolean};
const drafts=new Map<string,AuthFormDraft>();
export function authFormDraft(key:string,fallback:AuthFormDraft){return drafts.get(key)??fallback;}
export function saveAuthFormDraft(key:string,draft:AuthFormDraft){drafts.set(key,{email:draft.email,register:draft.register});}
export function clearAuthFormDrafts(){drafts.clear();}
