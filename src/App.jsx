import { useState } from "react";

const fmt  = (n) => Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n) => Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 });

// 2024/25 Tax Year
const PERSONAL_ALLOWANCE = 12570;
const BASIC_RATE_LIMIT   = 50270;
const HIGHER_RATE_LIMIT  = 125140;

const NI_PT  = 12570;  // Primary threshold
const NI_UEL = 50270;  // Upper earnings limit

function calcTax(gross) {
  // Personal allowance tapers above £100,000
  let pa = PERSONAL_ALLOWANCE;
  if (gross > 100000) pa = Math.max(0, PERSONAL_ALLOWANCE - (gross - 100000) / 2);

  const taxable = Math.max(0, gross - pa);
  let tax = 0;

  // Basic rate 20% up to £50,270
  const basicBand = Math.min(taxable, BASIC_RATE_LIMIT - pa);
  tax += Math.max(0, basicBand) * 0.20;

  // Higher rate 40% £50,270 – £125,140
  const higherBand = Math.min(Math.max(0, taxable - Math.max(0, BASIC_RATE_LIMIT - pa)), HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT);
  tax += higherBand * 0.40;

  // Additional rate 45% above £125,140
  const additionalBand = Math.max(0, taxable - (HIGHER_RATE_LIMIT - pa));
  tax += additionalBand * 0.45;

  return tax;
}

function calcNI(gross) {
  let ni = 0;
  if (gross > NI_PT) ni += Math.min(gross - NI_PT, NI_UEL - NI_PT) * 0.12;
  if (gross > NI_UEL) ni += (gross - NI_UEL) * 0.02;
  return ni;
}

function calcEmployerNI(gross) {
  const secondaryThreshold = 9100;
  if (gross <= secondaryThreshold) return 0;
  return (gross - secondaryThreshold) * 0.138;
}

export default function App() {
  const [salary,      setSalary]      = useState("");
  const [period,      setPeriod]      = useState("annual");
  const [pension,     setPension]     = useState("5");
  const [taxYear,     setTaxYear]     = useState("2024/25");
  const [studentLoan, setStudentLoan] = useState("none");
  const [result,      setResult]      = useState(null);

  const calculate = () => {
    let gross = parseFloat(salary) || 0;
    if (period === "monthly")  gross = gross * 12;
    if (period === "weekly")   gross = gross * 52;
    if (period === "hourly")   gross = gross * 40 * 52;
    if (!gross) return;

    const pensionPct    = parseFloat(pension) || 0;
    const pensionAmount = gross * pensionPct / 100;
    const grossAfterPension = gross - pensionAmount;

    const incomeTax = calcTax(grossAfterPension);
    const ni        = calcNI(grossAfterPension);
    const empNI     = calcEmployerNI(gross);

    let slRepayment = 0;
    if (studentLoan === "plan1") slRepayment = Math.max(0, (grossAfterPension - 22015) * 0.09);
    if (studentLoan === "plan2") slRepayment = Math.max(0, (grossAfterPension - 27295) * 0.09);
    if (studentLoan === "plan4") slRepayment = Math.max(0, (grossAfterPension - 27660) * 0.09);
    if (studentLoan === "plan5") slRepayment = Math.max(0, (grossAfterPension - 25000) * 0.09);

    const totalDeductions = incomeTax + ni + pensionAmount + slRepayment;
    const takeHome = gross - totalDeductions;

    const effectiveRate = gross > 0 ? (incomeTax / gross) * 100 : 0;
    const marginalRate  = grossAfterPension > HIGHER_RATE_LIMIT ? 45 : grossAfterPension > BASIC_RATE_LIMIT ? 40 : 20;

    setResult({ gross, grossAfterPension, incomeTax, ni, empNI, pensionAmount, slRepayment, totalDeductions, takeHome, effectiveRate, marginalRate });
  };

  const inputStyle = { width: "100%", padding: "11px 14px", fontSize: "15px", border: "1.5px solid #e5e7eb", borderRadius: "10px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" };

  const taxBand = result
    ? result.grossAfterPension > HIGHER_RATE_LIMIT ? { label: "Additional Rate", color: "#dc2626" }
    : result.grossAfterPension > BASIC_RATE_LIMIT  ? { label: "Higher Rate", color: "#f97316" }
    : { label: "Basic Rate", color: "#22c55e" }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@media print { .no-print { display:none!important; } }`}</style>

      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "15px", fontWeight: "700", color: "#6366f1", textDecoration: "none" }}>⌘ Tabutility</a>
          <button onClick={() => window.print()} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>🖨️ Print / Save PDF</button>
        </div>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>UK Salary & Tax Calculator</h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 28px" }}>Calculate your take-home pay after income tax, National Insurance, pension, and student loan. Tax year 2024/25.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Your Salary</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>£</span>
                  <input type="number" placeholder="e.g. 45000" value={salary} onChange={e => setSalary(e.target.value)} style={{ ...inputStyle, paddingLeft: "28px", fontSize: "18px", fontWeight: "700" }} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Pay Period</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[
                    { id: "annual",  label: "Annual" },
                    { id: "monthly", label: "Monthly" },
                    { id: "weekly",  label: "Weekly" },
                    { id: "hourly",  label: "Hourly" },
                  ].map(p => (
                    <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: "9px", borderRadius: "8px", border: `1.5px solid ${period === p.id ? "#6366f1" : "#e5e7eb"}`, background: period === p.id ? "#6366f1" : "#fff", color: period === p.id ? "#fff" : "#374151", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Pension Contribution</label>
                <div style={{ position: "relative" }}>
                  <input type="number" placeholder="5" value={pension} onChange={e => setPension(e.target.value)} min="0" max="100" style={{ ...inputStyle, paddingRight: "34px" }} />
                  <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Student Loan</label>
                <select value={studentLoan} onChange={e => setStudentLoan(e.target.value)} style={inputStyle}>
                  <option value="none">None</option>
                  <option value="plan1">Plan 1 (before Sep 2012)</option>
                  <option value="plan2">Plan 2 (Sep 2012 onwards)</option>
                  <option value="plan4">Plan 4 (Scotland)</option>
                  <option value="plan5">Plan 5 (from Aug 2023)</option>
                </select>
              </div>
            </div>

            <button onClick={calculate} disabled={!salary} style={{ padding: "14px", background: !salary ? "#e5e7eb" : "#6366f1", color: !salary ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: !salary ? "not-allowed" : "pointer" }}>
              Calculate Take-Home Pay
            </button>

            {/* Tax band info */}
            {result && (
              <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>Tax Band</span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: taxBand.color }}>{taxBand.label}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>Effective Rate</span>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{result.effectiveRate.toFixed(1)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>Marginal Rate</span>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{result.marginalRate}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {result ? (
              <>
                {/* Take home hero */}
                <div style={{ background: "linear-gradient(135deg, #14532d, #16a34a)", borderRadius: "20px", padding: "24px", color: "#fff" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Annual Take-Home Pay</div>
                  <div style={{ fontSize: "40px", fontWeight: "900", lineHeight: 1 }}>£{fmtN(result.takeHome)}</div>
                  <div style={{ display: "flex", gap: "20px", marginTop: "16px" }}>
                    {[
                      { label: "Monthly", value: `£${fmtN(result.takeHome / 12)}` },
                      { label: "Weekly",  value: `£${fmtN(result.takeHome / 52)}` },
                      { label: "Daily",   value: `£${fmtN(result.takeHome / 260)}` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: "16px", fontWeight: "900" }}>{value}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "13px", fontWeight: "800", marginBottom: "14px" }}>Annual Breakdown</div>
                  {[
                    { label: "Gross Salary",       value: result.gross,        color: "#374151", bold: true },
                    { label: "Income Tax",          value: -result.incomeTax,   color: "#ef4444" },
                    { label: "National Insurance",  value: -result.ni,          color: "#f97316" },
                    { label: `Pension (${pension}%)`, value: -result.pensionAmount, color: "#6366f1" },
                    ...(result.slRepayment > 0 ? [{ label: "Student Loan", value: -result.slRepayment, color: "#8b5cf6" }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {!row.bold && <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: row.color }} />}
                        <span style={{ fontSize: "13px", color: row.bold ? "#0f172a" : "#374151", fontWeight: row.bold ? "800" : "400" }}>{row.label}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: row.value < 0 ? row.color : "#0f172a" }}>
                        {row.value < 0 ? `−£${fmt(Math.abs(row.value))}` : `£${fmt(row.value)}`}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800" }}>Take-Home Pay</span>
                    <span style={{ fontSize: "18px", fontWeight: "900", color: "#16a34a" }}>£{fmt(result.takeHome)}</span>
                  </div>
                </div>

                {/* Employer cost */}
                <div style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px dashed #e5e7eb" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", marginBottom: "8px" }}>EMPLOYER'S TOTAL COST</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>£{fmtN(result.gross + result.empNI)}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>salary + £{fmtN(result.empNI)} employer NI</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>💷</div>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>Enter your salary to see your take-home pay</div>
              </div>
            )}
          </div>
        </div>

        {/* Tax bands reference */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginTop: "20px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 14px" }}>2024/25 UK Tax Bands</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {[
              { band: "Personal Allowance", range: "Up to £12,570", rate: "0%", color: "#22c55e" },
              { band: "Basic Rate",         range: "£12,571 – £50,270", rate: "20%", color: "#6366f1" },
              { band: "Higher Rate",        range: "£50,271 – £125,140", rate: "40%", color: "#f97316" },
              { band: "Additional Rate",    range: "Over £125,140", rate: "45%", color: "#ef4444" },
            ].map(b => (
              <div key={b.band} style={{ padding: "12px", background: "#f9fafb", borderRadius: "10px", borderLeft: `3px solid ${b.color}` }}>
                <div style={{ fontSize: "18px", fontWeight: "900", color: b.color }}>{b.rate}</div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#374151", marginTop: "4px" }}>{b.band}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{b.range}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="no-print" style={{ textAlign: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "14px", color: "#6366f1", textDecoration: "none", fontWeight: "600" }}>← Back to all free tools</a>
        </div>
      </div>
    </div>
  );
}
