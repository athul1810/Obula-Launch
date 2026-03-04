import { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import LandingNav from '../components/LandingNav.jsx';
import apiClient from '../api/client.js';

export default function Contact() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await apiClient.post('/api/contact', formState);
      setSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
    } catch (err) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Something went wrong. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-body">
      <LandingNav />
      <section className="flex-1 pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em] mb-2">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-display tracking-tight">
              Get in touch
            </h1>
            <p className="text-white/60 text-lg mb-12">
              Questions, feedback, or partnership ideas? We’d love to hear from you.
            </p>

            {submitted ? (
              <m.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-8 border border-primary/30 bg-primary/5 text-center"
              >
                <p className="text-primary font-semibold text-lg mb-2">Thanks for reaching out!</p>
                <p className="text-white/70 text-base mb-6">We’ll get back to you as soon as we can.</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-primary font-medium text-base hover:underline"
                >
                  Send another message
                </button>
              </m.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-primary/50 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}

            <p className="mt-12 text-white/40 text-sm text-center">
              Or email us directly at{' '}
              <a href="mailto:obula.zypit@gmail.com" className="text-primary hover:underline">
                obula.zypit@gmail.com
              </a>
            </p>

            <div className="mt-10 text-center">
              <Link to="/" className="text-white/60 hover:text-white text-base font-medium transition-colors">
                ← Back to home
              </Link>
            </div>
          </m.div>
        </div>
      </section>
    </div>
  );
}
