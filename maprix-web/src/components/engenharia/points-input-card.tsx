import { AlertCircle, ArrowUpDown, CheckCircle2, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SYSTEM_PRESETS, systemKey } from '@/polygonInput';
import type { InputState } from '@/hooks/use-input-state';

interface Props {
  input: InputState;
  /** Se omitido, a tolerância não aparece (ex: memorial não precisa). */
  showTolerance?: boolean;
}

export function PointsInputCard({ input, showTolerance = false }: Props) {
  const swapSystems = () => {
    const prevSource = input.sourceIdx;
    input.setSourceIdx(input.targetIdx);
    input.setTargetIdx(prevSource);
  };
  const ready = input.points.length >= 3;
  const hasErrors = input.parseErrors.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Entrada de pontos</CardTitle>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={swapSystems}>
            <ArrowUpDown />
            Inverter
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={input.reset}>
            <RotateCcw />
            Exemplo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pontos">Pontos — id, x, y (um por linha)</Label>
          <Textarea
            id="pontos"
            value={input.input}
            onChange={(e) => input.setInput(e.target.value)}
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
          />
          <p
            className={cn(
              'flex items-center gap-1.5 text-xs',
              ready && !hasErrors ? 'text-success' : 'text-muted-foreground',
            )}
          >
            {ready && !hasErrors && <CheckCircle2 className="h-3.5 w-3.5" />}
            {input.points.length} ponto(s) válido(s)
            {hasErrors ? ` · ${input.parseErrors.length} erro(s) de parsing` : ''}
            {!ready && !hasErrors ? ' · mínimo 3 para converter' : ''}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sistema-origem">Sistema de origem</Label>
            <Select
              value={String(input.sourceIdx)}
              onValueChange={(v) => input.setSourceIdx(Number(v))}
            >
              <SelectTrigger id="sistema-origem">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_PRESETS.map((p, i) => (
                  <SelectItem key={systemKey(p.value)} value={String(i)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sistema-destino">Sistema de destino</Label>
            <Select
              value={String(input.targetIdx)}
              onValueChange={(v) => input.setTargetIdx(Number(v))}
            >
              <SelectTrigger id="sistema-destino">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_PRESETS.map((p, i) => (
                  <SelectItem key={systemKey(p.value)} value={String(i)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showTolerance && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tolerancia">Tolerância de conferência (m)</Label>
              <Input
                id="tolerancia"
                type="number"
                min={0}
                step={0.01}
                value={input.tolerancia}
                onChange={(e) => input.setTolerancia(Number(e.target.value))}
                className="max-w-xs"
              />
            </div>
          )}
        </div>

        {input.parseErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-0.5 text-xs">
                {input.parseErrors.slice(0, 5).map((e) => (
                  <li key={e}>{e}</li>
                ))}
                {input.parseErrors.length > 5 && (
                  <li className="text-muted-foreground">
                    …e mais {input.parseErrors.length - 5}
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
