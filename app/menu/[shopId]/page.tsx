import MenuViewer from "@/components/MenuViewer";

// In a real app, this would fetch the menu from Firebase based on the shopId
export default async function ShopMenuPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const shopId = (await params).shopId;
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <MenuViewer shopId={shopId} />
    </div>
  );
}
