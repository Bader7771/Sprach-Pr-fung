import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button className="iconBtn" onClick={onToggle} title="Toggle theme" aria-label="Toggle theme">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
