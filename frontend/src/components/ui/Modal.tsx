import { useEffect } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-md p-6 animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 hover:bg-navy-700 text-xl leading-none transition-colors p-2 -mr-2 rounded-lg">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
