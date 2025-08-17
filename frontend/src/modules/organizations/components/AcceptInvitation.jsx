import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_CONFIG } from '../../../config/api.js';


function FullScreenPage({ children }) {
  // Fullscreen container to render the page without the dashboard layout
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        zIndex: 9999,
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}

const LENGTH_MIN = 8;

// Human-readable strength labels (UI stays in Spanish)
function strengthLabel(score) {
  if (score <= 1) return "Muy débil";
  if (score === 2) return "Débil";
  if (score === 3) return "Aceptable";
  if (score === 4) return "Fuerte";
  return "Muy fuerte";
}

// Simple checklist component for password rules
function PasswordChecklist({ rules }) {
  const Item = ({ ok, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span aria-hidden>{ok ? "✅" : "⬜"}</span>
      <span style={{ color: ok ? "#14532d" : "#374151" }}>{children}</span>
    </div>
  );
  return (
    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
      <Item ok={rules.minLength}>Mínimo {LENGTH_MIN} caracteres</Item>
      <Item ok={rules.upper}>Al menos 1 mayúscula</Item>
      <Item ok={rules.lower}>Al menos 1 minúscula</Item>
      <Item ok={rules.number}>Al menos 1 número</Item>
      <Item ok={rules.symbol}>Al menos 1 símbolo</Item>
      <Item ok={rules.noSpaces}>Sin espacios</Item>
      <Item ok={rules.noEmailPart}>Que no incluya tu correo</Item>
    </div>
  );
}

export default function AcceptInvitation() {
  const { token } = useParams();
const apiBase = API_CONFIG.BASE_SERVER || "http://localhost:3001";

  
  

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); 
  const [accepted, setAccepted] = useState(false);

  // Form state
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const emailLocal = useMemo(
    () => (data?.email ? String(data.email).split("@")[0] : ""),
    [data?.email]
  );

  const pwRules = useMemo(() => {
    const p = password ?? "";
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSymbol = /[^A-Za-z0-9\s]/.test(p);
    const noSpaces = !/\s/.test(p);
    const minLength = p.length >= LENGTH_MIN;
    const noEmailPart = emailLocal ? !p.toLowerCase().includes(emailLocal.toLowerCase()) : true;

    let score = 0;
    score += minLength ? 1 : 0;
    score += hasUpper ? 1 : 0;
    score += hasLower ? 1 : 0;
    score += hasNumber ? 1 : 0;
    score += hasSymbol ? 1 : 0;
    if (!noSpaces || !noEmailPart) score = Math.max(0, score - 1);

    return {
      upper: hasUpper,
      lower: hasLower,
      number: hasNumber,
      symbol: hasSymbol,
      noSpaces,
      minLength,
      noEmailPart,
      score,
    };
  }, [password, emailLocal]);

  const allValid =
    pwRules.minLength &&
    pwRules.upper &&
    pwRules.lower &&
    pwRules.number &&
    pwRules.symbol &&
    pwRules.noSpaces &&
    pwRules.noEmailPart;

  const passwordsMatch = password && password2 && password === password2;

  useEffect(() => {
    if (!token) return;
    let active = true;

    (async () => {
      setLoading(true);
      setVerifying(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(`${apiBase}/api/invitations/verify/${token}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const raw = await res.json();
          if (!active) return;
          const inv = raw?.invitation ?? raw;
          const normalized = {
            status: inv.status ?? "pending",
            email: inv.invited_email ?? inv.email ?? "",
            role: inv.invited_role ?? inv.role ?? "",
            expires_at: inv.expires_at ?? null,
            organization: {
              id: inv.organization_id ?? inv.organization?.id ?? "",
              name: inv.organization_name ?? inv.organization?.name ?? "",
            },
          };
          setData(normalized);
          setError(null);
        } else {
          const errJson = await res.json().catch(() => ({}));
          if (!active) return;
          setError({ error: errJson?.error ?? "invalid_token" });
        }
      } catch {
        if (!active) return;
        setError({ error: "unknown" });
      } finally {
        if (!active) return;
        setVerifying(false);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, apiBase]);

  const expiredAt = useMemo(() => {
    if (!data?.expires_at) return null;
    try {
      return new Date(data.expires_at).toLocaleString();
    } catch {
      return data.expires_at;
    }
  }, [data?.expires_at]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!allValid) {
      setFormError("La contraseña no cumple con los requisitos.");
      return;
    }
    if (!passwordsMatch) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/invitations/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAccepted(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError({ error: errJson?.error ?? "unknown" });
      }
    } catch {
      setError({ error: "unknown" });
    } finally {
      setSubmitting(false);
    }
  }
  function Banner() {
    if (verifying) return null;
    const err = error?.error;

    if (accepted || data?.status === "accepted") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#ecfdf5", color: "#14532d" }}
        >
          ¡Listo! Tu contraseña fue establecida y la invitación aceptada.
        </div>
      );
    }
    if (err === "expired") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#fefce8", color: "#713f12" }}
        >
          Esta invitación ha expirado. Pide una nueva al administrador.
        </div>
      );
    }
    if (err === "revoked") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#fef2f2", color: "#7f1d1d" }}
        >
          Esta invitación fue revocada por el administrador.
        </div>
      );
    }
    if (err === "already_accepted") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#eff6ff", color: "#1e3a8a" }}
        >
          Esta invitación ya fue aceptada previamente.
        </div>
      );
    }
    if (err === "invalid_token") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#f9fafb", color: "#374151" }}
        >
          Enlace inválido. Verifica que la URL esté completa.
        </div>
      );
    }
    if (err === "unknown") {
      return (
        <div
          className="rounded-lg border p-3"
          style={{ background: "#f9fafb", color: "#374151" }}
        >
          No pudimos procesar la invitación por un error inesperado. Intenta de
          nuevo.
        </div>
      );
    }
    return null;
  }

  if (!token) {
    return (
      <FullScreenPage>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
            Aceptar invitación
          </h1>
          <p style={{ color: "#6b7280" }}>Falta el token en la URL.</p>
        </div>
      </FullScreenPage>
    );
  }

  const strengthPct = Math.min(100, Math.max(0, (pwRules.score / 5) * 100));

  return (
    <FullScreenPage>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
          Aceptar invitación
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Revisa los detalles y establece tu contraseña para unirte a la
          organización.
        </p>

        <Banner />

        {loading && (
          <div style={{ marginTop: 24, color: "#6b7280" }}>
            Verificando invitación…
          </div>
        )}

        {!loading && data && (
          <div
            className="rounded-xl"
            style={{
              border: "1px solid #e5e7eb",
              padding: 20,
              marginTop: 16,
            }}
          >
            {/* Invitation details */}
            <div style={{ color: "#4b5563", fontSize: 14 }}>Te invitaron a</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              {data.organization?.name}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
                fontSize: 14,
              }}
            >
              <div>
                <div style={{ color: "#6b7280" }}>Correo</div>
                <input
                  value={data.email}
                  readOnly
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background: "#f9fafb",
                    fontWeight: 500,
                  }}
                />
              </div>
              <div>
                <div style={{ color: "#6b7280" }}>Rol</div>
                <input
                  value={data.role}
                  readOnly
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: "8px 12px",
                    background: "#f9fafb",
                    fontWeight: 500,
                  }}
                />
              </div>
              <div>
                <div style={{ color: "#6b7280" }}>Expira</div>
                <div style={{ fontWeight: 500 }}>{expiredAt ?? "—"}</div>
              </div>
              <div>
                <div style={{ color: "#6b7280" }}>Estado</div>
                <div
                  style={{ fontWeight: 500, textTransform: "capitalize" }}
                >
                  {data.status}
                </div>
              </div>
            </div>

            {/* Password form */}
            {data.status === "pending" && !accepted && (
              <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label
                      style={{ display: "block", fontSize: 14, color: "#374151" }}
                    >
                      Contraseña
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={`Mínimo ${LENGTH_MIN} caracteres`}
                        autoComplete="new-password"
                        required
                        style={{
                          flex: 1,
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          padding: "0 12px",
                          minWidth: 90,
                          background: "#f9fafb",
                        }}
                      >
                        {showPw ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>

                    {/* Strength meter */}
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          height: 8,
                          background: "#e5e7eb",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${strengthPct}%`,
                            height: "100%",
                            background:
                              strengthPct < 40
                                ? "#ef4444"
                                : strengthPct < 60
                                ? "#f59e0b"
                                : strengthPct < 80
                                ? "#10b981"
                                : "#059669",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                        Fortaleza: {strengthLabel(pwRules.score)}
                      </div>
                    </div>

                    {/* Rules checklist */}
                    <PasswordChecklist rules={pwRules} />
                  </div>

                  <div>
                    <label
                      style={{ display: "block", fontSize: 14, color: "#374151" }}
                    >
                      Confirmar contraseña
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type={showPw2 ? "text" : "password"}
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        required
                        style={{
                          flex: 1,
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw2((s) => !s)}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          padding: "0 12px",
                          minWidth: 90,
                          background: "#f9fafb",
                        }}
                      >
                        {showPw2 ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                    {!passwordsMatch && password2 && (
                      <div
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#7f1d1d",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 14,
                          marginTop: 8,
                        }}
                      >
                        Las contraseñas no coinciden.
                      </div>
                    )}
                  </div>

                  {formError && (
                    <div
                      style={{
                        border: "1px solid #fde68a",
                        background: "#fefce8",
                        color: "#713f12",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 14,
                      }}
                    >
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !allValid || !passwordsMatch}
                    style={{
                      marginTop: 4,
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      padding: "10px 14px",
                      fontWeight: 600,
                      opacity:
                        submitting || !allValid || !passwordsMatch ? 0.6 : 1,
                      cursor:
                        submitting || !allValid || !passwordsMatch
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {submitting ? "Guardando…" : "Establecer contraseña y unirme"}
                  </button>
                </div>
              </form>
            )}

            {/* Accepted state */}
            {accepted && (
              <div style={{ marginTop: 16 }}>
                <Link
                  to={`/organizations/${data.organization?.id ?? ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 10,
                    padding: "8px 14px",
                    background: "black",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Ir a la organización
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && !data && !verifying && !accepted && !error && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
            }}
          >
            No fue posible cargar los datos de la invitación.
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}
