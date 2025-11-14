'use client';

import { motion } from 'motion/react';

const stats = [
  { value: '2M+', label: 'Images Generated' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '3.2s', label: 'Avg. Generation' },
  { value: '99.9%', label: 'Satisfaction Rate' },
];

export function SocialProof() {
  return (
    <section className="py-12 border-y bg-slate-50/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={`${stat.label}-${stat.value}`}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl md:text-5xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
