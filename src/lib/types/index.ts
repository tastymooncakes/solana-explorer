export interface BlockData {
    blockhash: string;
    parentSlot: number;
    slot: number;
    blockTime?: number | null;
    blockHeight?: number | null;
    transaction?: TransactionData[];
    slotLeader: string;
    childSlot: number;
    childSlotLeader: string;
    parentSlotLeader: string;
    parentBlockHash: string;
    processedTransactions?: number;
    successfulTransactions?: number;
    epoch?: number;
}

export interface TransactionData {
    signature: string;
    slot: number;
    blockTime?: number | null;
    success: boolean | null;
    fee?: number;
    computeUnits?: number | null;
    confirmationStatus?: 'processed' | 'confirmed' | 'finalized' | string;
    confirmations?: number | 'max';
    recentBlockHash?: string;
    version?: string;
}

export interface SearchResult {
    type: 'block' | 'transaction' | 'address' | 'not-found';
    data: BlockData | TransactionData | null | { message?: string};
}

export interface InstructionData {
    programId: string;
    accounts: string[];
    data: string;
}

export interface SortOptions {
    field: 'blockTime' | 'slot';
    description: 'asc' | 'desc';
}

export interface AccountData {
    pubKey: string;
    writable: boolean;
    signer: boolean;
    programOwner?: string;
    balance?: number;
    displayName?: string;
}