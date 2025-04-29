export async function generateMetadata({ params }: { params: { slot: string } }) {
  const { slot } = await Promise.resolve(params); // ensures compatibility with async behavior
  return {
    title: `Block | ${slot} | Solana Explorer`,
    description: `Details for Solana block #${slot}`,
  };
}
  
export default function BlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}