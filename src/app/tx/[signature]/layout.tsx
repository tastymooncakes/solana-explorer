export async function generateMetadata({ params }: { params: { signature: string } }) {
    const { signature } = await Promise.resolve(params); // ensures compatibility with async behavior
    return {
      title: `Transaction | ${signature} | Solana Explorer`,
      description: `Details for Solana tx #${signature}`,
    };
  }
    
  export default function TransactionLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  }