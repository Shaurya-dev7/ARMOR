import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Bell, Shield, LogOut } from 'lucide-react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';

export default function ProfilePage() {
  return (
    <>
    <AnimatedShaderBackground />
    <div className="section-container pt-24 pb-20 space-y-12 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Operator Profile</h1>
           <p className="text-muted-foreground">Manage your clearance level and notification preferences.</p>
        </div>
        <Button variant="destructive" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6">
        {/* User Info */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col md:flex-row gap-4">
               <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                 OP
               </div>
               <div className="space-y-1">
                 <h3 className="text-xl font-bold">Operator #8821</h3>
                 <p className="text-muted-foreground">Level 3 Clearance • Satellite Operations Division</p>
                 <div className="flex gap-2 mt-2">
                   <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">Active</span>
                   <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-white/10">MFA Enabled</span>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Bell className="w-5 h-5 text-primary" />
               Alert Preferences
             </CardTitle>
             <CardDescription>Configure which events trigger immediate notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded bg-background/50 border border-white/5">
               <div>
                 <span className="font-semibold block">Conjunction Events</span>
                 <p className="text-xs text-muted-foreground">Alert when objects pass within 500km of tracked assets.</p>
               </div>
               <div className="h-6 w-10 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-background rounded-full transition-all" />
               </div>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded bg-background/50 border border-white/5">
                <div>
                 <span className="font-semibold block">Impact Probability &gt; 1%</span>
                 <p className="text-xs text-muted-foreground">Critical alerts for high-risk Earth approaches.</p>
               </div>
               <div className="h-6 w-10 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-background rounded-full transition-all" />
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Security / Role */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Shield className="w-5 h-5 text-primary" />
                 Clearance Management
              </CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
               Current Role: <strong>Satellite Operator</strong>. Access limited to LEO/MEO/GEO surveillance data.
               To request Researcher access (Raw Telemetry), contact administration.
             </p>
             <Button variant="outline" size="sm">Request Upgrade</Button>
           </CardContent>
        </Card>

      </div>
    </div>
    </>
  );
}
