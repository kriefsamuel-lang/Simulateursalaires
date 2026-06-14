export default function Header() {
  return (
    <header className="bg-navy text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
          <span className="text-navy font-bold text-lg">KE</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Simulateur de Charges Salariales</h1>
          <p className="text-sm text-gold opacity-90">Cabinet Krief Expertise · Jerusalem</p>
        </div>
      </div>
    </header>
  );
}
