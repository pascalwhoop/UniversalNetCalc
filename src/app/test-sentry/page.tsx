"use client";

import { captureException } from "@/lib/sentry-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSentry() {
  const triggerError = () => {
    try {
      throw new Error("Test error from Sentry test page");
    } catch (error) {
      captureException(error);
      alert("Error sent to Sentry! Check your Sentry dashboard.");
    }
  };

  const triggerUncaughtError = () => {
    throw new Error("Uncaught test error");
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Sentry Error Tracking Test</CardTitle>
          <CardDescription>
            Test that Sentry is capturing errors correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={triggerError} variant="default">
              Trigger Caught Error
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Sends a caught error to Sentry using captureException()
            </p>
          </div>

          <div>
            <Button onClick={triggerUncaughtError} variant="destructive">
              Trigger Uncaught Error
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Throws an uncaught error (will show error boundary)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
