import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

function ScrollMaskReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ overflow: 'hidden', display: 'block' }}>
      <motion.div
        initial={{ y: '105%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', stiffness: 52, damping: 16, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Név megadása kötelező').max(100),
  email: z.string().trim().email('Érvényes email címet adj meg').max(255),
  message: z.string().trim().min(1, 'Üzenet megadása kötelező').max(2000),
});

const ContactSection = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    try {
      // TODO: Connect to Supabase edge function for email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({ title: 'Üzenet elküldve!', description: 'Hamarosan válaszolok.' });
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast({ title: 'Hiba történt', description: 'Kérjük próbáld újra.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="section-light py-32 relative z-20">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <ScrollMaskReveal delay={0}>
              <p className="section-muted text-sm tracking-[0.3em] uppercase mb-4">Kapcsolat</p>
            </ScrollMaskReveal>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <ScrollMaskReveal delay={0.12}>
                <span className="block">Dolgozzunk</span>
              </ScrollMaskReveal>
              <ScrollMaskReveal delay={0.24}>
                <span className="block">együtt.</span>
              </ScrollMaskReveal>
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="section-muted text-lg font-light leading-relaxed max-w-md"
            >
              Kérdésed van, vagy szeretnél egyedi fogpótlást rendelni? Írj nekem, és hamarosan válaszolok.
            </motion.p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <input
                type="text"
                placeholder="Neved"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full section-card rounded-xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:opacity-40"
                style={{ backgroundColor: 'hsl(var(--section-light-card))' }}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email címed"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full section-card rounded-xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:opacity-40"
                style={{ backgroundColor: 'hsl(var(--section-light-card))' }}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <textarea
                placeholder="Üzeneted"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full section-card rounded-xl px-5 py-4 text-sm outline-none resize-none focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:opacity-40"
                style={{ backgroundColor: 'hsl(var(--section-light-card))' }}
              />
              {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={sending}
              className="px-10 py-4 bg-black text-white rounded-full text-sm font-medium tracking-wide hover:bg-black/85 transition-all duration-300 disabled:opacity-50"
            >
              {sending ? 'Küldés...' : 'Üzenet küldése'}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
