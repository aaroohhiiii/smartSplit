interface BillParsingResult {
    items: Array<{
        name: string;
        amount: number;
        category: string;
    }>;
    totalAmount: number;
    taxAmount: number;
}
/**
 * Parse bill image/PDF using Groq API with Vision capabilities
 * Supports JPEG, PNG, PDF files
 */
export declare const parseBillWithGroq: (fileBuffer: Buffer, filePath: string) => Promise<BillParsingResult>;
/**
 * Validate bill parsing result
 */
export declare const validateBillParsing: (result: BillParsingResult) => string[];
export {};
//# sourceMappingURL=llmService.d.ts.map