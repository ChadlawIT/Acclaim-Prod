const MicrosoftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 11H0V0H11V11Z" fill="#F25022"/>
    <path d="M23 11H12V0H23V11Z" fill="#7FBA00"/>
    <path d="M11 23H0V12H11V23Z" fill="#00A4EF"/>
    <path d="M23 23H12V12H23V23Z" fill="#FFB900"/>
  </svg>
);

export function LoginRedesign() {
  return (
    <div className="min-h-screen flex font-['Inter']" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel — brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[32%] relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f2027 0%, #0d3d3d 55%, #005f5f 100%)" }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00b4b4 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #008b8b 0%, transparent 70%)" }}
        />

        <div className="relative z-10 p-10 pt-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <img src="/__mockup/images/acclaim-logo.png" alt="Acclaim" className="h-10 w-10 object-contain" />
            <div>
              <div className="text-white font-semibold text-lg leading-tight tracking-wide">Acclaim</div>
              <div className="text-teal-300 text-xs tracking-widest uppercase opacity-80">Credit Management</div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-white text-4xl font-bold leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            Your debt recovery<br />portal — made simple.
          </h1>
          <p className="text-teal-200 text-base opacity-75 leading-relaxed max-w-xs">
            Track cases, communicate with our team, and monitor your recovery progress — all in one secure place.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {[
              { icon: "📁", label: "Case Management", desc: "Track every case from open to resolution" },
              { icon: "💬", label: "Secure Messaging", desc: "Direct communication with our team" },
              { icon: "📊", label: "Analytics & Reports", desc: "Payment tracking and performance metrics" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{f.label}</div>
                  <div className="text-teal-300 text-xs opacity-70">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-10">
          <div className="border-t border-white/10 pt-6">
            <p className="text-white/40 text-xs">Part of Chadwick Lawrence LLP</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — sign in ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <img src="/__mockup/images/acclaim-logo.png" alt="Acclaim" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-gray-900">Acclaim</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.01em" }}>
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm">Sign in to access your portal account.</p>
          </div>

          {/* Divider label */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Sign in with
            </p>

            {/* Microsoft SSO button */}
            <button
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
              style={{ borderColor: "#e2e8f0" }}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </button>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Password login (collapsed/secondary) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@organisation.co.uk"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                style={{ borderColor: "#e2e8f0" }}
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                style={{ borderColor: "#e2e8f0" }}
                readOnly
              />
            </div>

            <div className="flex items-center justify-end">
              <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Forgot password?
              </button>
            </div>

            <button
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #008b8b 0%, #006666 100%)" }}
            >
              Sign in
            </button>
          </div>

          {/* Contact */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Need help?{" "}
              <a href="mailto:email@acclaim.law" className="text-teal-600 hover:underline font-medium">
                email@acclaim.law
              </a>
              {" "}·{" "}
              <a href="tel:01132258811" className="text-teal-600 hover:underline font-medium">
                0113 225 8811
              </a>
            </p>
            <p className="text-xs text-gray-300 mt-2">
              <a href="#" className="hover:text-gray-400">Terms of Use</a>
              {" · "}
              <a href="#" className="hover:text-gray-400">Privacy Notice</a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
