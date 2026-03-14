const BASE = import.meta.env.VITE_API_BASE;

export interface BillItem {
  name: string;
  amount: number;
  category: "veg" | "non_veg" | "alcohol" | "shared";
}

export interface ParsedBill {
  items: BillItem[];
  totalAmount: number;
  taxAmount: number;
}

export interface BillUploadResponse {
  billId: string;
  groupId: string;
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
  uploadedAt: string;
  bill?: {
    billId: string;
    status: string;
    uploadedAt: string;
  };
}

export interface BillStatus {
  billId: string;
  groupId: string;
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
  uploadedAt: string;
  items?: BillItem[];
  totalAmount?: number;
  taxAmount?: number;
  error?: string;
}

async function request<T>(
  path: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${BASE}${path}`;
  console.log(`[BillAPI] ${options?.method || "GET"} ${url}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = err?.error?.message ?? `Request failed: ${res.status}`;
      throw new Error(msg);
    }

    if (res.status === 204) return undefined as T;

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`[BillAPI Error]`, err.message);
    throw err;
  }
}

export const billService = {
  /**
   * Upload bill image to a group
   * Returns billId and processing status
   */
  uploadBill: async (
    token: string | null,
    groupId: string,
    file: File
  ): Promise<BillUploadResponse> => {
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("bill", file);

    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${BASE}/bills/${groupId}/bills`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "Failed to upload bill");
    }

    return res.json();
  },

  /**
   * Check bill processing status and get parsed items
   */
  getBillStatus: async (token: string | null, billId: string): Promise<BillStatus> => {
    return request<BillStatus>(`/bills/${billId}`, token);
  },

  /**
   * Poll bill status until processing is complete
   * Returns parsed bill data
   */
  pollBillStatus: async (
    token: string | null,
    billId: string,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<BillStatus> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await billService.getBillStatus(token, billId);

      if (status.status === "COMPLETED") {
        return status;
      }

      if (status.status === "FAILED") {
        throw new Error(status.error || "Bill processing failed");
      }

      // Wait before polling again
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error("Bill processing timeout");
  },

  /**
   * Confirm parsed bill items and create expense
   */
  confirmBillItems: async (
    token: string | null,
    billId: string,
    data: {
      title: string;
      description?: string;
      paidBy: string;
      items: Array<{
        name: string;
        amount: number;
        category: string;
        sharedBy: string[];
      }>;
    }
  ) => {
    if (!token) {
      throw new Error("Authentication required");
    }

    return request(`/bills/${billId}/confirm`, token, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
