const BASE = import.meta.env.VITE_API_BASE;

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  isVegetarian: boolean;
  drinksAlcohol: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
  memberCount?: number;
}

export interface MemberPreferences {
  isVegetarian: boolean;
  drinksAlcohol: boolean;
}

async function request<T>(
  path: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers || {});
  
  const isMutation = ['POST', 'PATCH', 'DELETE'].includes(options?.method || '');
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("[API] Authorization header set");
  } else if (isMutation) {
    throw new Error("Authentication required. Please sign in.");
  }
  
  headers.set("Content-Type", "application/json");

  const url = `${BASE}${path}`;
  console.log(`[API] ${options?.method || "GET"} ${url}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = err?.error?.message ?? `Request failed: ${res.status} ${res.statusText}`;
      console.error(`[API Error] ${msg}`);
      throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;
    
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`[API Fatal]`, err.message);
    throw err;
  }
}

export const groupService = {
  createGroup: (token: string | null, data: { name: string; description?: string; currency: string }) => {
    if (!token) {
      throw new Error("Authentication required. Please sign in.");
    }
    return request<Group>("/groups", token, { method: "POST", body: JSON.stringify(data) });
  },

  listGroups: (token: string | null, userId: string) =>
    request<Group[]>(`/groups?userId=${encodeURIComponent(userId)}`, token),

  getGroupDetails: (token: string | null, groupId: string) =>
    request<Group>(`/groups/${groupId}`, token),

  addGroupMember: (token: string | null, groupId: string, data: { userId: string; preferences: MemberPreferences }) => {
    if (!token) {
      throw new Error("Authentication required. Please sign in.");
    }
    return request<GroupMember>(`/groups/${groupId}/members`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateMemberPreferences: (token: string | null, groupId: string, memberId: string, preferences: MemberPreferences) => {
    if (!token) {
      throw new Error("Authentication required. Please sign in.");
    }
    return request<GroupMember>(`/groups/${groupId}/members/${memberId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ preferences }),
    });
  },

  removeGroupMember: (token: string | null, groupId: string, memberId: string) => {
    if (!token) {
      throw new Error("Authentication required. Please sign in.");
    }
    return request<void>(`/groups/${groupId}/members/${memberId}`, token, { method: "DELETE" });
  },
};