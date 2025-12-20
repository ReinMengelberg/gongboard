import bcrypt from 'bcryptjs';

export class Hash {
    /**
     * Hash a plain text password
     * @param password - The plain text password to hash
     * @param saltRounds - The cost factor for hashing (default: 10)
     * @returns Promise resolving to the hashed password
     */
    static async make(password: string, saltRounds: number = 10): Promise<string> {
        return bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify a plain text password against a hash
     * @param password - The plain text password to verify
     * @param hash - The hash to compare against
     * @returns Promise resolving to true if password matches, false otherwise
     */
    static async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Check if a given string needs to be rehashed
     * Useful when you want to update the salt rounds
     * @param hash - The hash to check
     * @param saltRounds - The desired salt rounds (default: 10)
     * @returns Whether the hash needs to be regenerated
     */
    static needsRehash(hash: string, saltRounds: number = 10): boolean {
        try {
            const rounds = bcrypt.getRounds(hash);
            return rounds !== saltRounds;
        } catch {
            return true;
        }
    }
}