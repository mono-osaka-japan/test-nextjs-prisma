import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Project</CardTitle>
          <CardDescription>Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            This is a starter project with modern development stack.
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
