import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PrivateAccountBanner({ message }: { message: string }) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="font-medium text-amber-100">Cuenta privada sin acceso</p>
          <p className="mt-1 text-sm text-amber-200/80">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
