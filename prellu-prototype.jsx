import { useState, useRef, useEffect, useCallback } from "react";

const MODES = [
  {
    id: "rehearse",
    title: "Rehearse",
    desc: "Practice a hard conversation before it happens",
    prompt: "You are Prellu, an AI communication coach. The user wants to REHEARSE a difficult conversation before it happens. Ask them warmly: who is this conversation with, and what's the situation? Then help them plan what to say — suggest openers, anticipate reactions, and coach them on tone. Be specific, not generic. Keep responses concise (2-4 sentences max unless they ask for more). Be warm but direct."
  },
  {
    id: "debrief",
    title: "Debrief",
    desc: "Unpack a conversation that already happened",
    prompt: "You are Prellu, an AI communication coach. The user wants to DEBRIEF a conversation that already happened. Ask them warmly: what happened, and how are they feeling about it? Then help them understand what went well, what didn't, and what they could do differently next time. Validate their feelings but also offer honest perspective. Keep responses concise (2-4 sentences max unless they ask for more). Be warm but direct."
  },
  {
    id: "rewrite",
    title: "Rewrite",
    desc: "Reword a message before you send it",
    prompt: "You are Prellu, an AI communication coach. The user wants to REWRITE a message before sending it. Ask them to share the message and who it's for. Then offer 2-3 rewritten versions that are clearer, kinder, or more effective depending on their goal. Explain briefly why each version works. Keep responses concise. Be warm but direct."
  },
  {
    id: "roleplay",
    title: "Role-play",
    desc: "Practice with me playing the other person",
    prompt: "You are Prellu, an AI communication coach. The user wants to ROLE-PLAY a difficult conversation. Ask them: who is the other person, what's the situation, and how does that person typically communicate? Then step INTO CHARACTER as that person. Stay in character for the role-play, but break character occasionally (marked with [Coach note:]) to give quick feedback on how the user is doing. Keep responses concise and realistic. Be warm but direct when giving coaching notes."
  }
];

const FREE_MESSAGE_LIMIT = 10;

const COACHES = [
  {
    id: "default",
    name: "Prellu",
    subtitle: "The all-rounder",
    desc: "Warm, direct, and balanced. The classic Prellu voice.",
    pro: false,
    promptModifier: ""
  },
  {
    id: "andrew",
    name: "Andrew",
    subtitle: "The pragmatist",
    desc: "Tech founder energy. Bottom-line thinking for business, bootstrapping, and workplace conversations. Cuts through noise fast.",
    pro: true,
    promptModifier: "Your name is Andrew. You are a pragmatic, bottom-line-oriented coach with a tech founder background. You prioritize actionable outcomes over feelings. You speak in direct, efficient language. You think about conversations like negotiations — what does the user want to walk away with? Help them get there with minimal wasted effort. You respect hustle and appreciate when someone is direct. You occasionally reference frameworks from business (first principles, 80/20, leverage). Don't be cold — you care — but you show it by helping people win, not by hand-holding."
  },
  {
    id: "whitney",
    name: "Whitney",
    subtitle: "The empath",
    desc: "Psychology-trained. Deep empathy and emotional intelligence for personal, family, and relationship conversations.",
    pro: true,
    promptModifier: "Your name is Whitney. You have a psychology background and specialize in empathetic, emotionally intelligent coaching. You help users understand the emotional dynamics underneath conversations — what they're really feeling, what the other person might be feeling, and why. You validate emotions before offering strategies. You use concepts from attachment theory, nonviolent communication, and emotional regulation naturally (without being clinical or jargony). You're warm, patient, and perceptive. You ask questions that help people see their own patterns."
  },
  {
    id: "sarena",
    name: "Sarena",
    subtitle: "Logic meets heart",
    desc: "The best of both — strategic thinking paired with emotional awareness. For conversations that need both head and heart.",
    pro: true,
    promptModifier: "Your name is Sarena. You blend logical, strategic thinking with deep emotional awareness. You help users see both the practical and emotional dimensions of a conversation simultaneously. You might say 'here's what's strategically smart, and here's what feels right — let's find where those overlap.' You're articulate, thoughtful, and balanced. You don't sacrifice empathy for efficiency or vice versa. You help people craft approaches that are both emotionally honest and tactically effective."
  }
];

// ─── Storage helpers ───
async function loadState(key, fallback) {
  try {
    const result = await window.storage.get(key);
    return result ? JSON.parse(result.value) : fallback;
  } catch { return fallback; }
}
async function saveState(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error("Storage save error:", e); }
}

// ─── Orb ───
function Orb({ style }) {
  return <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.15, pointerEvents: "none", ...style }} />;
}

// ─── Legal Page Shell ───
function LegalPage({ title, onBack, children }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      fontFamily: "'DM Sans', sans-serif", padding: "0", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid rgba(245,240,235,0.06)",
        display: "flex", alignItems: "center", gap: "1rem", position: "sticky", top: 0,
        background: "#0B0B0F", zIndex: 10
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "#8B8078", cursor: "pointer",
          fontSize: "1.2rem", padding: "0.25rem", fontFamily: "'DM Sans', sans-serif"
        }}>← Back</button>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF" }}>{title}</span>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem 4rem", lineHeight: 1.75, fontSize: "0.9rem", color: "#C4BAB2" }}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF", marginTop: "2rem", marginBottom: "0.75rem" }}>{children}</h2>;
}
function SectionBody({ children }) {
  return <div style={{ marginBottom: "1.25rem" }}>{children}</div>;
}

// ─── Terms of Service ───
function TermsOfService({ onBack }) {
  return (
    <LegalPage title="Terms of Service" onBack={onBack}>
      <p style={{ color: "#8B8078", marginBottom: "2rem" }}>Effective Date: April 3, 2026 · Last Updated: April 3, 2026</p>

      <SectionBody>
        <p>Welcome to Prellu. These Terms of Service ("Terms") govern your access to and use of the Prellu application, website, and related services (collectively, the "Service") operated by Prellu Inc. ("Prellu," "we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.</p>
      </SectionBody>

      <SectionTitle>1. Eligibility</SectionTitle>
      <SectionBody>
        <p>You must be at least 18 years of age to use the Service. By using Prellu, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
      </SectionBody>

      <SectionTitle>2. Description of Service</SectionTitle>
      <SectionBody>
        <p>Prellu is an AI-powered communication coaching platform that helps users prepare for, reflect on, and improve how they navigate difficult conversations. The Service uses large language models to provide coaching suggestions, conversation rehearsal, message rewrites, and role-play practice.</p>
        <p style={{ marginTop: "0.75rem" }}><strong style={{ color: "#E8DED5" }}>Prellu is not a substitute for professional therapy, counseling, or medical advice.</strong> The Service is intended for general communication skill-building and personal reflection. It does not provide mental health diagnoses, treatment plans, or crisis intervention.</p>
      </SectionBody>

      <SectionTitle>3. Account Registration</SectionTitle>
      <SectionBody>
        <p>Certain features of the Service may require you to create an account. You agree to provide accurate and complete information during registration and to keep your account credentials secure. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect any unauthorized use of your account.</p>
      </SectionBody>

      <SectionTitle>4. Free and Paid Tiers</SectionTitle>
      <SectionBody>
        <p>Prellu offers a free tier with limited monthly messages and a paid subscription ("Pro") with additional features. Free tier limits reset monthly. Pro subscriptions are billed on a recurring monthly or annual basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period. No refunds will be provided for partial billing periods unless required by applicable law.</p>
      </SectionBody>

      <SectionTitle>5. AI-Generated Content Disclaimer</SectionTitle>
      <SectionBody>
        <p>All coaching suggestions, conversation scripts, rewrites, and other outputs generated by Prellu are produced by artificial intelligence and are provided on an "as is" basis. AI outputs may be inaccurate, incomplete, or inappropriate for your specific situation. You are solely responsible for evaluating and deciding whether to use any AI-generated content. Prellu does not warrant the accuracy, reliability, or suitability of any AI output.</p>
        <p style={{ marginTop: "0.75rem" }}>We do not guarantee that AI-generated content is free from errors, bias, copyright infringement, or other issues. You agree to review all outputs before acting on them.</p>
      </SectionBody>

      <SectionTitle>6. Acceptable Use</SectionTitle>
      <SectionBody>
        <p>You agree not to use the Service to: (a) violate any applicable law or regulation; (b) transmit harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable content; (c) impersonate any person or entity; (d) attempt to gain unauthorized access to the Service or its underlying systems; (e) use the Service to harass, stalk, or harm another person; (f) reverse engineer, decompile, or disassemble any part of the Service; (g) use the Service to generate content intended to deceive or manipulate others; or (h) use the Service for any purpose for which it is not intended, including as a substitute for professional mental health services.</p>
      </SectionBody>

      <SectionTitle>7. Intellectual Property</SectionTitle>
      <SectionBody>
        <p>The Service, including its design, code, AI models, branding, and all related intellectual property, is owned by Prellu Inc. and its licensors. You retain ownership of the content you input into the Service ("User Content"). By using the Service, you grant Prellu a limited, non-exclusive license to process your User Content solely to provide the Service. We do not use your User Content to train AI models. AI-generated outputs provided to you are licensed for your personal, non-commercial use.</p>
      </SectionBody>

      <SectionTitle>8. Limitation of Liability</SectionTitle>
      <SectionBody>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PRELLU AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. PRELLU'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO PRELLU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
      </SectionBody>

      <SectionTitle>9. Indemnification</SectionTitle>
      <SectionBody>
        <p>You agree to indemnify, defend, and hold harmless Prellu and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in connection with: (a) your use of the Service; (b) your violation of these Terms; (c) your reliance on any AI-generated content; or (d) your violation of any third-party rights.</p>
      </SectionBody>

      <SectionTitle>10. Disclaimer of Warranties</SectionTitle>
      <SectionBody>
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. PRELLU DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.</p>
      </SectionBody>

      <SectionTitle>11. Termination</SectionTitle>
      <SectionBody>
        <p>We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination (including limitation of liability, indemnification, and intellectual property) shall survive.</p>
      </SectionBody>

      <SectionTitle>12. Changes to Terms</SectionTitle>
      <SectionBody>
        <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Service or via email. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
      </SectionBody>

      <SectionTitle>13. Governing Law & Dispute Resolution</SectionTitle>
      <SectionBody>
        <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to conflict of laws principles. Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association in Miami-Dade County, Florida, except that either party may seek injunctive relief in a court of competent jurisdiction. You agree to waive any right to a jury trial or to participate in a class action.</p>
      </SectionBody>

      <SectionTitle>14. Contact</SectionTitle>
      <SectionBody>
        <p>If you have questions about these Terms, please contact us at general@prellu.ai.</p>
      </SectionBody>
    </LegalPage>
  );
}

// ─── Privacy Policy ───
function PrivacyPolicy({ onBack }) {
  return (
    <LegalPage title="Privacy Policy" onBack={onBack}>
      <p style={{ color: "#8B8078", marginBottom: "2rem" }}>Effective Date: April 3, 2026 · Last Updated: April 3, 2026</p>

      <SectionBody>
        <p>This Privacy Policy explains how Prellu Inc. ("Prellu," "we," "us," or "our") collects, uses, stores, and protects your information when you use the Prellu application and related services (the "Service"). We are committed to protecting your privacy and being transparent about our data practices.</p>
      </SectionBody>

      <SectionTitle>1. Information We Collect</SectionTitle>
      <SectionBody>
        <p><strong style={{ color: "#E8DED5" }}>Account Information:</strong> When you create an account, we collect your email address and any profile information you provide.</p>
        <p style={{ marginTop: "0.5rem" }}><strong style={{ color: "#E8DED5" }}>Conversation Data:</strong> We store the messages you exchange with Prellu's AI coach, including your inputs and the AI's responses, to maintain your conversation history and enable follow-up sessions.</p>
        <p style={{ marginTop: "0.5rem" }}><strong style={{ color: "#E8DED5" }}>Usage Data:</strong> We collect information about how you interact with the Service, including features used, session duration, and message counts. This data is used to improve the Service and enforce usage limits.</p>
        <p style={{ marginTop: "0.5rem" }}><strong style={{ color: "#E8DED5" }}>Device & Technical Data:</strong> We may collect device type, operating system, browser type, IP address, and similar technical information for security and performance purposes.</p>
        <p style={{ marginTop: "0.5rem" }}><strong style={{ color: "#E8DED5" }}>Payment Information:</strong> If you subscribe to a paid plan, payment processing is handled by our third-party payment processor. We do not store your full credit card number.</p>
      </SectionBody>

      <SectionTitle>2. How We Use Your Information</SectionTitle>
      <SectionBody>
        <p>We use your information to: provide and maintain the Service; save and restore your conversation history; process payments and manage subscriptions; enforce usage limits and prevent abuse; communicate with you about your account and the Service; improve and develop new features; and comply with legal obligations.</p>
      </SectionBody>

      <SectionTitle>3. AI Processing & Third-Party Providers</SectionTitle>
      <SectionBody>
        <p>Your conversation messages are processed by Anthropic's Claude API to generate AI coaching responses. Under our agreement with Anthropic, your inputs and outputs are not used by Anthropic to train their AI models, and are not retained by Anthropic beyond the duration necessary to process your request. We may change our underlying AI provider in the future, in which case we will update this policy and ensure equivalent or stronger data protections are in place.</p>
      </SectionBody>

      <SectionTitle>4. Data Isolation & Security</SectionTitle>
      <SectionBody>
        <p>Your conversation data is logically isolated from other users' data. No other user can access your conversations or account information. We implement industry-standard security measures, including encryption of data in transit (TLS) and at rest (AES-256), access controls, and regular security reviews. Despite these measures, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
      </SectionBody>

      <SectionTitle>5. What We Do Not Do</SectionTitle>
      <SectionBody>
        <p>We do not sell your personal data to third parties. We do not use your conversation content to train AI models. We do not share your data with advertisers. We do not allow any third party to access your individual conversation data, except as required by law.</p>
      </SectionBody>

      <SectionTitle>6. Data Retention</SectionTitle>
      <SectionBody>
        <p>We retain your account information and conversation data for as long as your account is active. You may delete individual conversation threads at any time. If you delete your account, we will delete your personal data and conversation history within 30 days, except where retention is required by law or for legitimate business purposes (such as fraud prevention or legal compliance).</p>
      </SectionBody>

      <SectionTitle>7. Your Rights</SectionTitle>
      <SectionBody>
        <p>Depending on your jurisdiction, you may have the right to: access the personal data we hold about you; request correction or deletion of your data; object to or restrict certain processing of your data; request data portability; and withdraw consent where processing is based on consent. To exercise any of these rights, contact us at general@prellu.ai. We will respond within 30 days.</p>
      </SectionBody>

      <SectionTitle>8. California Residents (CCPA/CPRA)</SectionTitle>
      <SectionBody>
        <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act and the California Privacy Rights Act, including the right to know what personal information we collect and how it is used, the right to delete your personal information, and the right to opt out of the sale or sharing of your personal information. We do not sell or share personal information as defined under CCPA/CPRA.</p>
      </SectionBody>

      <SectionTitle>9. International Users (GDPR)</SectionTitle>
      <SectionBody>
        <p>If you are located in the European Economic Area, United Kingdom, or Switzerland, we process your data under the legal bases of contract performance and legitimate interest. For data transfers outside the EEA, we rely on Standard Contractual Clauses approved by the European Commission. You may contact our data protection team at general@prellu.ai to exercise your rights under GDPR.</p>
      </SectionBody>

      <SectionTitle>10. Children's Privacy</SectionTitle>
      <SectionBody>
        <p>The Service is not intended for users under the age of 18. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor, we will delete it promptly.</p>
      </SectionBody>

      <SectionTitle>11. Changes to This Policy</SectionTitle>
      <SectionBody>
        <p>We may update this Privacy Policy from time to time. Material changes will be communicated through the Service or via email. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.</p>
      </SectionBody>

      <SectionTitle>12. Contact</SectionTitle>
      <SectionBody>
        <p>For questions or concerns about this Privacy Policy, contact us at general@prellu.ai.</p>
      </SectionBody>
    </LegalPage>
  );
}

// ─── Disclaimer Gate ───
function Disclaimer({ onAccept, onOpenTerms, onOpenPrivacy }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "2rem", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <Orb style={{ width: 400, height: 400, background: "radial-gradient(circle, #D4956A, transparent)", top: "-8%", right: "-5%" }} />

      <div style={{
        maxWidth: 520, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)", position: "relative", zIndex: 1
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "1.5rem" }}>
          Before we begin
        </div>

        <div style={{
          background: "rgba(245, 240, 235, 0.04)", border: "1px solid rgba(245, 240, 235, 0.08)",
          borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", lineHeight: 1.7, fontSize: "0.92rem", color: "#C4BAB2"
        }}>
          <p style={{ marginBottom: "1rem", color: "#FFFFFF", fontWeight: 500 }}>
            Prellu is an AI communication coach — not a licensed therapist, counselor, or medical professional.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            Prellu can make mistakes. Its suggestions are meant to help you think through conversations, not replace professional advice. Use your own judgment.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            <strong style={{ color: "#E8DED5" }}>If you are in crisis or experiencing thoughts of self-harm, please contact the 988 Suicide & Crisis Lifeline (call or text 988) or emergency services.</strong>
          </p>
          <p style={{ marginBottom: "1rem" }}>
            Your conversations are private and isolated to your account. We do not share, sell, or use your conversation data for training. Sessions are processed through Anthropic's API under their enterprise data policy — inputs and outputs are not retained by Anthropic.
          </p>
          <p style={{ marginBottom: 0 }}>
            No data from your sessions is accessible to other users. All stored data is encrypted at rest.
          </p>
        </div>

        <button onClick={onAccept} style={{
          background: "linear-gradient(135deg, #D4956A, #B8785A)", color: "#0B0B0F", border: "none",
          padding: "0.9rem 2rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          borderRadius: "100px", cursor: "pointer", width: "100%",
          boxShadow: "0 0 40px rgba(212, 149, 106, 0.25)", letterSpacing: "0.02em", transition: "box-shadow 0.3s"
        }}
          onMouseOver={e => e.target.style.boxShadow = "0 0 60px rgba(212, 149, 106, 0.4)"}
          onMouseOut={e => e.target.style.boxShadow = "0 0 40px rgba(212, 149, 106, 0.25)"}
        >
          I understand — let's go
        </button>

        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#6B6360", marginTop: "1rem" }}>
          By continuing, you agree to our{" "}
          <span onClick={onOpenTerms} style={{ color: "#D4A574", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</span>
          {" "}and{" "}
          <span onClick={onOpenPrivacy} style={{ color: "#D4A574", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

// ─── Landing ───
function Landing({ onStart, messageCount, onOpenTerms, onOpenPrivacy, onUpgrade }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", padding: "2rem"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <Orb style={{ width: 500, height: 500, background: "radial-gradient(circle, #D4956A, #C47A5A)", top: "-10%", left: "-10%" }} />
      <Orb style={{ width: 400, height: 400, background: "radial-gradient(circle, #8B6F5C, #A68B79)", bottom: "-5%", right: "-5%" }} />
      <Orb style={{ width: 300, height: 300, background: "radial-gradient(circle, #D4A574, #B8926E)", top: "40%", right: "20%" }} />

      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)", textAlign: "center", maxWidth: 620, position: "relative", zIndex: 1
      }}>
        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 600,
          letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "1.5rem",
          background: "linear-gradient(135deg, #FFFFFF 0%, #D4A574 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>Prellu</div>

        <p style={{
          fontFamily: "'Fraunces', serif", fontSize: "clamp(1.15rem, 3vw, 1.5rem)", fontWeight: 300,
          fontStyle: "italic", color: "#E8DED5", lineHeight: 1.5, marginBottom: "0.75rem",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s"
        }}>Practice the conversation before you have it.</p>

        <p style={{
          fontSize: "1.05rem", color: "#B0A69D", lineHeight: 1.6, marginBottom: "2.5rem",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s"
        }}>A private AI coach for the hard conversations in life — with your boss, your partner, your parent, your friend.</p>

        <button onClick={remaining > 0 ? onStart : undefined} style={{
          background: remaining > 0 ? "linear-gradient(135deg, #D4956A, #B8785A)" : "rgba(245,240,235,0.1)",
          color: remaining > 0 ? "#0B0B0F" : "#8B8078", border: "none", padding: "1rem 2.5rem",
          fontSize: "1.1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, borderRadius: "100px",
          cursor: remaining > 0 ? "pointer" : "default",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, box-shadow 0.3s, transform 0.2s 0s",
          boxShadow: remaining > 0 ? "0 0 40px rgba(212, 149, 106, 0.3)" : "none", letterSpacing: "0.02em"
        }}
          onMouseOver={e => { if (remaining > 0) { e.target.style.boxShadow = "0 0 60px rgba(212, 149, 106, 0.5)"; e.target.style.transform = "scale(1.03)"; }}}
          onMouseOut={e => { if (remaining > 0) { e.target.style.boxShadow = "0 0 40px rgba(212, 149, 106, 0.3)"; e.target.style.transform = "scale(1)"; }}}
          disabled={remaining <= 0}
        >
          {remaining > 0 ? "Start a conversation →" : "Free limit reached"}
        </button>

        {remaining > 0 && remaining <= FREE_MESSAGE_LIMIT && (
          <div style={{
            marginTop: "1rem", fontSize: "0.85rem",
            color: remaining <= 3 ? "#D4956A" : "#8B8078",
            opacity: visible ? 1 : 0, transition: "opacity 1s ease 0.6s"
          }}>
            {remaining} free message{remaining !== 1 ? "s" : ""} remaining this month
          </div>
        )}

        {remaining <= 0 && (
          <div style={{ marginTop: "1.25rem", opacity: visible ? 1 : 0, transition: "opacity 1s ease 0.6s" }}>
            <button onClick={onUpgrade} style={{
              background: "none", border: "1px solid rgba(212, 149, 106, 0.4)", color: "#D4A574",
              padding: "0.7rem 1.8rem", borderRadius: "100px", fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
            }}>
              Upgrade to Pro — $10/mo →
            </button>
          </div>
        )}

        <div style={{
          marginTop: "2.5rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap",
          opacity: visible ? 0.5 : 0, transition: "opacity 1.2s ease 0.7s", fontSize: "0.85rem", color: "#8B8078"
        }}>
          <span>No signup required</span><span>·</span><span>Judgment-free</span><span>·</span><span>Private & secure</span>
        </div>
        <div style={{
          marginTop: "1rem", display: "flex", gap: "1.5rem", justifyContent: "center",
          opacity: visible ? 0.4 : 0, transition: "opacity 1.2s ease 0.8s", fontSize: "0.78rem", color: "#6B6360"
        }}>
          <span onClick={onOpenTerms} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms</span>
          <span onClick={onOpenPrivacy} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy</span>
        </div>
      </div>
    </div>
  );
}

// ─── Account Page ───
function AccountPage({ onBack, profile, onUpdateProfile, onCancelSubscription, onUpgrade }) {
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [saved, setSaved] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  async function handleSave() {
    await onUpdateProfile({ ...profile, name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCancel() {
    onCancelSubscription();
    setShowCancelConfirm(false);
  }

  const plan = profile.plan || "free";
  const planLabel = plan === "proplus" ? "Pro+" : plan === "pro" ? "Pro" : "Free";
  const planPrice = plan === "proplus" ? "$15/mo" : plan === "pro" ? "$10/mo" : "$0/mo";

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />

      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid rgba(245,240,235,0.06)",
        display: "flex", alignItems: "center", gap: "1rem", position: "sticky", top: 0,
        background: "#0B0B0F", zIndex: 10
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "#8B8078", cursor: "pointer",
          fontSize: "1.2rem", padding: "0.25rem", fontFamily: "'DM Sans', sans-serif"
        }}>← Back</button>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF" }}>Account</span>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Profile fields */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#6B6360", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", fontWeight: 500 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            style={{
              width: "100%", background: "rgba(245,240,235,0.06)", border: "1px solid rgba(245,240,235,0.1)",
              borderRadius: "12px", padding: "0.85rem 1rem", color: "#F5F0EB", fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "rgba(212,149,106,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(245,240,235,0.1)"}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#6B6360", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", fontWeight: 500 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
            style={{
              width: "100%", background: "rgba(245,240,235,0.06)", border: "1px solid rgba(245,240,235,0.1)",
              borderRadius: "12px", padding: "0.85rem 1rem", color: "#F5F0EB", fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor = "rgba(212,149,106,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(245,240,235,0.1)"}
          />
        </div>

        <button onClick={handleSave} style={{
          background: "linear-gradient(135deg, #D4956A, #B8785A)", color: "#0B0B0F", border: "none",
          padding: "0.8rem 2rem", fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          borderRadius: "100px", cursor: "pointer", width: "100%", transition: "box-shadow 0.3s",
          boxShadow: "0 0 30px rgba(212,149,106,0.2)"
        }}
          onMouseOver={e => e.target.style.boxShadow = "0 0 50px rgba(212,149,106,0.35)"}
          onMouseOut={e => e.target.style.boxShadow = "0 0 30px rgba(212,149,106,0.2)"}
        >
          {saved ? "Saved" : "Save changes"}
        </button>

        {/* Subscription */}
        <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(245,240,235,0.06)", paddingTop: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#6B6360", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontWeight: 500 }}>Subscription</label>

          <div style={{
            background: "rgba(245,240,235,0.04)", border: "1px solid rgba(245,240,235,0.08)",
            borderRadius: "14px", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF" }}>{planLabel}</div>
              <div style={{ color: "#8B8078", fontSize: "0.88rem", marginTop: "0.2rem" }}>{planPrice}</div>
            </div>
            {plan === "free" ? (
              <button onClick={onUpgrade} style={{
                background: "none", border: "1px solid rgba(212,149,106,0.4)", color: "#D4A574",
                padding: "0.55rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
              }}>Upgrade</button>
            ) : (
              <div style={{
                background: "rgba(212,149,106,0.1)", color: "#D4A574", padding: "0.3rem 0.75rem",
                borderRadius: "100px", fontSize: "0.78rem", fontWeight: 600
              }}>Active</div>
            )}
          </div>

          {plan !== "free" && !showCancelConfirm && (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              background: "none", border: "none", color: "#6B6360", fontSize: "0.85rem",
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer", marginTop: "1rem",
              padding: "0.5rem 0", textDecoration: "underline", textUnderlineOffset: "2px"
            }}>Cancel subscription</button>
          )}

          {plan !== "free" && showCancelConfirm && (
            <div style={{
              marginTop: "1rem", background: "rgba(220,80,80,0.08)", border: "1px solid rgba(220,80,80,0.2)",
              borderRadius: "12px", padding: "1rem"
            }}>
              <p style={{ fontSize: "0.9rem", color: "#E8DED5", marginBottom: "0.75rem" }}>
                Are you sure? Your access will continue until the end of the current billing period, then revert to the Free plan.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={handleCancel} style={{
                  background: "rgba(220,80,80,0.15)", border: "1px solid rgba(220,80,80,0.3)", color: "#E07070",
                  padding: "0.55rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
                }}>Yes, cancel</button>
                <button onClick={() => setShowCancelConfirm(false)} style={{
                  background: "rgba(245,240,235,0.06)", border: "1px solid rgba(245,240,235,0.1)", color: "#A09890",
                  padding: "0.55rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
                }}>Never mind</button>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(245,240,235,0.06)", paddingTop: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#6B6360", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", fontWeight: 500 }}>Data</label>
          <button onClick={async () => {
            try { await window.storage.delete("prellu-threads"); await window.storage.delete("prellu-msg-count"); await window.storage.delete("prellu-disclaimer"); await window.storage.delete("prellu-profile"); } catch {}
            window.location.reload();
          }} style={{
            background: "none", border: "1px solid rgba(220,80,80,0.2)", color: "#A06060",
            padding: "0.6rem 1.25rem", borderRadius: "100px", fontSize: "0.85rem",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer"
          }}>Delete all data & reset</button>
          <p style={{ fontSize: "0.78rem", color: "#6B6360", marginTop: "0.5rem" }}>This removes all conversations, preferences, and account data. This cannot be undone.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Coach Selection (after mode, before chat) ───
function CoachSelect({ mode, onSelect, onBack, isPro, isProPlus, onUpgrade, selectedCoachId }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "2rem", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <Orb style={{ width: 350, height: 350, background: "radial-gradient(circle, #D4956A, transparent)", bottom: "10%", left: "5%" }} />

      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)", textAlign: "center", marginBottom: "2rem"
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "#6B6360", cursor: "pointer",
          fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif", marginBottom: "1rem", display: "block"
        }}>← Back to modes</button>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.4rem" }}>
          Who should coach you?
        </div>
        <p style={{ color: "#A09890", fontSize: "0.95rem" }}>{mode.title} mode — pick your coaching style</p>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: "0.75rem",
        maxWidth: 480, width: "100%", position: "relative", zIndex: 1
      }}>
        {COACHES.map((coach, i) => {
          const isFree = !coach.pro;
          const isUnlockedByProPlus = isProPlus && coach.pro;
          const isUnlockedByPro = isPro && !isProPlus && coach.pro && selectedCoachId === coach.id;
          const isUnlocked = isFree || isUnlockedByProPlus || isUnlockedByPro;
          const isPickable = isFree || isUnlockedByProPlus || (isPro && !isProPlus && (!selectedCoachId || selectedCoachId === coach.id));
          const locked = coach.pro && !isUnlocked && !isPickable;

          let badgeText = null;
          if (coach.pro && !isPro) badgeText = "Pro";
          else if (coach.pro && isPro && !isProPlus && !selectedCoachId) badgeText = "Pick 1";
          else if (coach.pro && isPro && !isProPlus && selectedCoachId && selectedCoachId !== coach.id) badgeText = "Pro+";

          return (
            <button key={coach.id} onClick={() => isPickable ? onSelect(coach) : null} style={{
              background: locked ? "rgba(245,240,235,0.02)" : "rgba(245, 240, 235, 0.04)",
              border: locked ? "1px solid rgba(245,240,235,0.04)" : "1px solid rgba(245, 240, 235, 0.08)",
              borderRadius: "16px", padding: "1.25rem 1.5rem", textAlign: "left",
              cursor: locked ? "default" : "pointer",
              color: "#F5F0EB", fontFamily: "'DM Sans', sans-serif",
              opacity: visible ? (locked ? 0.55 : 1) : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.08}s, border-color 0.25s, background 0.25s, box-shadow 0.25s`,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem"
            }}
              onMouseOver={e => { if (!locked) { e.currentTarget.style.background = "rgba(212, 149, 106, 0.08)"; e.currentTarget.style.borderColor = "rgba(212, 149, 106, 0.3)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(212, 149, 106, 0.08)"; }}}
              onMouseOut={e => { if (!locked) { e.currentTarget.style.background = "rgba(245, 240, 235, 0.04)"; e.currentTarget.style.borderColor = "rgba(245, 240, 235, 0.08)"; e.currentTarget.style.boxShadow = "none"; }}}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem", fontWeight: 600, color: locked ? "#6B6360" : "#FFFFFF" }}>{coach.name}</span>
                  <span style={{ fontSize: "0.8rem", color: "#8B8078" }}>{coach.subtitle}</span>
                  {isUnlockedByPro && <span style={{ fontSize: "0.7rem", color: "#D4956A" }}>Your coach</span>}
                </div>
                <div style={{ color: locked ? "#4A4540" : "#A09890", fontSize: "0.85rem", lineHeight: 1.45 }}>{coach.desc}</div>
              </div>
              {badgeText && (
                <div style={{
                  background: "rgba(212,149,106,0.1)", color: "#D4A574", padding: "0.3rem 0.7rem",
                  borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0,
                  letterSpacing: "0.05em", textTransform: "uppercase"
                }}>{badgeText}</div>
              )}
            </button>
          );
        })}
      </div>

      {!isPro && (
        <div style={{
          marginTop: "1.5rem", opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.5s",
          textAlign: "center"
        }}>
          <button onClick={onUpgrade} style={{
            background: "none", border: "1px solid rgba(212,149,106,0.3)", color: "#D4A574",
            padding: "0.6rem 1.5rem", borderRadius: "100px", fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
          }}>Unlock coaches — starting at $10/mo</button>
        </div>
      )}

      {isPro && !isProPlus && (
        <div style={{
          marginTop: "1.5rem", opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.5s",
          textAlign: "center"
        }}>
          <button onClick={onUpgrade} style={{
            background: "none", border: "1px solid rgba(212,149,106,0.3)", color: "#D4A574",
            padding: "0.6rem 1.5rem", borderRadius: "100px", fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer"
          }}>Unlock all coaches — upgrade to Pro+ $15/mo</button>
        </div>
      )}
    </div>
  );
}

// ─── Mode Selection ───
function ModeSelect({ onSelect, savedThreads, onResumeThread, onOpenAccount }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  const hasThreads = savedThreads && savedThreads.length > 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "2rem", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <Orb style={{ width: 350, height: 350, background: "radial-gradient(circle, #D4956A, transparent)", top: "5%", right: "10%" }} />

      {/* Account button */}
      <button onClick={onOpenAccount} style={{
        position: "absolute", top: "1.25rem", right: "1.25rem", zIndex: 5,
        background: "rgba(245,240,235,0.06)", border: "1px solid rgba(245,240,235,0.08)",
        borderRadius: "100px", padding: "0.5rem 1rem", color: "#A09890", fontSize: "0.85rem",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer",
        display: "flex", alignItems: "center", gap: "0.4rem", transition: "border-color 0.2s, color 0.2s"
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(212,149,106,0.3)"; e.currentTarget.style.color = "#E8DED5"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(245,240,235,0.08)"; e.currentTarget.style.color = "#A09890"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Account
      </button>

      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)", textAlign: "center", marginBottom: "2rem"
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "2.2rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.5rem" }}>
          What do you need?
        </div>
        <p style={{ color: "#A09890", fontSize: "1.05rem" }}>Pick a mode. No wrong answers.</p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem", maxWidth: 560, width: "100%", position: "relative", zIndex: 1
      }}>
        {MODES.map((mode, i) => (
          <button key={mode.id} onClick={() => onSelect(mode)} style={{
            background: "rgba(245, 240, 235, 0.04)", border: "1px solid rgba(245, 240, 235, 0.08)",
            borderRadius: "16px", padding: "1.5rem", textAlign: "left", cursor: "pointer",
            color: "#F5F0EB", fontFamily: "'DM Sans', sans-serif",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.1}s, border-color 0.25s, background 0.25s, box-shadow 0.25s`,
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(212, 149, 106, 0.08)"; e.currentTarget.style.borderColor = "rgba(212, 149, 106, 0.3)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(212, 149, 106, 0.08)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(245, 240, 235, 0.04)"; e.currentTarget.style.borderColor = "rgba(245, 240, 235, 0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.35rem", fontWeight: 600, marginBottom: "0.4rem", color: "#FFFFFF" }}>{mode.title}</div>
            <div style={{ color: "#A09890", fontSize: "0.9rem", lineHeight: 1.45 }}>{mode.desc}</div>
          </button>
        ))}
      </div>

      {/* Saved threads */}
      {hasThreads && (
        <div style={{
          marginTop: "2.5rem", maxWidth: 560, width: "100%",
          opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.6s"
        }}>
          <div style={{ fontSize: "0.82rem", color: "#6B6360", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", fontWeight: 500 }}>
            Continue a conversation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {savedThreads.slice(0, 4).map(thread => (
              <button key={thread.id} onClick={() => onResumeThread(thread)} style={{
                background: "rgba(245, 240, 235, 0.03)", border: "1px solid rgba(245, 240, 235, 0.06)",
                borderRadius: "12px", padding: "0.85rem 1.15rem", textAlign: "left", cursor: "pointer",
                color: "#F5F0EB", fontFamily: "'DM Sans', sans-serif", display: "flex",
                justifyContent: "space-between", alignItems: "center", transition: "background 0.2s, border-color 0.2s"
              }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(245, 240, 235, 0.06)"; e.currentTarget.style.borderColor = "rgba(245, 240, 235, 0.1)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(245, 240, 235, 0.03)"; e.currentTarget.style.borderColor = "rgba(245, 240, 235, 0.06)"; }}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: "0.92rem" }}>{thread.preview}</span>
                  <span style={{ color: "#6B6360", fontSize: "0.8rem", marginLeft: "0.75rem" }}>{thread.modeTitle}</span>
                </div>
                <span style={{ color: "#6B6360", fontSize: "0.75rem" }}>{thread.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Paywall Banner ───
function PaywallBanner({ onUpgrade }) {
  return (
    <div style={{
      padding: "1.25rem", margin: "0.75rem", borderRadius: "14px",
      background: "linear-gradient(135deg, rgba(212, 149, 106, 0.12), rgba(184, 120, 90, 0.06))",
      border: "1px solid rgba(212, 149, 106, 0.2)", textAlign: "center"
    }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.4rem" }}>
        You've used your 10 free messages
      </div>
      <div style={{ color: "#A09890", fontSize: "0.88rem", marginBottom: "1rem", lineHeight: 1.5 }}>
        Upgrade to Pro for unlimited messages, saved history, and coach personalities.
      </div>
      <button onClick={onUpgrade} style={{
        background: "linear-gradient(135deg, #D4956A, #B8785A)", color: "#0B0B0F", border: "none",
        padding: "0.7rem 1.8rem", borderRadius: "100px", fontSize: "0.95rem",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, cursor: "pointer"
      }}>
        Upgrade to Pro — $10/mo
      </button>
    </div>
  );
}

// ─── Chat ───
function Chat({ mode, coach, onBack, messageCount, onMessageSent, existingMessages, onUpgrade }) {
  const systemPrompt = coach && coach.promptModifier
    ? `${mode.prompt}\n\nCOACH PERSONALITY:\n${coach.promptModifier}`
    : mode.prompt;
  const coachLabel = coach && coach.id !== "default" ? ` · ${coach.name}` : "";

  const [messages, setMessages] = useState(existingMessages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(!existingMessages || existingMessages.length === 0);
  const [streaming, setStreaming] = useState(false);
  const [hitLimit, setHitLimit] = useState(messageCount >= FREE_MESSAGE_LIMIT);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const threadIdRef = useRef((existingMessages && existingMessages._threadId) || `thread_${Date.now()}`);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Save thread whenever messages change
  const saveThread = useCallback(async (msgs) => {
    if (msgs.length === 0) return;
    const firstUserMsg = msgs.find(m => m.role === "user");
    const preview = firstUserMsg ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "") : "New conversation";
    const thread = {
      id: threadIdRef.current,
      modeId: mode.id,
      modeTitle: mode.title,
      coachId: coach ? coach.id : "default",
      messages: msgs,
      preview,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      updatedAt: Date.now()
    };
    const allThreads = await loadState("prellu-threads", []);
    const idx = allThreads.findIndex(t => t.id === thread.id);
    if (idx >= 0) allThreads[idx] = thread; else allThreads.unshift(thread);
    await saveState("prellu-threads", allThreads.slice(0, 20));
  }, [mode, coach]);

  // Initial greeting
  useEffect(() => {
    if (existingMessages && existingMessages.length > 0) { setLoading(false); setTimeout(() => inputRef.current?.focus(), 100); return; }
    async function greet() {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: "Hi, I'd like to start a session." }] })
        });
        const data = await res.json();
        const text = data.content?.map(c => c.text || "").join("") || "Hi! Tell me what's on your mind.";
        const initial = [{ role: "assistant", content: text }];
        setMessages(initial);
        await saveThread(initial);
      } catch {
        const fallback = [{ role: "assistant", content: "Hi there. I'm Prellu, your communication coach. What conversation is on your mind?" }];
        setMessages(fallback);
      }
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    greet();
  }, [mode, existingMessages, saveThread, systemPrompt]);

  async function send() {
    if (!input.trim() || streaming || hitLimit) return;
    const userMsg = input.trim();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setStreaming(true);

    const newCount = messageCount + 1;
    onMessageSent(newCount);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: apiMessages })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "I'm sorry, could you say that again?";
      const updated = [...newMessages, { role: "assistant", content: text }];
      setMessages(updated);
      await saveThread(updated);
      if (newCount >= FREE_MESSAGE_LIMIT) setHitLimit(true);
    } catch {
      const errMsgs = [...newMessages, { role: "assistant", content: "Something went wrong — could you try that again?" }];
      setMessages(errMsgs);
    }
    setStreaming(false);
  }

  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - messageCount);

  return (
    <div style={{
      height: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", position: "relative"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid rgba(245, 240, 235, 0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", color: "#8B8078", cursor: "pointer",
            fontSize: "1.2rem", padding: "0.25rem", fontFamily: "'DM Sans', sans-serif"
          }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF" }}>Prellu</span>
            <span style={{ color: "#8B8078", fontSize: "0.88rem" }}>· {mode.title}{coachLabel}</span>
          </div>
        </div>
        {remaining > 0 && (
          <div style={{
            fontSize: "0.78rem", color: remaining <= 3 ? "#D4956A" : "#6B6360",
            background: "rgba(245,240,235,0.04)", padding: "0.3rem 0.75rem", borderRadius: "100px"
          }}>
            {remaining} left
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#D4956A",
                  animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.4s ease" }}>
            <div style={{
              maxWidth: "80%", padding: "0.9rem 1.15rem",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? "linear-gradient(135deg, #D4956A, #B8785A)" : "rgba(245, 240, 235, 0.06)",
              color: msg.role === "user" ? "#0B0B0F" : "#F5F0EB",
              fontSize: "0.95rem", lineHeight: 1.55, fontWeight: msg.role === "user" ? 500 : 400, whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "0.9rem 1.15rem", borderRadius: "18px 18px 18px 4px",
              background: "rgba(245, 240, 235, 0.06)", display: "flex", gap: "5px", alignItems: "center"
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#8B8078",
                  animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        {hitLimit && <PaywallBanner onUpgrade={onUpgrade} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem 1rem 1.25rem", borderTop: "1px solid rgba(245, 240, 235, 0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "0.5rem", maxWidth: 700, margin: "0 auto", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef} value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={hitLimit ? "Upgrade to Pro to continue..." : "Type your message..."}
            disabled={hitLimit}
            rows={1}
            style={{
              flex: 1, background: "rgba(245, 240, 235, 0.06)", border: "1px solid rgba(245, 240, 235, 0.1)",
              borderRadius: "20px", padding: "0.85rem 1.25rem", color: "#F5F0EB", fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
              opacity: hitLimit ? 0.4 : 1, resize: "none", overflow: "hidden",
              minHeight: "46px", maxHeight: "160px", lineHeight: 1.5
            }}
            onFocus={e => e.target.style.borderColor = "rgba(212, 149, 106, 0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(245, 240, 235, 0.1)"}
          />
          <button onClick={send} disabled={!input.trim() || streaming || hitLimit} style={{
            background: input.trim() && !streaming && !hitLimit ? "linear-gradient(135deg, #D4956A, #B8785A)" : "rgba(245, 240, 235, 0.06)",
            border: "none", borderRadius: "50%", width: 46, height: 46,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: input.trim() && !streaming && !hitLimit ? "pointer" : "default",
            transition: "all 0.2s", flexShrink: 0, fontSize: "1.2rem",
            color: input.trim() && !streaming && !hitLimit ? "#0B0B0F" : "#6B6360"
          }}>↑</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #6B6360; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,240,235,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Upgrade Screen ───
function UpgradeScreen({ onBack, onSelectPlan, currentPlan }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const plans = [
    { id: "pro", name: "Pro", price: "$10", period: "/mo", annual: "$99/yr", highlight: false, features: ["Unlimited messages", "Choose 1 coach personality", "Saved conversation history", "Follow-up threads"] },
    { id: "proplus", name: "Pro+", price: "$15", period: "/mo", annual: "$149/yr", highlight: true, features: ["Everything in Pro", "All 3 coach personalities unlocked", "Switch coaches anytime", "Priority response speed"] }
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0B0B0F", color: "#F5F0EB",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
      <Orb style={{ width: 400, height: 400, background: "radial-gradient(circle, #D4956A, transparent)", top: "0%", right: "-5%" }} />

      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid rgba(245,240,235,0.06)",
        display: "flex", alignItems: "center", gap: "1rem"
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "#8B8078", cursor: "pointer",
          fontSize: "1.2rem", padding: "0.25rem", fontFamily: "'DM Sans', sans-serif"
        }}>← Back</button>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", fontWeight: 600, color: "#FFFFFF" }}>Upgrade</span>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{
          textAlign: "center", marginBottom: "2rem",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", fontWeight: 600, color: "#FFFFFF", marginBottom: "0.5rem" }}>
            Invest in better conversations
          </div>
          <p style={{ color: "#A09890", fontSize: "0.95rem" }}>Unlock unlimited coaching with the personality that fits you.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {plans.map((plan, i) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isHighlight = plan.highlight;
            return (
            <div key={plan.id} style={{
              background: "rgba(245,240,235,0.04)",
              border: isHighlight ? "1px solid rgba(212,149,106,0.3)" : "1px solid rgba(245,240,235,0.08)",
              borderRadius: "16px", padding: "1.5rem", position: "relative",
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.1}s`
            }}>
              {isHighlight && (
                <div style={{
                  position: "absolute", top: "-0.5rem", right: "1.25rem",
                  background: "linear-gradient(135deg, #D4956A, #B8785A)", color: "#0B0B0F",
                  padding: "0.2rem 0.7rem", borderRadius: "100px", fontSize: "0.7rem",
                  fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase"
                }}>Best value</div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem", fontWeight: 600, color: "#FFFFFF" }}>{plan.name}</div>
                  <div style={{ color: "#6B6360", fontSize: "0.8rem", marginTop: "0.15rem" }}>or {plan.annual} billed annually</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: "2rem", fontWeight: 600, color: "#FFFFFF" }}>{plan.price}</span>
                  <span style={{ color: "#8B8078", fontSize: "0.9rem" }}>{plan.period}</span>
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontSize: "0.88rem", color: "#C4BAB2" }}>
                    <span style={{ color: "#D4956A", fontSize: "0.75rem" }}>✓</span> {f}
                  </div>
                ))}
              </div>

              {isCurrentPlan ? (
                <div style={{
                  background: "rgba(212,149,106,0.1)", color: "#D4A574",
                  padding: "0.8rem", borderRadius: "100px", textAlign: "center",
                  fontSize: "0.95rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
                }}>Current plan</div>
              ) : (
                <button onClick={() => onSelectPlan(plan.id)} style={{
                  background: isHighlight ? "linear-gradient(135deg, #D4956A, #B8785A)" : "rgba(245,240,235,0.08)",
                  color: isHighlight ? "#0B0B0F" : "#E8DED5",
                  border: isHighlight ? "none" : "1px solid rgba(245,240,235,0.12)",
                  padding: "0.8rem", fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  borderRadius: "100px", cursor: "pointer", width: "100%",
                  transition: "box-shadow 0.3s",
                  boxShadow: isHighlight ? "0 0 30px rgba(212,149,106,0.2)" : "none"
                }}
                  onMouseOver={e => { if (isHighlight) e.target.style.boxShadow = "0 0 50px rgba(212,149,106,0.35)"; }}
                  onMouseOut={e => { if (isHighlight) e.target.style.boxShadow = "0 0 30px rgba(212,149,106,0.2)"; }}
                >
                  {plan.id === "pro" ? "Start Pro" : "Start Pro+"}
                </button>
              )}
            </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#6B6360", marginTop: "1.5rem", lineHeight: 1.5 }}>
          Cancel anytime. In production, this will connect to Stripe for secure payment processing.
        </p>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function PrelluApp() {
  const [screen, setScreen] = useState("loading");
  const [selectedMode, setSelectedMode] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [savedThreads, setSavedThreads] = useState([]);
  const [resumedMessages, setResumedMessages] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [profile, setProfile] = useState({ name: "", email: "", plan: "free" });

  // Load persisted state on mount
  useEffect(() => {
    async function init() {
      const accepted = await loadState("prellu-disclaimer", false);
      const count = await loadState("prellu-msg-count", { count: 0, month: new Date().getMonth() });
      const threads = await loadState("prellu-threads", []);
      const savedProfile = await loadState("prellu-profile", { name: "", email: "", plan: "free" });

      // Reset count if new month
      const currentMonth = new Date().getMonth();
      const finalCount = count.month === currentMonth ? count.count : 0;
      if (count.month !== currentMonth) await saveState("prellu-msg-count", { count: 0, month: currentMonth });

      setDisclaimerAccepted(accepted);
      setMessageCount(finalCount);
      setSavedThreads(threads);
      setProfile(savedProfile);
      setScreen(accepted ? "landing" : "disclaimer");
    }
    init();
  }, []);

  async function handleDisclaimerAccept() {
    await saveState("prellu-disclaimer", true);
    setDisclaimerAccepted(true);
    setScreen("landing");
  }

  async function handleMessageSent(newCount) {
    setMessageCount(newCount);
    await saveState("prellu-msg-count", { count: newCount, month: new Date().getMonth() });
  }

  async function handleUpdateProfile(newProfile) {
    setProfile(newProfile);
    await saveState("prellu-profile", newProfile);
  }

  async function handleCancelSubscription() {
    const updated = { ...profile, plan: "free", selectedCoachId: null };
    setProfile(updated);
    await saveState("prellu-profile", updated);
  }

  const [prevScreen, setPrevScreen] = useState("select");

  function handleOpenUpgrade(fromScreen) {
    setPrevScreen(fromScreen || screen);
    setScreen("upgrade");
  }

  async function handleUpgradeTo(plan) {
    const updated = { ...profile, plan };
    // If upgrading to Pro+, clear the single-coach lock since all are available
    if (plan === "proplus") updated.selectedCoachId = null;
    setProfile(updated);
    await saveState("prellu-profile", updated);
    setScreen(prevScreen === "upgrade" ? "select" : prevScreen);
  }

  function handleResumeThread(thread) {
    const mode = MODES.find(m => m.id === thread.modeId);
    if (!mode) return;
    const coach = COACHES.find(c => c.id === (thread.coachId || "default")) || COACHES[0];
    const msgs = [...thread.messages];
    msgs._threadId = thread.id;
    setSelectedMode(mode);
    setSelectedCoach(coach);
    setResumedMessages(msgs);
    setScreen("chat");
  }

  if (screen === "loading") {
    return (
      <div style={{ height: "100vh", background: "#0B0B0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%", background: "#D4956A",
              animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    );
  }

  if (screen === "disclaimer") return <Disclaimer onAccept={handleDisclaimerAccept} onOpenTerms={() => setScreen("terms")} onOpenPrivacy={() => setScreen("privacy")} />;

  if (screen === "terms") return <TermsOfService onBack={() => setScreen("disclaimer")} />;
  if (screen === "privacy") return <PrivacyPolicy onBack={() => setScreen("disclaimer")} />;

  if (screen === "account") return <AccountPage onBack={() => setScreen("select")} profile={profile} onUpdateProfile={handleUpdateProfile} onCancelSubscription={handleCancelSubscription} onUpgrade={() => handleOpenUpgrade("account")} />;

  if (screen === "upgrade") return <UpgradeScreen onBack={() => setScreen(prevScreen)} onSelectPlan={handleUpgradeTo} currentPlan={profile.plan} />;

  if (screen === "chat" && selectedMode && selectedCoach) {
    return <Chat mode={selectedMode} coach={selectedCoach} onBack={() => { setScreen("select"); setSelectedMode(null); setSelectedCoach(null); setResumedMessages(null); loadState("prellu-threads", []).then(setSavedThreads); }}
      messageCount={messageCount} onMessageSent={handleMessageSent} existingMessages={resumedMessages} onUpgrade={() => handleOpenUpgrade("chat")} />;
  }

  if (screen === "coach" && selectedMode) {
    return <CoachSelect
      mode={selectedMode}
      isPro={profile.plan === "pro" || profile.plan === "proplus"}
      isProPlus={profile.plan === "proplus"}
      selectedCoachId={profile.selectedCoachId || null}
      onBack={() => { setSelectedMode(null); setScreen("select"); }}
      onSelect={async (coach) => {
        // If Pro (not Pro+) and picking a premium coach for the first time, lock it in
        if (profile.plan === "pro" && coach.pro && !profile.selectedCoachId) {
          const updated = { ...profile, selectedCoachId: coach.id };
          setProfile(updated);
          await saveState("prellu-profile", updated);
        }
        setSelectedCoach(coach);
        setResumedMessages(null);
        setScreen("chat");
      }}
      onUpgrade={() => handleOpenUpgrade("coach")}
    />;
  }

  if (screen === "select") {
    return <ModeSelect
      onSelect={(mode) => { setSelectedMode(mode); setScreen("coach"); }}
      savedThreads={savedThreads}
      onResumeThread={handleResumeThread}
      onOpenAccount={() => setScreen("account")}
    />;
  }

  if (screen === "terms-from-landing") return <TermsOfService onBack={() => setScreen("landing")} />;
  if (screen === "privacy-from-landing") return <PrivacyPolicy onBack={() => setScreen("landing")} />;

  return <Landing onStart={() => setScreen("select")} messageCount={messageCount} onOpenTerms={() => setScreen("terms-from-landing")} onOpenPrivacy={() => setScreen("privacy-from-landing")} onUpgrade={() => handleOpenUpgrade("landing")} />;
}
