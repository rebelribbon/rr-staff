export default function Home() {
  if (typeof window !== "undefined") window.location.replace("/signin");
  return null;
}
