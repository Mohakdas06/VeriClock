
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';

export default function ProfilePage() {
    const { toast } = useToast();
    const { user } = useAuth();

    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const [detailsLoading, setDetailsLoading] = React.useState(false);
    const [passwordLoading, setPasswordLoading] = React.useState(false);

    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    React.useEffect(() => {
        if(user) {
            setName(user.displayName || 'Admin');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setDetailsLoading(true);

        try {
            // Update display name if it has changed
            if (name !== user.displayName) {
                await updateProfile(user, { displayName: name });
            }

            // Update email if it has changed
            if (email !== user.email) {
                await updateEmail(user, email);
            }

            toast({
                title: 'Profile Updated',
                description: 'Your details have been successfully updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Update Failed',
                description: error.message || 'Could not update profile. You might need to log in again.',
                variant: 'destructive',
            });
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (password !== confirmPassword) {
            toast({
                title: 'Password Mismatch',
                description: 'The new password and confirmation do not match.',
                variant: 'destructive',
            });
            return;
        }
        if (password.length < 6) {
             toast({
                title: 'Password Too Short',
                description: 'Password must be at least 6 characters long.',
                variant: 'destructive',
            });
            return;
        }
        
        setPasswordLoading(true);

        try {
            await updatePassword(user, password);
            toast({
                title: 'Password Updated',
                description: 'Your password has been changed successfully.',
            });
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
             toast({
                title: 'Password Update Failed',
                description: error.message || 'Could not update password. You may need to log in again.',
                variant: 'destructive',
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Admin Profile"
                description="Manage your account details and password."
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <UserCog /> Personal Information
                        </CardTitle>
                        <CardDescription>Update your name and email address.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateDetails} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={detailsLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={detailsLoading} />
                            </div>
                            <Button type="submit" disabled={detailsLoading}>
                                {detailsLoading && <Loader2 className="animate-spin" />}
                                Update Details
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Change Password</CardTitle>
                        <CardDescription>Set a new password for your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input 
                                    id="new-password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="pr-10"
                                    disabled={passwordLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    disabled={passwordLoading}
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input 
                                    id="confirm-password" 
                                    type={showConfirmPassword ? 'text' : 'password'} 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="pr-10"
                                    disabled={passwordLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    disabled={passwordLoading}
                                >
                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </Button>
                            </div>
                            <Button type="submit" disabled={passwordLoading}>
                                {passwordLoading && <Loader2 className="animate-spin" />}
                                Change Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
