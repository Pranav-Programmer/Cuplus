'use client';
import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

export default function ContactSection({ prefillName = '', prefillEmail = '' }: { prefillName?: string; prefillEmail?: string }) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState({ name: prefillName, email: prefillEmail, mobile: '', message: '', subject: '', to_email: 'beatsbreakers@gmail.com', from:'From', cd:'Contact Details' });
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSending(true); setError('');
    if (!serviceId || !templateId || !publicKey) {
        setError('Email service is not configured. Please contact support.');
        setSending(false);
        return;
      }
    try {
      await emailjs.sendForm(
        serviceId,
        templateId,
        formRef.current,
        publicKey,
      );
      setDone(true);
      setFields({ name: prefillName, email: prefillEmail, mobile: '', message: '', subject: '', to_email: 'beatsbreakers@gmail.com', from:'From', cd:'Contact Details' });
    } catch (e: any) {
      setError('Failed to send message. Please try again.');
      // console.error(e);
    } finally { setSending(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border-strong)',
    borderRadius: 10, padding: '10px 14px', fontSize: '0.875rem',
    color: 'var(--text-main)', outline: 'none',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.08)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <section id="contact" className="scroll-mt-6">
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Contact Us</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-faint)' }}>
        Have a question or feedback? We&apos;d love to hear from you.
      </p>
      <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

      {done ? (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="material-icons text-emerald-400 text-5xl block mb-3">mark_email_read</span>
          <p className="font-bold text-emerald-400 text-lg mb-1">Message sent!</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Thank you for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <button onClick={() => setDone(false)}
            className="mt-5 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
            Send another message
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSend} className="space-y-4">
          <input type="hidden" name="to_email" value={fields.to_email} />
          <input type="hidden" name="from" value={fields.from} />
          <input type="hidden" name="cd" value={fields.cd} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Full Name *</label>
              <input name="name" type="text" required value={fields.name} onChange={handleChange}
                placeholder="Your name…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: 'var(--text-faint)' }}>Email Address *</label>
              <input name="email" type="email" required value={fields.email} onChange={handleChange}
                placeholder="you@example.com…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>
              Mobile
              <span className="ml-1.5 font-normal normal-case" style={{ color: 'var(--text-faint)' }}>(optional)</span>
            </label>
            <input name="mobile" type="tel" value={fields.mobile} onChange={handleChange}
              placeholder="+1 234 567 890…" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Subject *</label>
            <textarea name="subject" required rows={2} value={fields.subject} onChange={handleChange}
              placeholder="Write your subject here…"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', color: 'var(--text-main)' }}
              onFocus={onFocus as any} onBlur={onBlur as any} />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--text-faint)' }}>Message *</label>
            <textarea name="message" required rows={5} value={fields.message} onChange={handleChange}
              placeholder="Write your message here…"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', color: 'var(--text-main)' }}
              onFocus={onFocus as any} onBlur={onBlur as any} />
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: 14 }}>error_outline</span>{error}
            </p>
          )}

          <button type="submit" disabled={sending}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 18px -4px rgba(46,91,255,0.5)' }}>
            {sending
              ? <><span className="material-icons" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>sync</span> Sending…</>
              : <><span className="material-icons" style={{ fontSize: 14 }}>send</span> Send Message</>}
          </button>
        </form>
      )}
    </section>
  );
}
