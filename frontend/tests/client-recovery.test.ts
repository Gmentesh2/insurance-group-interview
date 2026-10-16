import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activatePrivateOwner, clearPrivateDrafts, deletePrivateDraft, getPrivateDraft, getPrivateSessionEpoch, setPrivateDraft, suspendPrivateDrafts } from "../src/lib/private-drafts";
import { api } from "../src/lib/client";
import { downloadDocument } from "../src/lib/download";
import { SESSION_EXPIRED } from "../src/lib/session-recovery";

describe("private session recovery", () => {
  beforeEach(() => { clearPrivateDrafts(); vi.stubGlobal("window", new EventTarget()); });
  afterEach(() => { vi.unstubAllGlobals(); clearPrivateDrafts(); });

  it("restores a same-user draft after re-authentication but rejects stale owner access", () => {
    activatePrivateOwner("alice");
    setPrivateDraft("alice", "claim", { description: "private", file: new Blob(["evidence"]) });
    suspendPrivateDrafts();
    expect(getPrivateDraft("alice", "claim")).toBeUndefined();
    activatePrivateOwner("alice");
    expect(getPrivateDraft<{ description: string }>("alice", "claim")?.description).toBe("private");
    activatePrivateOwner("bob");
    setPrivateDraft("bob", "claim", "Bob's draft");
    setPrivateDraft("alice", "claim", "late response");
    deletePrivateDraft("alice", "claim");
    expect(getPrivateDraft("alice", "claim")).toBeUndefined();
    expect(getPrivateDraft("bob", "claim")).toBe("Bob's draft");
    clearPrivateDrafts();
    activatePrivateOwner("bob");
    expect(getPrivateDraft("bob", "claim")).toBeUndefined();
  });

  it("coalesces protected expiry failures and excludes authentication validation", async () => {
    activatePrivateOwner("alice");
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED, expired);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { code: "AUTH_REQUIRED" } }, { status: 401 })));
    await Promise.allSettled([api("/orders"), api("/claims")]);
    expect(expired).toHaveBeenCalledTimes(1);
    await expect(api("/auth/verify")).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("allows only server-granted draft scopes and clears them when grants or identity change", () => {
    activatePrivateOwner('account', ['guest']);
    setPrivateDraft('guest', 'claim', 'private guest draft');
    setPrivateDraft('other', 'other', 'rejected');
    expect(getPrivateDraft('guest', 'claim')).toBe('private guest draft');
    expect(getPrivateDraft('other', 'other')).toBeUndefined();
    suspendPrivateDrafts(); activatePrivateOwner('account', ['guest']);
    expect(getPrivateDraft('guest', 'claim')).toBe('private guest draft');
    const epoch = getPrivateSessionEpoch();
    activatePrivateOwner('account');
    expect(getPrivateSessionEpoch()).not.toBe(epoch);
    expect(getPrivateDraft('guest', 'claim')).toBeUndefined();
    activatePrivateOwner('other', ['guest']);
    expect(getPrivateDraft('guest', 'claim')).toBeUndefined();
  });

  it("does not expose a protected result or expire the next identity after a late response", async () => {
    activatePrivateOwner("alice");
    const initialEpoch = getPrivateSessionEpoch();
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const request = api("/claims");
    activatePrivateOwner("bob");
    expect(getPrivateSessionEpoch()).not.toBe(initialEpoch);
    finish(Response.json({ claims: [{ private: true }] }));
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED, expired);
    const oldRequest = api("/claims");
    activatePrivateOwner("carol");
    finish(Response.json({ error: { code: "AUTH_REQUIRED" } }, { status: 401 }));
    await expect(oldRequest).rejects.toMatchObject({ status: 401 });
    expect(expired).not.toHaveBeenCalled();
  });

  it("does not start a private download after the user signs out", async () => {
    activatePrivateOwner("alice");
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const download = downloadDocument("/api/v1/policies/example/documents", "policy.pdf");
    clearPrivateDrafts();
    finish(new Response("%PDF-demo"));
    await expect(download).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  });
});
