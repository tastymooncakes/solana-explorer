import { Connection } from '@solana/web3.js';
import { BlockData, TransactionData, SearchResult, InstructionData, AccountData } from '@/lib/types';

const DEFAULT_BLOCK_LIMIT = 10;

/**
 * Solana Service for interacting with Solana blockchain
 */
export class SolanaService {
    private connection: Connection;
    private blockCache: Map<number, BlockData> = new Map();
    private blockHashToSlotMap: Map<string, number> = new Map();
    private transactionCache: Map<string, TransactionData> = new Map();

    constructor(endpoint: string = process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com') {
        this.connection = new Connection(endpoint, 'confirmed');
    }

    // -------------------------------------------------------------------------
    // Connection-related methods
    // -------------------------------------------------------------------------

    /**
     * Get Latest Slot
     * @returns Promise of type number of the latest slot
     */
    async getLatestSlot(): Promise<number> {
        try {
            const slot = await this.connection.getSlot();
            return slot;
        } catch (error) {
            console.error("Error fetching latest slot: ", error);
            throw new Error('Failed to get latest slot from the network');
        }
    }

    /**
     * Get the current epoch
     * @returns Promise resolving to the current epoch
     */
    async getEpoch(): Promise<number> {
        try {
            const epochInfo = await this.connection.getEpochInfo();
            return epochInfo.epoch;
        } catch (error) {
            console.error("Error getting epoch info", error);
            return 0;
        }
    }

    // -------------------------------------------------------------------------
    // Block-related methods
    // -------------------------------------------------------------------------

    /**
     * Get Recent Blocks and store it into a list
     * @param limit Number of blocks to fetch
     * @returns Promise of an array of block slots
     */
    async getRecentBlocks(limit: number = DEFAULT_BLOCK_LIMIT): Promise<number[]> {
        try {
            const slot = await this.getLatestSlot();

            if (slot <= 0) {
                console.warn('Current slot is 0 or negative, returning an empty list of recent blocks');
                return [];
            }

            const slots: number[] = [];
            for (let i = 0; i < limit; i++) {
                if (slot - i >= 0) {
                    slots.push(slot - i);
                }
            }
            return slots;
        } catch (error) {
            console.error('Error fetching recent blocks:', error);
            return [];
        }
    }

    /**
     * Get Block Information
     * @param slot Slot number of the block
     * @returns Promise resolving to BlockData object or null if not found
     */
    async getBlockDetails(slot: number): Promise<BlockData | null> {
        // Check if block is cached first
        if (this.blockCache.has(slot)) {
            return this.blockCache.get(slot) || null;
        }
        
        try {
            // Validate that the slot is non-negative integer
            if (!Number.isInteger(slot) || slot < 0) {
                throw new Error(`Invalid slot number: ${slot}. Slot must be a non-negative integer.`);
            }

            const block = await this.connection.getBlock(slot, {
                maxSupportedTransactionVersion: 0,
            });

            if (!block) {
                return null;
            }

            // Get slot leaders
            const [parentLeader, currentLeader, childLeader] = await this.getSlotLeaders(block.parentSlot);

            // Get epoch info
            const epoch = await this.connection.getEpochInfo();

            // Get parent block hash
            const parentBlockHash = await this.getParentBlockHash(block.parentSlot);

            // Process transactions
            const { transactions, processedTransactions, successfulTransactions } = 
                await this.processBlockTransactions(block, slot);

            const blockData: BlockData = {
                blockhash: block.blockhash,
                parentSlot: block.parentSlot,
                slot: slot,
                blockTime: block.blockTime,
                blockHeight: block.blockTime,
                transaction: transactions,
                slotLeader: currentLeader,
                parentSlotLeader: parentLeader,
                childSlotLeader: childLeader,
                childSlot: slot + 1,
                epoch: epoch.epoch,
                parentBlockHash: parentBlockHash,
                processedTransactions: processedTransactions,
                successfulTransactions: successfulTransactions,
            };
            
            this.blockCache.set(slot, blockData);
            this.blockHashToSlotMap.set(block.blockhash, slot);
            return blockData;
        } catch (error) {
            console.error('Error fetching block details:', error);
            return null;
        }
    }

    /**
     * Get slot leaders for a given starting slot
     * @param startSlot Starting slot
     * @returns Array of [parentLeader, currentLeader, childLeader] as Base58 strings
     */
    private async getSlotLeaders(startSlot: number): Promise<[string, string, string]> {
        let parentLeader = '';
        let currentLeader = '';
        let childLeader = '';

        try {
            const publicKeys = await this.connection.getSlotLeaders(startSlot, 3);
            parentLeader = publicKeys[0]?.toBase58() || '';
            currentLeader = publicKeys[1]?.toBase58() || '';
            childLeader = publicKeys[2]?.toBase58() || '';
        } catch (error) {
            console.warn('Error using direct getSlotLeader Call', error);
        }

        return [parentLeader, currentLeader, childLeader];
    }

    /**
     * Get parent block hash
     * @param parentSlot Parent slot number
     * @returns Parent block hash or empty string if not found
     */
    private async getParentBlockHash(parentSlot: number): Promise<string> {
        let parentBlockHash = '';
        try {
            const parentBlock = await this.connection.getBlock(parentSlot, {
                maxSupportedTransactionVersion: 0,
            });
            if (parentBlock) {
                parentBlockHash = parentBlock.blockhash;
            }
        } catch (error) {
            console.warn('Error getting parent block hash', error);
        }
        return parentBlockHash;
    }

    /**
     * Process transactions for a block
     * @param block Block data from RPC
     * @param slot Block slot number
     * @returns Object containing transactions array and stats
     */
    private async processBlockTransactions(block: any, slot: number): Promise<{
        transactions: TransactionData[],
        processedTransactions: number,
        successfulTransactions: number
    }> {
        const transactions: TransactionData[] = [];
        const processedTransactions = block.transactions?.length || 0;
        let successfulTransactions = 0;

        if (block.transactions && block.transactions.length > 0) {
            for (const tx of block.transactions) {
                // Check if transaction was successful
                const isSuccess = tx.meta && tx.meta.err === null;
                if (isSuccess) {
                    successfulTransactions++;
                }
                
                // Get transaction signature (first one if there are multiple)
                const signature = tx.transaction.signatures[0] || '';

                // Calculate compute units
                const computeUnits = this.calculateComputeUnits(tx);
                
                // Create transaction data object
                const transactionData: TransactionData = {
                    signature: signature,
                    slot: slot,
                    blockTime: block.blockTime,
                    success: isSuccess,
                    fee: tx.meta?.fee,
                    computeUnits: computeUnits,
                };
                
                // Add to transactions array and cache
                transactions.push(transactionData);
                this.transactionCache.set(signature, transactionData);
            }
        }

        return { transactions, processedTransactions, successfulTransactions };
    }

    /**
     * Calculate compute units for a transaction
     * @param tx Transaction data
     * @returns Compute units or null
     */
    private calculateComputeUnits(tx: any): number | null {
        let computeUnits: number | null = null;
        if (tx.meta && tx.meta.computeUnitsConsumed) {
            if (tx.meta.computeUnitsConsumed <= 2400) {
                computeUnits = 0;
            } else {
                computeUnits = tx.meta.computeUnitsConsumed;
            }
        }
        return computeUnits;
    }

    // -------------------------------------------------------------------------
    // Transaction-related methods
    // -------------------------------------------------------------------------

    /**
     * Get Transaction Information
     * @param signature Transaction Signature
     * @returns Promise resolving to TransactionData object or null if not found
     */
    async getTransaction(signature: string): Promise<TransactionData | null> {
        // Check transaction is cached first
        if (this.transactionCache.has(signature)) {
            return this.transactionCache.get(signature) || null;
        }

        try {
            // Validate signature format
            if (!this.isValidSignature(signature)) {
                throw new Error(`Invalid transaction signature format: ${signature}`);
            }

            // Fetch transaction data
            const transaction = await this.fetchRawTransaction(signature);
            if (!transaction) {
                return null;
            }

            // Get compute units
            const computeUnits = transaction.meta?.computeUnitsConsumed;

            // Get signature status
            const status = await this.connection.getSignatureStatus(signature, {
                searchTransactionHistory: true
            });

            // Determine transaction version
            const version = this.determineTransactionVersion(transaction);
            
            // Create transaction data object
            const transactionData: TransactionData = {
                signature: signature,
                slot: transaction.slot,
                blockTime: transaction.blockTime,
                success: transaction.meta ? transaction.meta.err === null : false,
                fee: transaction.meta ? transaction.meta.fee : undefined,
                computeUnits: computeUnits,
                confirmationStatus: status?.value?.confirmationStatus?.toUpperCase() || 'FINALIZED',
                confirmations: status?.value?.confirmations ?? 'max',
                recentBlockHash: transaction.transaction?.message?.recentBlockhash,
                version: version,
                logs: transaction.meta?.logMessages || [],
                accounts: [],
                instructions: []
            };

            // Extract accounts
            try {
                transactionData.accounts = await this.extractAccounts(transaction);
            } catch (accountError) {
                console.error('Error extracting accounts:', accountError);
                transactionData.accounts = [];
            }
    
            // Extract instructions
            try {
                transactionData.instructions = this.extractInstructions(transaction);
            } catch (instructionError) {
                console.error('Error extracting instructions:', instructionError);
                transactionData.instructions = [];
            }

            this.transactionCache.set(signature, transactionData);
            return transactionData;

        } catch (error) {
            console.error('Error fetching transaction:', error);
            return null;
        }
    }

    /**
     * Validate transaction signature format
     * @param signature Transaction signature
     * @returns Boolean indicating if signature is valid
     */
    private isValidSignature(signature: string): boolean {
        return /^[A-HJ-NP-Za-km-z1-9]+$/.test(signature);
    }

    /**
     * Fetch raw transaction data from RPC
     * @param signature Transaction signature
     * @returns Raw transaction data or null if not found
     */
    private async fetchRawTransaction(signature: string): Promise<any> {
        const response = await (this.connection as any)._rpcRequest('getTransaction', [
            signature,
            {
                encoding: 'json',
                maxSupportedTransactionVersion: 0
            }
        ]);

        // Handle RPC errors
        if (response.error) {
            console.error("Transaction RPC error:", response.error);
            return null;
        }

        return response.result;
    }

    /**
     * Determine transaction version
     * @param transaction Raw transaction data
     * @returns Transaction version string
     */
    private determineTransactionVersion(transaction: any): string {
        return transaction.version === 'legacy' ? 'LEGACY' : 
               (transaction.version === 0 ? 'V0' : 'UNKNOWN');
    }

    /**
     * Extract instructions from a transaction
     * @param transaction Raw transaction data
     * @returns Array of instruction data
     */
    private extractInstructions(transaction: any): InstructionData[] {
        const mainInstructions: InstructionData[] = [];
        
        try {
            this.logTransactionStructure(transaction);
            
            // Get account keys
            const accountKeys = transaction.transaction?.message?.accountKeys || [];
            console.log("Total account keys:", accountKeys.length);
            
            // Extract main instructions
            const mainInstructionsData = transaction.transaction?.message?.instructions || [];
            console.log(`Found ${mainInstructionsData.length} main instructions`);
            
            // Process main instructions first
            this.processMainInstructions(mainInstructionsData, accountKeys, mainInstructions);
            
            // Process inner instructions and organize them hierarchically
            this.processInnerInstructions(transaction, accountKeys, mainInstructions);
            
            console.log(`Extraction complete. Total main instructions: ${mainInstructions.length}`);
            console.log(`Total inner instructions: ${mainInstructions.reduce((count, inst) => count + (inst.childInstructions?.length || 0), 0)}`);
            
        } catch (error) {
            console.error('Error extracting instructions:', error);
        }
        
        return mainInstructions;
    }

    /**
     * Log transaction structure for debugging
     * @param transaction Raw transaction data
     */
    private logTransactionStructure(transaction: any): void {
        console.log("Transaction structure for instructions:", {
            hasTransaction: !!transaction.transaction,
            hasMessage: !!transaction.transaction?.message,
            hasInstructions: !!transaction.transaction?.message?.instructions,
            instructionsCount: transaction.transaction?.message?.instructions?.length || 0,
            hasInnerInstructions: !!transaction.meta?.innerInstructions,
            innerInstructionsCount: transaction.meta?.innerInstructions?.length || 0
        });
    }

    /**
     * Process main instructions from transaction data
     * @param mainInstructionsData Raw instructions data
     * @param accountKeys Account keys array
     * @param mainInstructions Output array for processed instructions
     */
    private processMainInstructions(
        mainInstructionsData: any[], 
        accountKeys: any[], 
        mainInstructions: InstructionData[]
    ): void {
        mainInstructionsData.forEach((instruction: any, index: number) => {
            try {
                // Get program ID
                let programId = this.getProgramId(instruction, accountKeys, index);
                
                // Process accounts
                const accounts = this.getInstructionAccounts(instruction, accountKeys);
                
                // Create main instruction object with empty childInstructions array
                const instructionObj: InstructionData = {
                    programId,
                    accounts,
                    data: typeof instruction.data === 'string' ? instruction.data : '',
                    childInstructions: []  // Initialize empty array for child instructions
                };
                
                // Add to main instructions array
                mainInstructions.push(instructionObj);
                console.log(`Added main instruction ${index}, total count: ${mainInstructions.length}`);
                
            } catch (err) {
                console.error(`Error processing main instruction ${index}:`, err);
            }
        });
    }

    /**
     * Process inner instructions from transaction data
     * @param transaction Raw transaction data
     * @param accountKeys Account keys array
     * @param mainInstructions Array of main instructions to add inner instructions to
     */
    private processInnerInstructions(
        transaction: any,
        accountKeys: any[],
        mainInstructions: InstructionData[]
    ): void {
        const innerInstructionSets = transaction.meta?.innerInstructions || [];
        console.log(`Found ${innerInstructionSets.length} inner instruction sets`);
        
        innerInstructionSets.forEach((innerSet: any) => {
            const parentIndex = innerSet.index;
            console.log(`Processing inner set for main instruction ${parentIndex}`);
            
            // Find the parent instruction
            if (parentIndex >= 0 && parentIndex < mainInstructions.length) {
                const parentInstruction = mainInstructions[parentIndex];
                this.processInnerInstructionSet(innerSet, parentIndex, accountKeys, parentInstruction);
            } else {
                console.warn(`Invalid parent index ${parentIndex} for inner instruction set`);
            }
        });
    }

    /**
     * Process a set of inner instructions
     * @param innerSet Inner instruction set
     * @param parentIndex Parent instruction index
     * @param accountKeys Account keys array
     * @param parentInstruction Parent instruction to add inner instructions to
     */
    private processInnerInstructionSet(
        innerSet: any, 
        parentIndex: number, 
        accountKeys: any[], 
        parentInstruction: InstructionData
    ): void {
        // Process all inner instructions in this set
        if (innerSet.instructions && Array.isArray(innerSet.instructions)) {
            innerSet.instructions.forEach((innerInstruction: any, innerIndex: number) => {
                try {
                    // Get program ID
                    const programId = this.getProgramId(innerInstruction, accountKeys, innerIndex, true);
                    
                    // Process accounts
                    const accounts = this.getInstructionAccounts(innerInstruction, accountKeys);
                    
                    // Create inner instruction object
                    const innerInstructionObj: InstructionData = {
                        programId,
                        accounts,
                        data: typeof innerInstruction.data === 'string' ? innerInstruction.data : '',
                        isInner: true,
                        parentIndex: parentIndex,
                        innerIndex: innerIndex,
                        mainInstructionIndex: parentIndex
                    };
                    
                    // Add to parent's childInstructions array
                    parentInstruction.childInstructions!.push(innerInstructionObj);
                    console.log(`Added inner instruction to parent ${parentIndex}, inner index ${innerIndex}`);
                    
                } catch (err) {
                    console.error(`Error processing inner instruction ${innerIndex} for parent ${parentIndex}:`, err);
                }
            });
        }
    }

    /**
     * Get program ID from instruction
     * @param instruction Instruction data
     * @param accountKeys Account keys array
     * @param index Instruction index for logging
     * @param isInner Whether this is an inner instruction
     * @returns Program ID as a string
     */
    private getProgramId(
        instruction: any, 
        accountKeys: any[], 
        index: number,
        isInner: boolean = false
    ): string {
        let programId = '';
        const prefix = isInner ? 'Inner' : 'Main';
        
        if (instruction.programIdIndex !== undefined && instruction.programIdIndex < accountKeys.length) {
            programId = String(accountKeys[instruction.programIdIndex]);
            console.log(`${prefix} instruction ${index} program: ${programId}`);
        } else {
            console.warn(`Invalid ${prefix.toLowerCase()} program ID index: ${instruction.programIdIndex}`);
        }
        
        return programId;
    }

    /**
     * Get accounts referenced by an instruction
     * @param instruction Instruction data
     * @param accountKeys Account keys array
     * @returns Array of account public keys as strings
     */
    private getInstructionAccounts(instruction: any, accountKeys: any[]): string[] {
        const accounts: string[] = [];
        
        if (instruction.accounts && Array.isArray(instruction.accounts)) {
            for (const accountIndex of instruction.accounts) {
                if (accountIndex !== undefined && accountIndex < accountKeys.length) {
                    accounts.push(String(accountKeys[accountIndex]));
                } else {
                    console.warn(`Invalid account index: ${accountIndex}`);
                    accounts.push('');
                }
            }
        }
        
        return accounts;
    }

    /**
     * Extract accounts from a transaction
     * @param transaction Raw transaction data
     * @returns Array of account data
     */
    private async extractAccounts(transaction: any): Promise<AccountData[]> {
        const accounts: AccountData[] = [];
        
        try {
            console.log("Extracting accounts from transaction with lookup table support...");
            
            // Get base and loaded account keys
            const { allAccountKeys, baseAccountKeys, loadedWritableAddresses } = 
                this.getTransactionAccountKeys(transaction);
            
            if (allAccountKeys.length === 0) {
                return accounts;
            }
            
            // Get message header
            const header = this.getTransactionHeader(transaction);
            if (!header) {
                return accounts;
            }
            
            // Get balance information
            const { preBalances, postBalances } = this.getTransactionBalances(transaction);
            
            // Calculate account types based on header and loaded addresses
            const numRequiredSignatures = header.numRequiredSignatures || 0;
            const numReadonlySignedAccounts = header.numReadonlySignedAccounts || 0;
            const numReadonlyUnsignedAccounts = header.numReadonlyUnsignedAccounts || 0;
            
            // Parse account information for all accounts
            for (let i = 0; i < allAccountKeys.length; i++) {
                accounts.push(this.createAccountData(
                    i, allAccountKeys, baseAccountKeys, loadedWritableAddresses,
                    numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts,
                    preBalances, postBalances
                ));
            }
            
            console.log(`Successfully extracted ${accounts.length} accounts`);
            
        } catch (error) {
            console.error("Error extracting accounts:", error);
        }
        
        return accounts;
    }

    /**
     * Get base and loaded account keys from transaction
     * @param transaction Raw transaction data
     * @returns Object containing account key arrays
     */
    private getTransactionAccountKeys(transaction: any): {
        allAccountKeys: string[],
        baseAccountKeys: string[],
        loadedWritableAddresses: string[],
        loadedReadonlyAddresses: string[]
    } {
        let baseAccountKeys: string[] = [];
        let loadedReadonlyAddresses: string[] = [];
        let loadedWritableAddresses: string[] = [];
        
        // Get base account keys
        if (transaction?.transaction?.message?.accountKeys) {
            baseAccountKeys = transaction.transaction.message.accountKeys.map(String);
            console.log(`Found ${baseAccountKeys.length} base account keys in transaction.transaction.message.accountKeys`);
        } else if (transaction?.message?.accountKeys) {
            baseAccountKeys = transaction.message.accountKeys.map(String);
            console.log(`Found ${baseAccountKeys.length} base account keys in transaction.message.accountKeys`);
        } else {
            console.error("Could not locate base account keys in transaction");
            return { allAccountKeys: [], baseAccountKeys: [], loadedWritableAddresses: [], loadedReadonlyAddresses: [] };
        }
        
        // Get loaded addresses
        if (transaction?.meta?.loadedAddresses) {
            if (Array.isArray(transaction.meta.loadedAddresses.readonly)) {
                loadedReadonlyAddresses = transaction.meta.loadedAddresses.readonly.map(String);
                console.log(`Found ${loadedReadonlyAddresses.length} loaded readonly addresses`);
            }
            
            if (Array.isArray(transaction.meta.loadedAddresses.writable)) {
                loadedWritableAddresses = transaction.meta.loadedAddresses.writable.map(String);
                console.log(`Found ${loadedWritableAddresses.length} loaded writable addresses`);
            }
        }
        
        // Combine all account keys
        const allAccountKeys = [...baseAccountKeys, ...loadedWritableAddresses, ...loadedReadonlyAddresses];
        console.log(`Combined ${allAccountKeys.length} total account keys (base + loaded)`);
        
        return { allAccountKeys, baseAccountKeys, loadedWritableAddresses, loadedReadonlyAddresses };
    }

    /**
     * Get transaction message header
     * @param transaction Raw transaction data
     * @returns Message header or null if not found
     */
    private getTransactionHeader(transaction: any): any {
        let header;
        if (transaction?.transaction?.message?.header) {
            header = transaction.transaction.message.header;
        } else if (transaction?.message?.header) {
            header = transaction.message.header;
        } else {
            console.error("Transaction message header is missing");
            return null;
        }
        
        console.log("Message header:", header);
        return header;
    }

    /**
     * Get pre and post balances from transaction
     * @param transaction Raw transaction data
     * @returns Object containing pre and post balance arrays
     */
    private getTransactionBalances(transaction: any): {
        preBalances: number[],
        postBalances: number[]
    } {
        let preBalances: number[] = [];
        let postBalances: number[] = [];
        
        if (transaction?.meta?.preBalances) {
            preBalances = transaction.meta.preBalances;
        }
        
        if (transaction?.meta?.postBalances) {
            postBalances = transaction.meta.postBalances;
        }
        
        console.log(`Pre-balances: ${preBalances.length}, Post-balances: ${postBalances.length}`);
        
        return { preBalances, postBalances };
    }

    /**
     * Create account data for a single account
     * @param index Account index
     * @param allAccountKeys All account keys
     * @param baseAccountKeys Base account keys
     * @param loadedWritableAddresses Loaded writable addresses
     * @param numRequiredSignatures Number of required signatures
     * @param numReadonlySignedAccounts Number of readonly signed accounts
     * @param numReadonlyUnsignedAccounts Number of readonly unsigned accounts
     * @param preBalances Pre-transaction balances
     * @param postBalances Post-transaction balances
     * @returns Account data object
     */
    private createAccountData(
        index: number,
        allAccountKeys: string[],
        baseAccountKeys: string[],
        loadedWritableAddresses: string[],
        numRequiredSignatures: number,
        numReadonlySignedAccounts: number,
        numReadonlyUnsignedAccounts: number,
        preBalances: number[],
        postBalances: number[]
    ): AccountData {
        const pubKey = allAccountKeys[index];
        
        // Determine if account is writable and signer
        let isWritable = false;
        let isSigner = false;
        
        // For base accounts, use header information
        if (index < baseAccountKeys.length) {
            isSigner = index < numRequiredSignatures;
            isWritable = 
                (isSigner && index < numRequiredSignatures - numReadonlySignedAccounts) || 
                (!isSigner && index >= numRequiredSignatures && index < baseAccountKeys.length - numReadonlyUnsignedAccounts);
        } 
        // For loaded addresses, use their classification
        else {
            const loadedIndex = index - baseAccountKeys.length;
            isWritable = loadedIndex < loadedWritableAddresses.length;
            isSigner = false; // Loaded addresses are never signers
        }
        
        // Get pre and post balances if available
        let preBalance = null;
        let postBalance = null;
        let balanceChange = null;
        
        if (preBalances && postBalances) {
            if (index < preBalances.length) {
                preBalance = preBalances[index];
            }
            
            if (index < postBalances.length) {
                postBalance = postBalances[index];
            }
            
            // Calculate balance change
            if (preBalance !== null && postBalance !== null) {
                balanceChange = postBalance - preBalance;
            }
        }
        
        // Create account data
        return {
            pubKey,
            writable: isWritable,
            signer: isSigner,
            balance: postBalance,
            change: balanceChange
        };
    }

    // -------------------------------------------------------------------------
    // Search-related methods
    // -------------------------------------------------------------------------

    /**
     * Search for block or transaction by hash/signature
     * @param query block hash or transaction signature
     * @returns Promise resolving to SearchResult object
     */
    async searchByHash(query: string): Promise<SearchResult> {
        // First try transaction (signatures are 88 characters)
        if (/^[A-Za-z0-9]{87,88}$/.test(query)) {
            try {
                const transaction = await this.getTransaction(query);
                if (transaction) {
                    return {
                        type: 'transaction',
                        data: transaction
                    };
                }
            } catch (error) {
                // Not valid transaction signature, continue to block search
                console.error('Error in transaction search:', error);
            }
        }

        // Block Search
        try {
            // Check in the block hash to slot map
            if (this.blockHashToSlotMap.has(query)) {
                const slot = this.blockHashToSlotMap.get(query)!;
                const blockData = await this.getBlockDetails(slot);
                
                if (blockData) {
                    return {
                        type: 'block',
                        data: blockData
                    };
                }
            }

            // If not found in cache, look through recent blocks
            return await this.searchInRecentBlocks(query);
        } catch (error) {
            console.error('Error searching for block via hash:', error);
        }
        
        return {
            type: 'not-found',
            data: null
        };
    }

    /**
     * Search for a block hash in recent blocks
     * @param hash Block hash to search for
     * @returns SearchResult object
     */
    private async searchInRecentBlocks(hash: string): Promise<SearchResult> {
        const recentSlots = await this.getRecentBlocks(DEFAULT_BLOCK_LIMIT);
        const blocks = await Promise.all(
            recentSlots.map(slot => this.getBlockDetails(slot))
        );
        
        const matchingBlock = blocks.find(block => block && block.blockhash === hash);
        if (matchingBlock) {
            return {
                type: 'block',
                data: matchingBlock,
            };
        }
        
        return {
            type: 'not-found',
            data: {
                message: 'Block hash not found in recent blocks'
            }
        };
    }
}