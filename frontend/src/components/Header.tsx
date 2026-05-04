interface HeaderProps {
  title: string;
  subtitle?: string;
}

import Logo from "../assets/logo.jpeg";

export default function Header({ title, subtitle = "" }: HeaderProps) {
  return (
    <header data-cmp="Header" className="border-b border-border bg-card/50 px-6 py-4 flex items-center gap-4">
      <img 
        src={Logo} 
        alt="Wolan Logistics Logo"
        className="h-10 w-auto sm:h-9 rounded-sm shadow-sm hover:scale-[1.05] wolan-glow transition-all duration-200 object-contain flex-shrink-0" 
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{subtitle}</p> : null}
      </div>
    </header>
  );
}
