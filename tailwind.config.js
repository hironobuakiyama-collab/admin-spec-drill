module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        line: "var(--line)",
        brand: "var(--brand)",
        brandText: "var(--brand-text)",
        brandSoft: "var(--brand-soft)",
        band: "var(--band)",
        onBand: "var(--on-band)",
        btn: "var(--btn)",
        btnHover: "var(--btn-hover)",
        onBtn: "var(--on-btn)",
        ok: "var(--ok)",
        okSoft: "var(--ok-soft)",
        ng: "var(--ng)",
        ngSoft: "var(--ng-soft)",
        warn: "var(--warn)",
        warnSoft: "var(--warn-soft)"
      }
    }
  }
};
