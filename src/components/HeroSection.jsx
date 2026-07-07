export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-6">
  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950/90"></div>
  <div className="max-w-4xl relative z-10">
        <span className="inline-block px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-400 text-xs uppercase tracking-widest mb-6">
          AI Football Strategy Platform
        </span>

        <h1 className="text-5xl md:text-7xl font-black mb-6">
          Manage Football Like A
          <span className="block text-cyan-400">
            Tactical Genius
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Analyze matches, deploy strategies, track results,
          and manage your football intelligence dashboard.
        </p>

        <a
          href="#dashboard"
          className="inline-flex items-center px-8 py-4 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all"
        >
          Launch Dashboard →
        </a>
      </div>
    </section>
  );
}