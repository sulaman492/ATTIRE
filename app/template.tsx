export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  // The transition lives in the persistent root layout so it can cover both
  // the outgoing and incoming page without resetting during navigation.
  return children;
}
