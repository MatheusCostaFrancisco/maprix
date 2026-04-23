import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { SYSTEM_PRESETS, systemKey } from '@/polygonInput';
import type { InputState } from '@/hooks/use-input-state';

interface Props {
  input: InputState;
  /** Se omitido, a tolerância não aparece (ex: memorial não precisa). */
  showTolerance?: boolean;
}

export function PointsInputCard({ input, showTolerance = false }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrada de pontos</CardTitle>
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
          <p className="text-xs text-muted-foreground">
            {input.points.length} ponto(s) válido(s)
            {input.parseErrors.length > 0 ? ` · ${input.parseErrors.length} erro(s) de parsing` : ''}
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
