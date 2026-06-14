export function Monogram({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center border-2 border-gold bg-navy font-serif font-bold text-gold"
      style={{ width: size, height: size, fontSize: size * 0.42, letterSpacing: 1 }}
    >
      KE
    </div>
  );
}

export default function Header() {
  return (
    <header className="bg-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
        <Monogram />
        <div>
          <h1 className="text-xl font-bold tracking-wide">
            Krief Expertise <span className="font-normal text-gold">· Jérusalem</span>
          </h1>
          <p className="text-sm text-slate-300">
            Simulateur fiscal indépendants (עצמאים) — impôt, ביטוח לאומי, מקדמות
          </p>
        </div>
      </div>
      <div className="h-1 bg-gold" />
    </header>
  );
}
