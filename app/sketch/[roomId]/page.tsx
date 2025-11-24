import { Metadata } from "next";
import PlanckSketch from "@/components/PlanckSketch";

type Props = {
  params: Promise<{ roomId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Sketch Room: ${roomId} - Planck`,
    description: "Real-time collaboration whiteboard",
  };
}

export default async function SketchPage({ params }: Props) {
  const { roomId } = await params;
  return <PlanckSketch roomId={roomId} />;
}

