import { Connection } from '@solana/web3.js';
import { BlockData, TransactionData, SearchResult, InstructionData, AccountData } from '@/lib/types';

const DEFAULT_BLOCK_LIMIT = 10;

export class SolanaService {
    private connection: Connection;
    private blockCache: Map<number, BlockData> = new Map();
    private blockHashToSlotMap: Map<string, number> = new Map();
    private transactionCache: Map<string, TransactionData> = new Map();

    constructor(endpoint: string=process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com') {
        this.connection = new Connection(endpoint, 'confirmed');
    }  
    /**
     * Get Latest Slot
     * @returns Promise of type number of the latest slot
     */
    async getLatestSlot(): Promise<number> {
        try {
            const slot = await this.connection.getSlot();
            return slot
        } catch (error) {
            console.error("Error fetching latest slot: ", error);
            throw new Error('Failed to get latest slot from the network')
        }
    }

    /**
     * Get Recent Blocks and store it into a list
     * @param limit Number of blocks to fetch
     * @returns Promise of an array of block slots
     */
    async getRecentBlocks(limit: number = DEFAULT_BLOCK_LIMIT) : Promise<number[]> {
        try {
            const slot = await this.getLatestSlot();

            if (slot <= 0) {
                console.warn('Current slot is 0 or negative, returning an empty list of recent blocks');
                return [];
            }

            const slots: number[] = [];
            for (let i = 0; i < limit; i++) {
                if (slot - i >=0) {
                    slots.push(slot -i);
                }
            }
            return slots;
        } catch (error) {
            console.error('Error fetching recent blocks:', error);
            return [];
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
            console.error("Error getting epoch info", error)
            return 0
        }
    }

    /**
     * Get Block Information
     * @param slot Slot number of the block
     * @returns Promise resolving to BlockData object or null if not found
     */
    async getBlockDetails(slot: number): Promise<BlockData | null> {
        
        // Check block is cached first
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

            let parentLeader = '';
            let currentLeader = '';
            let childLeader = '';

            try {
                const publicKeys = await this.connection.getSlotLeaders(block.parentSlot, 3)
                parentLeader = publicKeys[0]?.toBase58() || '';
                currentLeader = publicKeys[1]?.toBase58() || '';
                childLeader = publicKeys[2]?.toBase58() || '';
            } catch (error) {
                console.warn('Error using direct getSlotLeader Call', error);
            }

            const epoch = await this.connection.getEpochInfo();

            let parentBlockHash = ''
            try {
                const parentBlock = await this.connection.getBlock(block.parentSlot, {
                    maxSupportedTransactionVersion: 0,
                });
                if (parentBlock) {
                    parentBlockHash = parentBlock.blockhash;
                }
            } catch (error) {
                console.warn('Error getting parent block hash', error)
            }

            const transaction: TransactionData[] = []
            const processedTransactions = block.transactions?.length || 0;
            let successfulTransactions = 0;

            if (block.transactions && block.transactions.length > 0) {
                // Process each transaction in the block
                for (const tx of block.transactions) {
                    // Check if transaction was successful
                    const isSuccess = tx.meta && tx.meta.err === null;
                    if (isSuccess) {
                        successfulTransactions++;
                    }
                    
                    // Get transaction signature (first one if there are multiple)
                    const signature = tx.transaction.signatures[0] || '';

                    let computeUnits: number | null = null;
                    if (tx.meta && tx.meta.computeUnitsConsumed) {
                        if (tx.meta.computeUnitsConsumed <= 2100) {
                            computeUnits = 0
                        }
                        else {
                            computeUnits = tx.meta.computeUnitsConsumed;
                        }
                    }
                    
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
                    transaction.push(transactionData);
                    this.transactionCache.set(signature, transactionData);
                }
            }

            const blockData: BlockData = {
                blockhash: block.blockhash, 
                parentSlot: block.parentSlot,
                slot: slot,
                blockTime: block.blockTime,
                blockHeight: block.blockTime,
                transaction: transaction,
                slotLeader: currentLeader,
                parentSlotLeader: parentLeader,
                childSlotLeader: childLeader,
                childSlot: slot+1,
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

    private extractInstructions(transaction: any): InstructionData[] {
        const instructions: InstructionData[] = [];
        
        try {
            // Check for basic instructions
            if (transaction?.transaction?.message?.instructions) {
                for (const instruction of transaction.transaction.message.instructions) {
                    try {
                        instructions.push({
                            programId: instruction.programId?.toBase58() || '',
                            accounts: instruction.accounts?.map((accountIndex: number) => 
                                transaction.transaction.message.accountKeys[accountIndex]?.toBase58() || ''
                            ) || [],
                            data: instruction.data?.toString('hex') || '',
                        });
                    } catch (err) {
                        console.error('Error processing instruction:', err);
                        // Add a placeholder or partial data instead of failing the entire method
                        instructions.push({
                            programId: 'error-processing',
                            accounts: [],
                            data: '',
                        });
                    }
                }
            }
            
            if (transaction?.meta?.innerInstructions) {
                for (const innerInstructionSet of transaction.meta.innerInstructions) {
                    for (const innerInstruction of innerInstructionSet.instructions) {
                        try {
                            instructions.push({
                                programId: innerInstruction.programId?.toBase58() || '',
                                accounts: innerInstruction.accounts?.map((accountIndex: number) => 
                                    transaction.transaction.message.accountKeys[accountIndex]?.toBase58() || ''
                                ) || [],
                                data: innerInstruction.data?.toString('hex') || '',
                                isInner: true,
                            });
                        } catch (err) {
                            console.error('Error processing inner instruction:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting instructions:', error);
        }
        
        return instructions;
    }

    private async extractAccounts(transaction: any): Promise<AccountData[]> {
        const accounts: AccountData[] = [];
        if (transaction.transaction.message.accountKeys) {
            for (let i = 0; i < transaction.transaction.message.accountKeys.length; i++) {
                const accountKey = transaction.transaction.message.accountKeys[i];
                const accountData: AccountData = {
                    pubKey: accountKey.toBase58(),
                    writable: transaction.transaction.message.isAccountWritable(accountKey, false),
                    signer: transaction.transaction.message.isAccountSigner(accountKey, false),
                };
    
                //  Logic to determine change and postBalance
                try {
                    if (transaction.meta && transaction.meta.preBalances && transaction.meta.postBalances) {
                        accountData.change = transaction.meta.postBalances[i] - transaction.meta.preBalances[i];
                        accountData.balance = transaction.meta.postBalances[i];
                    }
                } catch (error) {
                    console.error(`Error processing account ${accountKey.toBase58()}:`, error);
                    accountData.change = null;
                    accountData.balance = null;
                    accountData.details = null;
                }
    
                accounts.push(accountData);
            }
        }
        return accounts;
    }

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
            // Check if the signature is a valid base58 string
            if (!/^[A-Za-z0-9]{88}$/.test(signature)) {
                throw new Error(`Invalid transaction signature format: ${signature}`);
            }

            const transaction = await this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!transaction) {
                return null;
            }

            let computeUnits: number | undefined = undefined;
            if (transaction.meta?.computeUnitsConsumed) {
                computeUnits = transaction.meta.computeUnitsConsumed;
            }

            const status = await this.connection.getSignatureStatus(signature , {
                searchTransactionHistory: true
            });

            const version = transaction.version === 'legacy' ? 'LEGACY' : (transaction.version === 0 ? 'V0' : 'UNKNOWN')
            
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

            try {
                transactionData.accounts = await this.extractAccounts(transaction);
            } catch (accountError) {
                console.error('Error extracting accounts:', accountError);
                transactionData.accounts = [];
            }
    
            // Extract instructions with proper error handling
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
     * Search for block or transaction by hash/signature
     * @param query block hash or transaction signature
     * @returns Promise resolving to SearchResult object
     */
    async searchByHash(query: string): Promise<SearchResult> {
        console.log(this.blockCache);
        // first try transaction
        if (/^[A-Za-z0-9]{88}$/.test(query)) {
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

            const recentSlots = await this.getRecentBlocks(DEFAULT_BLOCK_LIMIT);
            const blocks = await Promise.all(
                recentSlots.map(slot => this.getBlockDetails(slot))
            )
            const matchingBlock = blocks.find(block => block && block.blockhash === query);
            if (matchingBlock) {
                return {
                    type: 'block',
                    data: matchingBlock,
                }
            }
            return {
                type: 'not-found',
                data: {
                    message: 'Block hash not found in recent blocks'
                }
            }
        } catch (error) {
            console.error('Error searching for block via hash:', error);
        }
        return {
            type: 'not-found',
            data: null
        }
    }
}