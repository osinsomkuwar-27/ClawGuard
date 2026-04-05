import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Menu, X, Home, Briefcase, Mail, Sun, Moon, ChevronLeft } from 'lucide-react';

export default function AnimatedMenuComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0], [0, 1]);

  const menuItems = [
    { icon: Home, label: 'Overview', href: '/overview' },
    { icon: Briefcase, label: 'Portfolio', href: '/portfolio' },
    { icon: Sun, label: 'Place trade', href: '/place-trade' },
    { icon: Mail, label: 'Decision feed', href: '/decision-feed' },
    { icon: Moon, label: 'Audit log', href: '/audit-log' },
    { icon: X, label: 'Policies', href: '/policies' },
  ];

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -100) {
      setIsOpen(false);
    }
    dragX.set(0);
  };

  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.8,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.8,
      },
    },
  };

  const itemVariants = {
    closed: { x: -50, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.1 + i * 0.08,
        type: 'spring' as const,
        stiffness: 250,
        damping: 25,
      },
    }),
  };

  const overlayVariants = {
    closed: { 
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
    open: { 
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="w-full min-h-screen bg-[#ECF4E8] text-slate-900">
      {/* Orthogonal Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(39, 93, 76, 0.12)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-6 p-3 rounded-3xl bg-white/90 text-slate-900 shadow-xl shadow-slate-200 transition hover:bg-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-slate-900">ClawGuard</h1>
          <p className="text-sm text-slate-600">Paper trading · AI enforced</p>
        </motion.div>
      </header>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
          />
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <motion.nav
        variants={menuVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        drag="x"
        dragConstraints={{ left: -320, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className="fixed top-0 left-0 h-full w-80 z-40 overflow-y-auto shadow-2xl bg-white/95 border-r border-[#93BFC7]/20 backdrop-blur-xl"
      >
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200"
        >
          <X size={24} />
        </motion.button>

        {/* Drag Indicator */}
        <motion.div
          style={{ opacity: dragOpacity }}
          className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none"
        >
          <ChevronLeft 
            size={32} 
            className="text-gray-400"
          />
        </motion.div>

        <div className="p-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900">Navigation</h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              className="h-1 mt-2 rounded bg-[#93BFC7]"
            />
          </motion.div>

          <ul className="space-y-4">
            {menuItems.map((item, i) => (
              <motion.li
                key={item.label}
                custom={i}
                variants={itemVariants}
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
              >
                <Link
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-4 rounded-3xl border border-slate-200 bg-[#ECF4E8]/90 px-4 py-4 text-slate-900 shadow-sm shadow-slate-900/5 transition hover:border-[#93BFC7] hover:bg-[#CBF3BB]"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-[#93BFC7]/20 text-slate-900 transition"
                  >
                    <item.icon size={22} />
                  </motion.div>
                  <span className="text-lg font-semibold">{item.label}</span>
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute bottom-8 left-8 right-8 rounded-3xl bg-[#CBF3BB]/90 p-4 shadow-inner shadow-slate-900/5"
          >
            <p className="text-sm text-slate-800">💡 Tap outside or drag left to close</p>
          </motion.div> */}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12 w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full text-slate-900"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}