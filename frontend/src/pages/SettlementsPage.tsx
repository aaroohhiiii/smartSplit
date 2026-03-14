import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface ExpenseItem { id: string; name: string; amount: number; category: string; }
interface Expense { id: string; title: string; paidBy: string; totalAmount: number; taxAmount: number; items: ExpenseItem[]; createdAt: string; }
interface Settlement { from: string; to: string; amount: number; }

export default function SettlementsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate    = useNavigate();
  const { getToken } = useAuth();

  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [settlements,   setSettlements]   = useState<Settlement[]>([]);
  const [groupName,     setGroupName]     = useState('');
  const [members,       setMembers]       = useState<any[]>([]);
  const [initialPayer,  setInitialPayer]  = useState('');
  const [currency,      setCurrency]      = useState('INR');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token || !groupId) return;

        const [groupRes, expRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}`,          { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!groupRes.ok) throw new Error('Failed to fetch group');
        if (!expRes.ok)   throw new Error('Failed to fetch expenses');

        const groupData = await groupRes.json();
        const expData   = await expRes.json();
        const mems      = groupData.members || [];
        const exps      = expData.expenses  || [];

        setGroupName(groupData.name);
        setMembers(mems);
        setInitialPayer(groupData.initialPayer || '');
        setCurrency(groupData.currency || 'INR');
        setExpenses(exps);
        setSettlements(calcSettlements(exps, mems));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, getToken]);

  const calcSettlements = (exps: Expense[], mems: any[]): Settlement[] => {
    const bal: Record<string, number> = {};
    mems.forEach((m: any) => { bal[m.userId] = 0; });

    exps.forEach(exp => {
      bal[exp.paidBy] = (bal[exp.paidBy] || 0) + Number(exp.totalAmount);
      exp.items?.forEach(item => {
        let eligible = mems.filter((m: any) => {
          switch (item.category?.toUpperCase()) {
            case 'NON_VEG': return !m.isVegetarian;
            case 'ALCOHOL': return m.drinksAlcohol;
            default:        return true;
          }
        });
        if (!eligible.length) eligible = mems;
        const pp = Number(item.amount) / eligible.length;
        eligible.forEach((m: any) => { bal[m.userId] = (bal[m.userId] || 0) - pp; });
      });
    });

    const list: Settlement[] = [];
    const ts = Object.entries(bal).map(([userId, balance]) => ({ userId, balance })).sort((a, b) => b.balance - a.balance);
    for (let i = 0; i < ts.length; i++) {
      for (let j = ts.length - 1; j > i; j--) {
        if (ts[i].balance > 0.01 && ts[j].balance < -0.01) {
          const amt = Math.min(ts[i].balance, -ts[j].balance);
          list.push({ from: ts[j].userId, to: ts[i].userId, amount: parseFloat(amt.toFixed(2)) });
          ts[i].balance -= amt;
          ts[j].balance += amt;
        }
      }
    }
    return list;
  };

  const getName = (uid: string) => members.find((m: any) => m.userId === uid)?.name || uid;
  const sym     = { INR: '₹', USD: '$', EUR: '€' }[currency] ?? '₹';
  const fmt     = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total   = expenses.reduce((s, e) => s + Number(e.totalAmount), 0);
  const allDone = !loading && settlements.length === 0;

  const netBal: Record<string, number> = {};
  settlements.forEach(s => {
    netBal[s.from] = (netBal[s.from] || 0) - s.amount;
    netBal[s.to]   = (netBal[s.to]   || 0) + s.amount;
  });
  const maxBal = Math.max(...Object.values(netBal).map(Math.abs), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
        :root{--bg:#0f0f0f;--s:#161616;--s2:#1e1e1e;--b:#2a2a2a;--gold:#d4a847;--gl:#f0c96a;--green:#4ade80;--red:#f87171;--t:#f0ede8;--m:#7a7570;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .p{min-height:100vh;background:var(--bg);color:var(--t);font-family:'Instrument Sans',sans-serif;padding:48px;position:relative;overflow-x:hidden;}
        .p::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:.4;}
        .w{max-width:860px;margin:0 auto;position:relative;z-index:1;}

        .hdr{display:flex;align-items:flex-start;gap:20px;margin-bottom:52px;animation:fu .45s .05s both;}
        .back{width:40px;height:40px;border:1px solid var(--b);background:var(--s);color:var(--gold);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;font-family:inherit;transition:border-color .2s,background .2s,transform .15s;flex-shrink:0;margin-top:6px;}
        .back:hover{border-color:var(--gold);background:var(--s2);transform:translateX(-3px);}
        .ey{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--m);margin-bottom:6px;}
        .ttl{font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,60px);font-weight:900;letter-spacing:-2px;line-height:1;}
        .ttl em{font-style:italic;color:var(--gold);}

        .pc{background:var(--s);border:1px solid var(--b);padding:28px 32px;margin-bottom:2px;display:flex;align-items:center;justify-content:space-between;gap:24px;animation:fu .45s .12s both;transition:border-color .2s;}
        .pc:hover{border-color:var(--gold);}
        .pl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--m);margin-bottom:10px;}
        .pn{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;letter-spacing:-1px;color:var(--gold);line-height:1;margin-bottom:4px;}
        .ps{font-size:13px;color:var(--m);}
        .pr{text-align:right;}
        .al{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--m);margin-bottom:6px;}
        .av{font-family:'Playfair Display',serif;font-size:40px;font-weight:900;letter-spacing:-1.5px;line-height:1;}
        .av small{font-size:20px;color:var(--m);margin-right:2px;}

        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--b);margin-bottom:48px;animation:fu .45s .2s both;}
        .stat{background:var(--s);padding:20px 24px;}
        .stl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--m);margin-bottom:8px;}
        .stv{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;letter-spacing:-.5px;line-height:1;}
        .stv.gld{color:var(--gold);}.stv.grn{color:var(--green);}
        .sts{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--m);margin-top:4px;}

        .sh{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px;animation:fu .45s .28s both;}
        .sl{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:10px;}
        .sl::before{content:'';width:24px;height:1px;background:var(--gold);}
        .sc{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--m);text-transform:uppercase;}

        .rows{display:flex;flex-direction:column;gap:1px;background:var(--b);margin-bottom:2px;animation:fu .45s .32s both;}
        .row{background:var(--s);padding:18px 28px;display:flex;align-items:center;gap:16px;transition:background .15s;position:relative;overflow:hidden;}
        .row::before{content:'';position:absolute;top:0;left:0;width:2px;height:100%;background:var(--gold);transform:scaleY(0);transition:transform .2s;transform-origin:bottom;}
        .row:hover{background:var(--s2);}.row:hover::before{transform:scaleY(1);}
        .ri{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--m);min-width:24px;}
        .rf{font-size:14px;font-weight:600;color:var(--t);min-width:110px;}
        .rm{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .rp{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--m);}
        .rl{width:100%;height:1px;background:var(--b);position:relative;}
        .rl::after{content:'→';position:absolute;right:0;top:50%;transform:translateY(-50%);color:var(--gold);font-size:13px;line-height:1;}
        .rf2{position:absolute;top:0;left:0;height:1px;background:rgba(212,168,71,.35);animation:gl .7s ease both;}
        .rt{font-size:14px;font-weight:600;color:var(--gold);min-width:110px;text-align:right;}
        .ra{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;letter-spacing:-.5px;min-width:90px;text-align:right;}
        .ra small{font-family:'DM Mono',monospace;font-size:10px;color:var(--m);font-weight:400;margin-right:2px;}

        .bals{background:var(--s);border:1px solid var(--b);margin-bottom:48px;animation:fu .45s .38s both;}
        .bh{padding:14px 24px;border-bottom:1px solid var(--b);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--m);display:flex;justify-content:space-between;}
        .br{padding:12px 24px;display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--b);transition:background .15s;}
        .br:last-child{border-bottom:none;}.br:hover{background:var(--s2);}
        .bn{font-size:13px;font-weight:500;color:var(--t);min-width:80px;}
        .bt{flex:1;height:2px;background:var(--b);position:relative;}
        .bf{height:2px;border-radius:1px;animation:gl .8s ease both;}
        .ba{font-family:'DM Mono',monospace;font-size:12px;font-weight:500;min-width:80px;text-align:right;}
        .ba.pos{color:var(--green);}.ba.neg{color:var(--red);}

        .exps{display:flex;flex-direction:column;gap:1px;background:var(--b);margin-bottom:48px;animation:fu .45s .44s both;}
        .er{background:var(--s);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;transition:background .15s;}
        .er:hover{background:var(--s2);}
        .et{font-size:14px;font-weight:500;color:var(--t);margin-bottom:2px;}
        .em2{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--m);}
        .ea{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold);white-space:nowrap;}

        .settled{border:1px dashed var(--b);background:var(--s);padding:80px 32px;text-align:center;margin-bottom:48px;animation:fu .45s .28s both;position:relative;overflow:hidden;}
        .settled::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;height:200px;background:radial-gradient(ellipse,rgba(212,168,71,.06) 0%,transparent 70%);pointer-events:none;}
        .si{font-size:32px;display:block;margin-bottom:16px;color:var(--gold);}
        .st2{font-family:'Playfair Display',serif;font-size:40px;font-weight:900;letter-spacing:-1.5px;margin-bottom:8px;}
        .st2 em{font-style:italic;color:var(--gold);}
        .ss{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--m);}

        .ft{border-top:1px solid var(--b);padding-top:32px;display:flex;justify-content:space-between;align-items:center;animation:fu .45s .5s both;}
        .fn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--m);}
        .btn{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--bg);background:var(--gold);border:none;padding:16px 32px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:background .2s,transform .15s;}
        .btn:hover{background:var(--gl);transform:translateY(-2px);}
        .btn .ar{transition:transform .2s;}.btn:hover .ar{transform:translateX(4px);}

        .ld{text-align:center;padding:120px 24px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--m);}
        .err{border:1px solid var(--red);background:rgba(248,113,113,.06);padding:16px 24px;margin-top:24px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--red);}

        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gl{from{width:0}}
        @media(max-width:640px){.p{padding:24px 20px;}.pc{flex-direction:column;align-items:flex-start;}.stats{grid-template-columns:1fr 1fr;}.rm{display:none;}.ft{flex-direction:column;gap:16px;}.btn{width:100%;justify-content:center;}}
      `}</style>

      <div className="p">
        <div className="w">

          {/* HEADER */}
          <div className="hdr">
            <button className="back" onClick={() => navigate(-1)}>←</button>
            <div>
              <div className="ey">Settlement Summary</div>
              <div className="ttl">
                {loading ? 'Loading…' : <em>{groupName}</em>}
              </div>
            </div>
          </div>

          {loading && <div className="ld">Calculating settlements…</div>}
          {error   && <div className="err">Error: {error}</div>}

          {!loading && !error && (
            <>
              {/* PAYER */}
              <div className="pc">
                <div>
                  <div className="pl">Who paid the bill</div>
                  <div className="pn">{initialPayer || getName(expenses[0]?.paidBy) || 'Unknown'}</div>
                  <div className="ps">Covered the group expenses upfront</div>
                </div>
                <div className="pr">
                  <div className="al">Total paid</div>
                  <div className="av"><small>{sym}</small>{fmt(total)}</div>
                </div>
              </div>

              {/* STATS */}
              <div className="stats">
                <div className="stat">
                  <div className="stl">Transfers needed</div>
                  <div className={`stv ${allDone ? 'grn' : 'gld'}`}>{settlements.length}</div>
                  <div className="sts">{allDone ? 'All square' : 'Optimised'}</div>
                </div>
                <div className="stat">
                  <div className="stl">Expenses</div>
                  <div className="stv">{expenses.length}</div>
                  <div className="sts">In this group</div>
                </div>
                <div className="stat">
                  <div className="stl">Currency</div>
                  <div className="stv gld">{currency}</div>
                  <div className="sts">{members.length} members</div>
                </div>
              </div>

              {/* ALL SETTLED or ROWS */}
              {allDone ? (
                <div className="settled">
                  <span className="si">✦</span>
                  <div className="st2">All <em>settled up.</em></div>
                  <div className="ss">Everyone is square · No payments needed</div>
                </div>
              ) : (
                <>
                  <div className="sh">
                    <div className="sl">Payments to make</div>
                    <div className="sc">{settlements.length} transfer{settlements.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="rows">
                    {settlements.map((s, i) => (
                      <div className="row" key={i} style={{ animationDelay: `${0.32 + i * 0.07}s` }}>
                        <span className="ri">0{i + 1}</span>
                        <span className="rf">{getName(s.from)}</span>
                        <div className="rm">
                          <span className="rp">pays</span>
                          <div className="rl">
                            <div className="rf2" style={{ width: '88%', animationDelay: `${0.5 + i * 0.08}s` }} />
                          </div>
                        </div>
                        <span className="rt">{getName(s.to)}</span>
                        <div className="ra"><small>{sym}</small>{fmt(s.amount)}</div>
                      </div>
                    ))}
                  </div>

                  {/* BALANCE CHART */}
                  <div className="bals">
                    <div className="bh"><span>Net Balances</span><span>+ owed · − owes</span></div>
                    {Object.entries(netBal).map(([uid, bal], i) => (
                      <div className="br" key={uid}>
                        <span className="bn">{getName(uid)}</span>
                        <div className="bt">
                          <div className="bf" style={{ width: `${(Math.abs(bal) / maxBal) * 100}%`, background: bal >= 0 ? 'var(--green)' : 'var(--red)', animationDelay: `${0.5 + i * 0.08}s` }} />
                        </div>
                        <span className={`ba ${bal >= 0 ? 'pos' : 'neg'}`}>
                          {bal >= 0 ? '+' : ''}{sym}{fmt(Math.abs(bal))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* EXPENSES */}
              {expenses.length > 0 && (
                <>
                  <div className="sh" style={{ animationDelay: '0.44s' }}>
                    <div className="sl">Expenses breakdown</div>
                    <div className="sc">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="exps">
                    {expenses.map(exp => (
                      <div className="er" key={exp.id}>
                        <div>
                          <div className="et">{exp.title}</div>
                          <div className="em2">Paid by {getName(exp.paidBy)} · {exp.items?.length || 0} items</div>
                        </div>
                        <div className="ea">{sym}{fmt(Number(exp.totalAmount))}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* FOOTER */}
              <div className="ft">
                <div className="fn">
                  {allDone ? 'No transfers needed' : `${settlements.length} optimised payment${settlements.length !== 1 ? 's' : ''}`}
                </div>
                <button className="btn" onClick={() => navigate('/')}>
                  Dashboard <span className="ar">→</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}