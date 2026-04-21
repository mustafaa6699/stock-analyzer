import { useState, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from "recharts";

// ── الألوان ──
const C = {
  green:"#10b981", green2:"#34d399",
  red:"#ef4444",   red2:"#f87171",
  blue:"#3b82f6",  blue2:"#60a5fa",
  purple:"#8b5cf6",amber:"#f59e0b",
  bg:"#0a0e1a",    bg2:"#1e293b",
  bg3:"#0f172a",   bg4:"#334155",
  text:"#e2e8f0",  text2:"#94a3b8", text3:"#64748b",
};

// ── مساعدات ──
const fmt = (n, d=2) => {
  const x = parseFloat(n);
  return isNaN(x) ? "—" : x.toLocaleString("en", {minimumFractionDigits:d, maximumFractionDigits:d});
};

const calcRSI = (closes, period=14) => {
  if (closes.length < period+1) return closes.map(()=>50);
  const rsi = []; let ag=0, al=0;
  for (let i=1; i<=period; i++) { const d=closes[i]-closes[i-1]; d>0?ag+=d:al-=d; }
  ag/=period; al/=period;
  rsi.push(al===0?100:100-(100/(1+ag/al)));
  for (let i=period+1; i<closes.length; i++) {
    const d=closes[i]-closes[i-1];
    ag=((ag*(period-1))+(d>0?d:0))/period;
    al=((al*(period-1))+(d<0?-d:0))/period;
    rsi.push(al===0?100:100-(100/(1+ag/al)));
  }
  return [...Array(closes.length-rsi.length).fill(50), ...rsi];
};

const STEPS = [
  "① تحليل بيانات السهم",
  "② حساب المؤشرات الفنية",
  "③ تحديد نقاط الدخول والخروج",
  "④ إعداد توصية الخبير",
];

// ── مكونات مساعدة ──
function Card({ children, mb=0, style={} }) {
  return (
    <div style={{
      background:C.bg2, border:"1px solid rgba(99,179,237,0.12)",
      borderRadius:16, padding:"16px 18px", marginBottom:mb, ...style
    }}>
      {children}
    </div>
  );
}
function Lbl({ children }) {
  return <div style={{fontSize:12, color:C.text2, marginBottom:6, fontWeight:500}}>{children}</div>;
}
const iStyle = {
  width:"100%", padding:"10px 14px",
  background:C.bg3, border:"1px solid rgba(99,179,237,0.15)",
  borderRadius:10, color:C.text,
  fontFamily:"'Tajawal', Arial, sans-serif", fontSize:14, outline:"none",
};

// ── التطبيق الرئيسي ──
export default function App() {
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem("anthropic_key") || "");
  const [symbol,   setSymbol]   = useState("");
  const [strategy, setStrategy] = useState("auto");
  const [loading,  setLoading]  = useState(false);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [error,    setError]    = useState("");
  const [data,     setData]     = useState(null);
  const [chartMode,setChartMode]= useState("price");
  const [keySaved, setKeySaved] = useState(!!localStorage.getItem("anthropic_key"));
  const resultsRef = useRef(null);
  const timerRef   = useRef(null);

  useEffect(() => {
    if (loading) {
      setStepIdx(0);
      timerRef.current = setInterval(() => setStepIdx(s => (s+1)%5), 850);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  useEffect(() => {
    if (data && resultsRef.current)
      setTimeout(() => resultsRef.current.scrollIntoView({behavior:"smooth", block:"start"}), 150);
  }, [data]);

  const saveKey = () => {
    localStorage.setItem("anthropic_key", apiKey);
    setKeySaved(true);
  };
  const clearKey = () => {
    localStorage.removeItem("anthropic_key");
    setApiKey(""); setKeySaved(false);
  };

  async function analyze() {
    if (!apiKey.trim()) { setError("أدخل مفتاح Anthropic API أولاً"); return; }
    if (!symbol.trim()) { setError("أدخل رمز السهم"); return; }
    setError(""); setData(null); setLoading(true);
    const sym = symbol.trim().toUpperCase();

    const prompt = `أنت خبير تداول محترف ومحلل مالي متمرس. قم بتحليل سهم ${sym} بالكامل.
الاستراتيجية: ${strategy==="auto"?"اختر الأنسب بناءً على الوضع الفني":strategy}
التاريخ: أبريل 2026. استخدم السعر الحقيقي الحالي قدر الإمكان.

أجب بـ JSON فقط، لا نص خارجه، لا backticks:
{
  "symbol":"${sym}",
  "companyName":"الاسم الكامل",
  "currentPrice":0.00,
  "previousClose":0.00,
  "dayHigh":0.00,
  "dayLow":0.00,
  "weekHigh52":0.00,
  "weekLow52":0.00,
  "marketCapB":0.0,
  "volumeM":0.0,
  "priceChange":0.00,
  "priceChangePct":0.00,
  "strategyUsed":"swing",
  "strategyNameAr":"سوينج",
  "direction":"long",
  "entryPrice":0.00,
  "entryDesc":"سبب الدخول",
  "stopLoss":0.00,
  "stopDesc":"سبب الوقف",
  "target1":0.00,
  "target1Desc":"سبب الهدف الأول",
  "target2":0.00,
  "target2Desc":"سبب الهدف الثاني",
  "rsi":55,
  "rsiStatus":"محايد",
  "volumeStatus":"متوسط",
  "trendDirection":"صاعد",
  "trendStrength":"متوسط",
  "riskLevel":"متوسط",
  "riskPct":50,
  "nextEarnings":"التاريخ أو غير محدد",
  "sector":"القطاع",
  "indicators":[
    {"name":"MA 20","value":"0.00","signal":"bull"},
    {"name":"MA 50","value":"0.00","signal":"bull"},
    {"name":"MA 200","value":"0.00","signal":"bull"},
    {"name":"MACD","value":"+0.00","signal":"bull"},
    {"name":"Bollinger","value":"وسط","signal":"neutral"},
    {"name":"Stochastic","value":"55","signal":"neutral"},
    {"name":"ATR","value":"0.00","signal":"neutral"},
    {"name":"ADX","value":"25","signal":"bull"}
  ],
  "priceHistory":[25 سعر إغلاق واقعي من الأقدم للأحدث],
  "volumeHistory":[25 حجم تداول يومي بالملايين],
  "expertAnalysis":"تحليل شامل 5 جمل: الوضع الفني، المبررات، التوقعات، المخاطر"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 1800,
          messages: [{ role:"user", content:prompt }]
        })
      });

      if (!res.ok) {
        const e = await res.json();
        const msg = e.error?.message || "خطأ في الاتصال";
        if (msg.includes("API_KEY") || msg.includes("invalid"))
          throw new Error("مفتاح API غير صحيح. تحقق منه من console.anthropic.com");
        throw new Error(msg);
      }

      const d = await res.json();
      const raw = d.content.map(i => i.text||"").join("");
      const match = raw.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error("تعذّر تحليل البيانات. حاول مرة أخرى.");
      const parsed = JSON.parse(match[0]);
      const closes = parsed.priceHistory || [];
      setData({ ...parsed, rsiArr: calcRSI(closes) });

    } catch(err) {
      setError(err.message || "حدث خطأ. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  // بيانات الرسم
  const closes = data?.priceHistory || [];
  const pts = closes.map((p,i) => ({
    day: i+1,
    price: +parseFloat(p).toFixed(2),
    volume: data?.volumeHistory?.[i] ? +parseFloat(data.volumeHistory[i]).toFixed(1) : +(Math.random()*50+10).toFixed(1),
    rsi: data?.rsiArr?.[i] ? +data.rsiArr[i].toFixed(1) : 50,
  }));

  const rr = data ? (() => {
    const r = Math.abs(data.entryPrice - data.stopLoss);
    const w = Math.abs(data.target1 - data.entryPrice);
    return r > 0 ? (w/r).toFixed(1) : "—";
  })() : "—";

  const isLong = data?.direction === "long";
  const chg    = data?.priceChange || 0;
  const chgPct = data?.priceChangePct || 0;
  const curRSI = data?.rsiArr?.[data.rsiArr.length-1];
  const tt = {background:"#1e293b", border:"1px solid rgba(99,179,237,0.2)", borderRadius:8, color:C.text2, fontSize:12};

  return (
    <div style={{background:C.bg, minHeight:"100vh", padding:"20px 16px 60px", fontFamily:"'Tajawal',Arial,sans-serif", direction:"rtl", color:C.text}}>
      <div style={{maxWidth:900, margin:"0 auto"}}>

        {/* ── HEADER ── */}
        <div style={{textAlign:"center", padding:"32px 0 26px"}}>
          <div style={{display:"inline-flex", alignItems:"center", gap:8, background:C.bg2, border:"1px solid rgba(99,179,237,0.25)", borderRadius:50, padding:"7px 20px", marginBottom:18, fontSize:13, color:C.blue2}}>
            <span style={{width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block"}}/>
            تحليل ذكي · مدعوم بـ Claude AI
          </div>
          <h1 style={{fontSize:32, fontWeight:900, marginBottom:8, background:"linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"}}>
            محلل الأسهم الذكي Pro
          </h1>
          <p style={{fontSize:14, color:C.text2}}>تحليل فني احترافي · نقاط الدخول والخروج · رسم بياني · مدعوم بالذكاء الاصطناعي</p>
        </div>

        {/* ── API KEY ── */}
        <Card mb={12}>
          <Lbl>🔑 مفتاح Anthropic API</Lbl>
          <div style={{display:"flex", gap:8}}>
            <input
              type="password" value={apiKey}
              onChange={e => { setApiKey(e.target.value); setKeySaved(false); }}
              placeholder="sk-ant-api03-..."
              style={{...iStyle, flex:1}}
            />
            <button onClick={saveKey} style={{padding:"10px 16px", background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:10, color:C.blue2, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap"}}>
              {keySaved ? "✅ محفوظ" : "💾 حفظ"}
            </button>
            {keySaved && (
              <button onClick={clearKey} style={{padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, color:C.red2, fontSize:13, cursor:"pointer", fontFamily:"inherit"}}>
                🗑️
              </button>
            )}
          </div>
          <div style={{fontSize:11, color:C.text3, marginTop:6}}>
            احصل على مفتاحك من: console.anthropic.com/keys · يُحفظ في متصفحك فقط ولا يُرسل لأي خادم آخر
          </div>
        </Card>

        {/* ── INPUTS ── */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
          <Card>
            <Lbl>📈 رمز السهم</Lbl>
            <input value={symbol} onChange={e=>setSymbol(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&analyze()}
              placeholder="AAPL · TSLA · NVDA · MSFT" style={iStyle}/>
          </Card>
          <Card>
            <Lbl>🎯 الاستراتيجية</Lbl>
            <select value={strategy} onChange={e=>setStrategy(e.target.value)} style={iStyle}>
              <option value="auto">تلقائي — AI يختار الأنسب</option>
              <option value="swing">سوينج (أيام–أسابيع)</option>
              <option value="scalp">سكالبينج (دقائق–ساعات)</option>
              <option value="position">بوزيشن (أسابيع–أشهر)</option>
            </select>
          </Card>
        </div>

        <button onClick={analyze} disabled={loading} style={{width:"100%", padding:15, background:loading?C.bg4:"linear-gradient(135deg,#3b82f6,#8b5cf6)", color:"#fff", border:"none", borderRadius:14, fontSize:17, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginBottom:16, fontFamily:"inherit", boxShadow:loading?"none":"0 4px 24px rgba(59,130,246,0.3)", transition:"all .2s"}}>
          {loading ? "⏳ جاري التحليل..." : "⚡ تحليل السهم الآن"}
        </button>

        {error && (
          <div style={{padding:"13px 16px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, color:C.red2, fontSize:13, marginBottom:16}}>
            ⚠️ {error}
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <Card mb={16} style={{textAlign:"center", padding:"48px 20px"}}>
            <div style={{fontSize:38, marginBottom:14}}>🔍</div>
            <div style={{color:C.text2, fontSize:15, marginBottom:20, fontWeight:600}}>Claude يحلل السهم...</div>
            {STEPS.map((s,i) => (
              <div key={i} style={{fontSize:13, color:i<stepIdx%5?C.green2:i===stepIdx%5?C.blue2:C.text3, padding:"5px 0", transition:"color .3s", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                <span>{i<stepIdx%5?"✅":i===stepIdx%5?"⟳":"○"}</span>{s}
              </div>
            ))}
          </Card>
        )}

        {/* ── RESULTS ── */}
        {data && (
          <div ref={resultsRef}>

            {/* BANNER */}
            <Card mb={12} style={{padding:"24px 26px", position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", top:-70, left:-70, width:240, height:240, borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.06),transparent 70%)", pointerEvents:"none"}}/>

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14, marginBottom:18}}>
                <div>
                  <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
                    <div style={{fontSize:30, fontWeight:900}}>{data.symbol}</div>
                    {data.sector && <div style={{padding:"3px 12px", borderRadius:50, fontSize:11, background:"rgba(59,130,246,0.1)", color:C.blue2, border:"1px solid rgba(59,130,246,0.2)"}}>{data.sector}</div>}
                  </div>
                  <div style={{fontSize:13, color:C.text2, marginTop:4}}>{data.companyName}</div>
                  <div style={{display:"inline-flex", alignItems:"center", gap:6, padding:"5px 16px", borderRadius:50, fontSize:13, fontWeight:700, marginTop:10, background:isLong?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", color:isLong?C.green2:C.red2, border:`1px solid ${isLong?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"}`}}>
                    {isLong?"▲ شراء (Long)":"▼ بيع (Short)"} — {data.strategyNameAr}
                  </div>
                </div>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:40, fontWeight:900, color:chg>=0?C.green2:C.red2}}>${fmt(data.currentPrice)}</div>
                  <div style={{fontSize:15, fontWeight:700, color:chg>=0?C.green2:C.red2, marginTop:3}}>
                    {chg>=0?"+":""}{fmt(chg)} ({chg>=0?"+":""}{fmt(chgPct)}%)
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:16}}>
                {[
                  {l:"الإغلاق السابق", v:"$"+fmt(data.previousClose)},
                  {l:"أعلى اليوم",     v:"$"+fmt(data.dayHigh)},
                  {l:"أدنى اليوم",     v:"$"+fmt(data.dayLow)},
                  {l:"أعلى 52 أسبوع", v:"$"+fmt(data.weekHigh52)},
                  {l:"القيمة السوقية", v:fmt(data.marketCapB,1)+"B"},
                ].map((s,i) => (
                  <div key={i} style={{background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"9px 10px", textAlign:"center"}}>
                    <div style={{fontSize:10, color:C.text3, marginBottom:3}}>{s.l}</div>
                    <div style={{fontSize:13, fontWeight:700}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* External links */}
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {[
                  {label:"📊 TradingView",   url:`https://www.tradingview.com/chart/?symbol=${data.symbol}`},
                  {label:"💹 Yahoo Finance", url:`https://finance.yahoo.com/quote/${data.symbol}`},
                  {label:"📰 Investing.com", url:`https://www.investing.com/search/?q=${data.symbol}`},
                  {label:"🏦 MarketWatch",   url:`https://www.marketwatch.com/investing/stock/${data.symbol.toLowerCase()}`},
                ].map((l,i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    style={{padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", color:C.blue2, textDecoration:"none"}}>
                    {l.label}
                  </a>
                ))}
              </div>
            </Card>

            {/* SIGNALS */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12}}>
              {[
                {label:"نقطة الدخول",  price:data.entryPrice, desc:data.entryDesc,   color:C.green2, bar:C.green},
                {label:"إيقاف الخسارة",price:data.stopLoss,   desc:data.stopDesc,    color:C.red2,   bar:C.red},
                {label:"الهدف الأول",  price:data.target1,    desc:data.target1Desc, color:C.blue2,  bar:C.blue},
                {label:"الهدف الثاني", price:data.target2,    desc:data.target2Desc, color:C.purple, bar:C.purple},
              ].map((s,i) => (
                <Card key={i} style={{position:"relative", overflow:"hidden"}}>
                  <div style={{position:"absolute", bottom:0, left:0, right:0, height:3, background:s.bar}}/>
                  <div style={{fontSize:10, color:C.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:21, fontWeight:800, color:s.color}}>${fmt(s.price)}</div>
                  <div style={{fontSize:11, color:C.text3, marginTop:4, lineHeight:1.5}}>{s.desc}</div>
                </Card>
              ))}
            </div>

            {/* METRICS */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12}}>
              {[
                {label:"مخاطرة / عائد", val:`1 : ${rr}`,             sub:"Risk / Reward",          color:C.blue2},
                {label:"RSI (14)",       val:curRSI?curRSI.toFixed(0):"—", sub:data.rsiStatus,       color:curRSI>70?C.red2:curRSI<30?C.green2:C.text},
                {label:"اتجاه الترند",  val:data.trendDirection,      sub:"قوة: "+data.trendStrength,color:data.trendDirection==="صاعد"?C.green2:data.trendDirection==="هابط"?C.red2:C.amber},
                {label:"حجم التداول",   val:data.volumeStatus,         sub:fmt(data.volumeM,1)+"M سهم", color:C.text},
              ].map((m,i) => (
                <Card key={i}>
                  <div style={{fontSize:11, color:C.text3, marginBottom:4}}>{m.label}</div>
                  <div style={{fontSize:20, fontWeight:800, color:m.color}}>{m.val}</div>
                  <div style={{fontSize:11, color:C.text3, marginTop:2}}>{m.sub}</div>
                </Card>
              ))}
            </div>

            {/* CHART */}
            <Card mb={12}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8}}>
                <div>
                  <div style={{fontSize:15, fontWeight:700}}>الرسم البياني الفني</div>
                  <div style={{display:"flex", gap:10, marginTop:8, flexWrap:"wrap"}}>
                    {[["#60a5fa","السعر"],["#34d399","دخول"],["#f87171","وقف"],["#8b5cf6","هدف1"],["#f59e0b","هدف2"]].map(([c,l]) => (
                      <div key={l} style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.text2}}>
                        <div style={{width:18, height:2, background:c, borderRadius:1}}/>{l}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  {[["price","السعر"],["rsi","RSI"],["vol","الحجم"]].map(([m,l]) => (
                    <button key={m} onClick={() => setChartMode(m)}
                      style={{padding:"5px 13px", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${chartMode===m?C.blue:"rgba(99,179,237,0.12)"}`, background:chartMode===m?"rgba(59,130,246,0.1)":"transparent", color:chartMode===m?C.blue2:C.text2, cursor:"pointer", fontFamily:"inherit"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                {chartMode === "price" ? (
                  <LineChart data={pts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="day" tick={{fill:C.text3, fontSize:11}}/>
                    <YAxis tick={{fill:C.text3, fontSize:11}} domain={["auto","auto"]}/>
                    <Tooltip contentStyle={tt} formatter={v=>["$"+fmt(v),"السعر"]}/>
                    <ReferenceLine y={data.entryPrice} stroke="#34d399" strokeDasharray="6 3" strokeWidth={1.5} label={{value:"دخول", fill:"#34d399", fontSize:10}}/>
                    <ReferenceLine y={data.stopLoss}   stroke="#f87171" strokeDasharray="6 3" strokeWidth={1.5} label={{value:"وقف",  fill:"#f87171", fontSize:10}}/>
                    <ReferenceLine y={data.target1}    stroke="#8b5cf6" strokeDasharray="4 3" strokeWidth={1.5} label={{value:"هدف1", fill:"#8b5cf6", fontSize:10}}/>
                    <ReferenceLine y={data.target2}    stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} label={{value:"هدف2", fill:"#f59e0b", fontSize:10}}/>
                    <Line type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
                  </LineChart>
                ) : chartMode === "rsi" ? (
                  <LineChart data={pts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="day" tick={{fill:C.text3, fontSize:11}}/>
                    <YAxis domain={[0,100]} tick={{fill:C.text3, fontSize:11}}/>
                    <Tooltip contentStyle={tt}/>
                    <ReferenceLine y={70} stroke="rgba(248,113,113,0.6)" strokeDasharray="5 5" label={{value:"70", fill:"#f87171", fontSize:10}}/>
                    <ReferenceLine y={30} stroke="rgba(52,211,153,0.6)" strokeDasharray="5 5" label={{value:"30", fill:"#34d399", fontSize:10}}/>
                    <Line type="monotone" dataKey="rsi" stroke="#a78bfa" strokeWidth={2.5} dot={false}/>
                  </LineChart>
                ) : (
                  <BarChart data={pts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="day" tick={{fill:C.text3, fontSize:11}}/>
                    <YAxis tick={{fill:C.text3, fontSize:11}}/>
                    <Tooltip contentStyle={tt} formatter={v=>[fmt(v,1)+"M","الحجم"]}/>
                    <Bar dataKey="volume" fill="#60a5fa" radius={[3,3,0,0]}/>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* INDICATORS */}
            <Card mb={12}>
              <div style={{fontSize:15, fontWeight:700, marginBottom:14}}>المؤشرات الفنية</div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8}}>
                {(data.indicators||[]).map((ind,i) => {
                  const c = ind.signal==="bull"?C.green2:ind.signal==="bear"?C.red2:C.amber;
                  const a = ind.signal==="bull"?"▲":ind.signal==="bear"?"▼":"◆";
                  return (
                    <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 13px", borderRadius:10, background:C.bg3, border:"1px solid rgba(99,179,237,0.12)"}}>
                      <span style={{fontSize:12, color:C.text2}}>{ind.name}</span>
                      <span style={{fontSize:13, fontWeight:700, color:c}}>{a} {ind.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* ANALYSIS */}
            <Card mb={12}>
              <div style={{fontSize:15, fontWeight:700, marginBottom:12}}>📋 توصية الخبير</div>
              <p style={{fontSize:14, color:C.text2, lineHeight:1.95}}>{data.expertAnalysis}</p>
            </Card>

            {/* RISK */}
            <Card mb={12}>
              <div style={{fontSize:15, fontWeight:700, marginBottom:12}}>مستوى المخاطرة</div>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                <span style={{fontWeight:700}}>{data.riskLevel}</span>
                <span style={{color:C.text2}}>{data.riskPct}%</span>
              </div>
              <div style={{height:10, background:"#1f2d45", borderRadius:5, overflow:"hidden", marginBottom:14}}>
                <div style={{height:"100%", width:`${data.riskPct}%`, borderRadius:5, background:data.riskPct<40?`linear-gradient(90deg,${C.green},${C.green2})`:data.riskPct<65?`linear-gradient(90deg,${C.amber},#fbbf24)`:`linear-gradient(90deg,${C.red},${C.red2})`}}/>
              </div>
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <div style={{padding:"10px 16px", borderRadius:10, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)", color:C.blue2, fontSize:13, fontWeight:700}}>
                  📊 نسبة العائد/المخاطرة: 1 : {rr}
                </div>
                <div style={{padding:"10px 16px", borderRadius:10, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", color:C.green2, fontSize:13, fontWeight:700}}>
                  📅 النتائج القادمة: {data.nextEarnings||"غير محدد"}
                </div>
              </div>
            </Card>

            <div style={{fontSize:12, color:C.text3, padding:"14px 18px", border:"1px solid rgba(99,179,237,0.1)", borderRadius:10, textAlign:"center", lineHeight:1.8, background:C.bg2}}>
              ⚠️ هذا التحليل لأغراض تعليمية فقط وليس توصية استثمارية أو مالية.<br/>
              للأسعار الحقيقية اللحظية استخدم الروابط الخارجية أعلاه.
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
