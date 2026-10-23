import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="container px-4 py-24 text-center">
      <h1 className="text-2xl font-bold mb-3">Você está offline</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Verifique sua conexão com a internet e tente novamente.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
