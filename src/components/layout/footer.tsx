import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <Logo className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Context-aware asteroid and space-asset risk intelligence. 
              Built for clarity, precision, and space safety.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/asteroids" className="hover:text-primary transition-colors">Asteroids</Link></li>
                <li><Link href="/assets" className="hover:text-primary transition-colors">Space Assets</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Data Sources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>NASA NeoWs</li>
                <li>JPL Horizons</li>
                <li>CelesTrak</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Disclaimer</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 ARMOR. All rights reserved.</p>
          <p>Mock Data Version - Hackathon Build</p>
        </div>
      </div>
    </footer>
  );
}
