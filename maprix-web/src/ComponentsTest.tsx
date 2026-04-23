import {
  AlertCircle,
  ArrowRight,
  Building2,
  ChevronRight,
  FileText,
  Inbox,
  Lock,
  Plus,
  Ruler,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ThemeToggle } from '@/components/shared/theme-toggle';

/**
 * Prévia de validação da Milestone 2. Acesse com `?m2=components-test`.
 * Mostra todos os componentes shadcn + shared em uso, em light e dark.
 * Some na Milestone 3.
 */
export function ComponentsTest() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-12">
          <PageHeader
            title="Kit de componentes"
            description="Todos os componentes shadcn + shared usados no Maprix. Valide light e dark."
            actions={
              <>
                <Button variant="outline" size="sm">
                  <Settings />
                  Configurar
                </Button>
                <ThemeToggle />
              </>
            }
          />

          <Section title="Shared — PageHeader (variante cartório)">
            <div className="rounded-lg border border-border p-6">
              <PageHeader
                variant="cartorio"
                title="Portal do Cartório"
                description="Visualização e análise de polígonos enviados por profissionais técnicos."
                actions={<Button variant="outline">Exportar relatório</Button>}
              />
              <p className="text-sm text-muted-foreground">
                Tipografia maior (3xl), espaçamento generoso (pb-8 mb-8).
              </p>
            </div>
          </Section>

          <Section title="Shared — StatCard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Imóveis cadastrados" value="1.284" icon={Building2} change={{ value: 12.4, label: 'vs mês anterior' }} />
              <StatCard label="Área total" value="48,2 km²" icon={Ruler} change={{ value: 3.1, label: 'vs mês anterior' }} />
              <StatCard label="Aprovações pendentes" value={27} icon={FileText} change={{ value: -8.3, label: 'vs semana' }} />
              <StatCard label="Profissionais ativos" value={89} icon={User} />
            </div>
          </Section>

          <Section title="Shared — EmptyState">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <EmptyState
                  icon={Inbox}
                  title="Nenhum polígono recebido"
                  description="Quando um profissional enviar um lote pelo SIG-RI, aparecerá aqui."
                  action={{ label: 'Adicionar manual', onClick: () => toast.info('Fluxo em desenvolvimento') }}
                />
              </Card>
              <Card>
                <EmptyState
                  icon={Lock}
                  title="Acesso restrito"
                  description="Esta área é exclusiva para responsáveis técnicos do projeto."
                />
              </Card>
            </div>
          </Section>

          <Section title="Button — variantes e tamanhos">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">
                <Trash2 />
                Destructive
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Button size="sm">
                <Plus />
                Small
              </Button>
              <Button>
                <Plus />
                Default
              </Button>
              <Button size="lg">
                <Plus />
                Large
              </Button>
              <Button size="icon" aria-label="Adicionar">
                <Plus />
              </Button>
              <Button disabled>
                <Plus />
                Disabled
              </Button>
            </div>
          </Section>

          <Section title="Inputs, Label, Textarea, Select">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input id="matricula" placeholder="Ex: 12.345" />
                <p className="text-xs text-muted-foreground">Número completo da matrícula.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistema">Sistema de coordenadas</Label>
                <Select>
                  <SelectTrigger id="sistema">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utm22s">UTM 22S (SIRGAS2000)</SelectItem>
                    <SelectItem value="utm23s">UTM 23S (SIRGAS2000)</SelectItem>
                    <SelectItem value="latlong">Lat/Long (SIRGAS2000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pontos">Pontos (id, x, y)</Label>
                <Textarea id="pontos" rows={4} placeholder={'P1, 500000, 7500000\nP2, 500100, 7500000'} />
              </div>
            </div>
          </Section>

          <Section title="Checkbox & Switch">
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="declara" />
                <Label htmlFor="declara">Declaro que os dados são verídicos</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="assinado" defaultChecked />
                <Label htmlFor="assinado">Assinar digitalmente</Label>
              </div>
            </div>
          </Section>

          <Section title="Badge">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Reprovado</Badge>
            </div>
          </Section>

          <Section title="Alert">
            <div className="space-y-3">
              <Alert>
                <AlertCircle />
                <AlertTitle>Informação</AlertTitle>
                <AlertDescription>Todas as operações passam pelo geo-core compartilhado.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Falha ao carregar</AlertTitle>
                <AlertDescription>
                  Não foi possível buscar os dados.{' '}
                  <Button variant="link" className="h-auto p-0 text-xs">
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section title="Skeleton (loading)">
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          </Section>

          <Section title="Tabs">
            <Tabs defaultValue="coords" className="w-full">
              <TabsList>
                <TabsTrigger value="coords">Coordenadas</TabsTrigger>
                <TabsTrigger value="segmentos">Segmentos</TabsTrigger>
                <TabsTrigger value="conferencia">Conferência</TabsTrigger>
              </TabsList>
              <TabsContent value="coords" className="mt-4 text-sm text-muted-foreground">
                Aba de coordenadas do polígono convertido.
              </TabsContent>
              <TabsContent value="segmentos" className="mt-4 text-sm text-muted-foreground">
                Tabela de azimutes e distâncias.
              </TabsContent>
              <TabsContent value="conferencia" className="mt-4 text-sm text-muted-foreground">
                Resultado da conferência bilateral por ponto.
              </TabsContent>
            </Tabs>
          </Section>

          <Section title="Table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ponto</TableHead>
                  <TableHead>X</TableHead>
                  <TableHead>Y</TableHead>
                  <TableHead className="text-right">Δ (m)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'P1', x: -51.0, y: -22.606856 },
                  { id: 'P2', x: -50.999027, y: -22.606856 },
                  { id: 'P3', x: -50.999027, y: -22.605953 },
                  { id: 'P4', x: -51.0, y: -22.605953 },
                ].map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell className="font-mono text-xs">{p.x.toFixed(6)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.y.toFixed(6)}</TableCell>
                    <TableCell className="text-right text-success">0,0000</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          <Section title="Dialog, AlertDialog, Sheet, DropdownMenu, Tooltip, Toast">
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Abrir Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar envio</DialogTitle>
                    <DialogDescription>
                      O polígono será enviado para o SIG-RI após a confirmação.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancelar</Button>
                    <Button>
                      Enviar
                      <ArrowRight />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir polígono?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O registro será removido.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Abrir Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Navegação</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-1">
                    <a className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">Conversor</a>
                    <a className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">Memorial</a>
                    <a className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">Shapefile</a>
                  </nav>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Info">
                    <AlertCircle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Informação contextual</p>
                </TooltipContent>
              </Tooltip>

              <Button onClick={() => toast.success('Memorial baixado')}>Toast sucesso</Button>
              <Button variant="destructive" onClick={() => toast.error('Falha no upload', { description: 'Verifique a conexão' })}>
                Toast erro
              </Button>
            </div>
          </Section>

          <Section title="Avatar, Separator, Chevron">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/ghost.png" alt="Ghost" />
                <AvatarFallback>MC</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>TB</AvatarFallback>
              </Avatar>
              <Separator orientation="vertical" className="h-8" />
              <span className="inline-flex items-center gap-1 text-sm">
                Engenharia <ChevronRight className="h-4 w-4 text-muted-foreground" /> Conversor
              </span>
            </div>
          </Section>

          <Section title="Card composto">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Matrícula 12.345</CardTitle>
                <CardDescription>Imóvel rural em Campinas/SP</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Área de 48,2 hectares, georreferenciada em UTM 22S SIRGAS2000.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm">
                  Detalhes
                </Button>
                <Button size="sm">
                  Abrir no mapa
                  <ArrowRight />
                </Button>
              </CardFooter>
            </Card>
          </Section>

          <footer className="pt-6 border-t border-border text-xs text-muted-foreground">
            Prévia Milestone 2. Temporário — some quando a M3 refatorar o app.
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
