import GeometryCanvas from '@/components/GeometryCanvas';

export const metadata = {
  title: "Geometry Canvas",
  description: "Geometry canvas",
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      
      <GeometryCanvas />
    </main>
  );
}