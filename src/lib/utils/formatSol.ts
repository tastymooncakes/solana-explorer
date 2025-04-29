export const formatSol = (lamports: number | undefined) => {
    if (lamports === undefined) return 'N/A';
    const solVal = (lamports / 1000000000).toFixed(9);
    return solVal;
}