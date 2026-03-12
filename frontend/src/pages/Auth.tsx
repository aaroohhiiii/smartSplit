import { SignInButton } from "@clerk/clerk-react";
import "../styles/Auth.css";
const AuthPage = () => {
  return (
    <>
      

      <div className="auth-wrap">

        {/* LEFT */}
        <div className="auth-left">
          <a href="/" className="auth-logo">Smart<span>Split</span></a>

          <div className="auth-left-body">
            <div className="auth-eyebrow">AI Expense Splitting</div>

            <h1 className="auth-title">
              Stop doing<br />
              the <em>awkward</em><br />
              math.
            </h1>

            <p className="auth-desc">
              Upload a receipt and SmartSplit reads every dish, splits costs fairly,
              and settles debts automatically. Sign in to get started.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-num">01</span>
                <span className="feature-text">AI Receipt Parsing</span>
                <span className="feature-tag">OCR + LLM</span>
              </div>
              <div className="auth-feature">
                <span className="feature-num">02</span>
                <span className="feature-text">Item-Level Splitting</span>
                <span className="feature-tag">Per dish</span>
              </div>
              <div className="auth-feature">
                <span className="feature-num">03</span>
                <span className="feature-text">Smart Settlements</span>
                <span className="feature-tag">Min transfers</span>
              </div>
            </div>

            <div className="auth-cta-wrap">
              <SignInButton mode="modal">
                <button className="auth-cta-btn">
                  Sign in to SmartSplit <span className="arrow">→</span>
                </button>
              </SignInButton>
              <p className="auth-terms">Secured by Clerk · No credit card required</p>
            </div>
          </div>

          <div className="auth-left-footer">© 2026 SmartSplit</div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div className="preview-receipt">
            <div className="pr-header">
              <div className="pr-title">
                Spice Garden
                <small>Table 7 · 4 people</small>
              </div>
              <div className="pr-ai">AI Parsed</div>
            </div>

            <div className="pr-items">
              <div className="pr-item">
                <div className="pr-item-left">
                  <div className="pr-dot" style={{ background: '#4ade80' }}></div>
                  <div>
                    <div className="pr-name">Paneer Tikka</div>
                    <div className="pr-who">Priya, Meera</div>
                  </div>
                </div>
                <div className="pr-price">₹320</div>
              </div>
              <div className="pr-item">
                <div className="pr-item-left">
                  <div className="pr-dot" style={{ background: '#f87171' }}></div>
                  <div>
                    <div className="pr-name">Butter Chicken</div>
                    <div className="pr-who">Arjun</div>
                  </div>
                </div>
                <div className="pr-price">₹480</div>
              </div>
              <div className="pr-item">
                <div className="pr-item-left">
                  <div className="pr-dot" style={{ background: '#a78bfa' }}></div>
                  <div>
                    <div className="pr-name">Kingfisher ×2</div>
                    <div className="pr-who">Arjun, Rahul</div>
                  </div>
                </div>
                <div className="pr-price">₹360</div>
              </div>
              <div className="pr-item">
                <div className="pr-item-left">
                  <div className="pr-dot" style={{ background: '#d4a847' }}></div>
                  <div>
                    <div className="pr-name">Garlic Naan ×4</div>
                    <div className="pr-who">Everyone</div>
                  </div>
                </div>
                <div className="pr-price">₹240</div>
              </div>
            </div>

            <hr className="pr-divider" />

            <div className="pr-foot">
              <div className="pr-total">
                <span className="pr-total-label">Total</span>
                <span className="pr-total-val">₹1,568</span>
              </div>
              <div className="pr-bar">
                <div className="pr-seg" style={{ flex: 2, background: '#4ade80' }}></div>
                <div className="pr-seg" style={{ flex: 2.6, background: '#f87171' }}></div>
                <div className="pr-seg" style={{ flex: 1.5, background: '#a78bfa' }}></div>
                <div className="pr-seg" style={{ flex: 1, background: '#d4a847' }}></div>
              </div>
            </div>
          </div>

          <div className="balance-cards">
            <div className="bal-card">
              <div className="bal-label">You're owed</div>
              <div className="bal-val pos">+₹640</div>
              <div className="bal-sub">from 2 people</div>
            </div>
            <div className="bal-card">
              <div className="bal-label">You owe</div>
              <div className="bal-val neg">−₹220</div>
              <div className="bal-sub">to Arjun</div>
            </div>
          </div>

          <div className="right-label">Live preview · your data after sign in</div>
        </div>

      </div>
    </>
  );
};

export default AuthPage;