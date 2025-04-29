import { SolanaService } from "./solanaService";
import { SearchResult } from "@/lib/types";

const solanaService = new SolanaService();

export const searchService = {
    async search(query: string): Promise<SearchResult> {
        try {
            if (query.length >= 32 && /^[A-Za-z0-9]+$/.test(query)) {
                return await solanaService.searchByHash(query);
            }

            else if (!isNaN(Number(query))) {
                const slot = parseInt(query, 10);
                try {
                    const block = await solanaService.getBlockDetails(slot);
                    if (block) {
                        console.log(block);
                        return {
                            type: 'block',
                            data: block,
                        }
                    };
                } catch (error) {
                    console.error(`Error fetching block details #${slot}:`, error);
                    return {
                        type: 'not-found',
                        data: {
                            message: `Block #${slot} not found`,
                        }
                    }
                } 
            }
            return {
                type: 'not-found',
                data: {
                    message: 'No results found',
                }
            }
        } catch (error) {
            console.error('Search error: ', error);
            return {
                type: 'not-found',
                data: {
                    message: 'Error occurred while searching',
                }
            }
        }
    }
}