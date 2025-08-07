
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentLoginPage() {
    const router = useRouter();
    const { user, loading, studentLogin } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [rfidUid, setRfidUid] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    React.useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await studentLogin(email, rfidUid);
            router.push('/dashboard');
        } catch (error: any) {
            toast({
                title: 'Login Failed',
                description: error.message || 'Please check your credentials and try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading || user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            <div className="w-full max-w-md animate-slide-up">
                 <div className="text-center mb-8">
                    <User className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="mt-6 text-3xl font-extrabold text-foreground font-headline">
                        Student Sign In
                    </h1>
                     <Link href="/" className="text-sm text-primary hover:underline">
                        Not a student? Go back
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome Student</CardTitle>
                        <CardDescription>Use your registered email and RFID UID to log in.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="rfidUid">RFID Card UID</Label>
                                <Input
                                    id="rfidUid"
                                    name="rfidUid"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={rfidUid}
                                    onChange={(e) => setRfidUid(e.target.value)}
                                    disabled={isSubmitting}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>

                            <div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
