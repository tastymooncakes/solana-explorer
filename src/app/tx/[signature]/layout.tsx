export async function generateMetadata({ params }: { params: { transaction: string } }) {
    const { transaction } = await Promise.resolve(params); // ensures compatibility with async behavior
    return {
      title: `Transaction | ${transaction} | Solana Explorer`,
      description: `Details for Solana tx #${transaction}`,
    };
  }
    
  export default function TransactionLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  }