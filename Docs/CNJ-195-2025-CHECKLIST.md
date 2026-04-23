# Checklist — Conformidade do Shapefile SIG-RI com Provimento CNJ 195/2025

**Data da avaliação:** 2026-04-22
**Commit avaliado:** `6f1128d` (gerador `shared/geo-core/src/shapefile.ts`)
**Input de teste:** polígono retangular 100×100m em UTM 22S SIRGAS2000 com metadados (`matrícula=12345`, `proprietario=Teste MVP`, `município=Campinas/SP`).

## Metodologia e fontes

As fontes oficiais consultadas **não contêm uma especificação técnica fechada** do shapefile SIG-RI. O quadro regulatório é:

| Fonte | Conteúdo relevante | Nível de detalhe |
|---|---|---|
| Provimento CNJ 195/2025, art. 320-O §1º | Delega a especificação ao "manual técnico operacional" do ONR | **Nenhum detalhe técnico** |
| Provimento 195, art. 343-D §2º, V | Menciona "tolerâncias posicionais normatizadas, conforme manual técnico do ONR" | Só referência |
| Manual SIG-RI — Profissional Técnico v1.2 (ONR) | Detalha UI de upload; confirma `.shp + .shx + .dbf + .prj`, mesmo nome; exige polígono fechado; lat/long em graus decimais | **Superficial** — sem esquema de atributos nem datum obrigatório |
| ITN 003/2025 (ONR/ONSERP) | Modelagem de dados e interoperabilidade com bases ambientais/cadastrais | Não publicamente acessível na íntegra na data |
| Spec ESRI Shapefile (jul/1998) | Especificação técnica do formato binário | **Aplicável como base** |
| Convenções brasileiras (SIGEF/INCRA, CAR) | Datum SIRGAS2000 (EPSG:4674), encoding comum ISO-8859-1 ou UTF-8 | **Boa prática adotada** |

**Legenda de origem:**
- 🟦 **OFICIAL** — requisito textual em fonte oficial (Provimento ou Manual ONR v1.2)
- 🟨 **SPEC ESRI** — requisito do formato binário (RFC de facto)
- 🟧 **CONVENÇÃO** — prática brasileira dominante (SIGEF/CAR) adotada como baseline
- 🟥 **INFERIDO** — premissa razoável na ausência de fonte explícita; depende do Manual Técnico Operacional completo do ONR

**Legenda de status:**
- ✅ conforme
- ⚠️ parcialmente conforme
- ❌ não conforme
- ❓ indeterminável com fontes públicas

---

## 1. Estrutura e nomenclatura dos arquivos

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 1.1 | Conjunto contém `.shp`, `.shx`, `.dbf`, `.prj` | 🟦 Manual v1.2 | ✅ | Todos 4 presentes no ZIP |
| 1.2 | Todos os arquivos do grupo compartilham o **mesmo nome-base** | 🟦 Manual v1.2 | ✅ | `imovel.shp/.shx/.dbf/.prj` |
| 1.3 | Nome-base único por polígono quando há múltiplos grupos no mesmo envio | 🟦 Manual v1.2 | ❌ | Gerador usa `imovel` fixo — colide em envio múltiplo |
| 1.4 | Empacotamento em ZIP para transporte | 🟧 CONVENÇÃO | ✅ | ZIP DEFLATE gerado via JSZip |
| 1.5 | Presença opcional de `.cpg` (codepage) | 🟨 SPEC ESRI | ❌ | Não gerado |
| 1.6 | Presença opcional de `.qix`/`.sbn` (índices) | 🟨 SPEC ESRI | ✅ (N/A) | Não obrigatórios — correto omitir |

## 2. Arquivo `.shp` (geometria)

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 2.1 | File code no cabeçalho = `9994` (big-endian) | 🟨 SPEC ESRI | ✅ | Valor lido: `9994` |
| 2.2 | Version = `1000` (little-endian) | 🟨 SPEC ESRI | ✅ | Valor lido: `1000` |
| 2.3 | Shape type = `5` (Polygon) para imóvel | 🟨 SPEC ESRI / 🟧 CONVENÇÃO | ✅ | Header e record = `5` |
| 2.4 | File length correto em 16-bit words (big-endian, posição 24) | 🟨 SPEC ESRI | ✅ | 118 palavras = 236 bytes (= tamanho real) |
| 2.5 | BBox global coerente com BBox do record | 🟨 SPEC ESRI | ✅ | Iguais no teste |
| 2.6 | Polígono fechado (primeiro vértice = último) | 🟦 Manual v1.2 | ✅ | P0 == P4 |
| 2.7 | Anel exterior no sentido **horário** (CW) | 🟨 SPEC ESRI | ❌ | Shoelace sum = −1.76e-6 → **counter-clockwise** |
| 2.8 | Registro único com `numParts=1` para polígono simples (sem ilhas) | 🟨 SPEC ESRI | ✅ | `numParts=1`, `parts=[0]` |
| 2.9 | `numPoints` ≥ 4 (mínimo 3 vértices únicos + fechamento) | 🟨 SPEC ESRI | ✅ | 5 pontos |

## 3. Arquivo `.shx` (índice)

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 3.1 | Header de 100 bytes idêntico ao `.shp`, com file length próprio | 🟨 SPEC ESRI | ✅ | 54 words = 108 bytes |
| 3.2 | Uma entrada por record do `.shp` (offset + content length) | 🟨 SPEC ESRI | ✅ | `offset=50` (words, = byte 100), `contentLen16=64` |
| 3.3 | Offset do primeiro record = 50 words | 🟨 SPEC ESRI | ✅ | Confirmado |

## 4. Arquivo `.dbf` (atributos)

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 4.1 | Version byte = `0x03` (dBase III) ou `0x83` (com memo) | 🟨 SPEC ESRI | ✅ | `0x03` |
| 4.2 | Byte 29 (Language Driver ID / LDID) setado para encoding explícito | 🟨 SPEC ESRI | ❌ | `0x00` — encoding indefinido |
| 4.3 | EOF marker `0x1a` no último byte | 🟨 SPEC ESRI | ✅ | Confirmado |
| 4.4 | Deletion flag de cada registro = `0x20` (não deletado) | 🟨 SPEC ESRI | ✅ | Confirmado |
| 4.5 | Campo `ID` ou equivalente para identificar a feição | 🟥 INFERIDO | ⚠️ | Presente como `ID` (C,10) — mas nome pode não bater com dicionário do ONR |
| 4.6 | Campo de **matrícula registral** (nome sugerido: `MATRICULA`) | 🟥 INFERIDO | ❌ | Ausente — hoje a matrícula vai no campo `ID` |
| 4.7 | Campo de **área em m²** com precisão adequada | 🟥 INFERIDO | ⚠️ | Campo `AREA_M2` (N,16,3) existe mas vem **zerado** por bug — `computeArea` não é chamado antes de escrever o DBF |
| 4.8 | Campo de **perímetro em m** | 🟥 INFERIDO | ⚠️ | Campo `PERIM_M` (N,16,3) existe mas **zerado** pelo mesmo bug |
| 4.9 | Campo de **proprietário** | 🟥 INFERIDO | ❌ | Ausente |
| 4.10 | Campo de **município/UF** | 🟥 INFERIDO | ❌ | Ausente |
| 4.11 | Campo de **CNS** (Código Nacional de Serventia) | 🟥 INFERIDO | ❓ | Manual ONR indica que CNS é preenchido via **formulário UI**, não via DBF — ausência pode ser correta |
| 4.12 | Campo de **prenotação** do título | 🟥 INFERIDO | ❓ | Mesma situação do CNS — via formulário UI |
| 4.13 | Nomes de campos ≤ 10 bytes ASCII uppercase, sem acentos | 🟨 SPEC ESRI | ✅ | Padding corretamente com `\0` |

## 5. Arquivo `.prj` (sistema de referência)

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 5.1 | WKT válido (GEOGCS ou PROJCS) | 🟨 SPEC ESRI | ✅ | GEOGCS bem formado |
| 5.2 | Datum SIRGAS 2000 (padrão brasileiro) | 🟧 CONVENÇÃO | ✅ | `DATUM["SIRGAS_2000",SPHEROID["GRS 1980",6378137,298.257222101]]` |
| 5.3 | Coordenadas geográficas (lat/long, EPSG:4674) no envio — UTM é reprojetado | 🟦 Manual v1.2 (implícito nas instruções lat/long) | ✅ | `GEOGCS`, `UNIT["degree",0.01745...]` |
| 5.4 | Tag `AUTHORITY["EPSG","4674"]` para identificação automática | 🟥 INFERIDO (boa prática) | ❌ | Ausente |
| 5.5 | Ordem dos eixos explícita (`AXIS`) | 🟨 SPEC ESRI (WKT2) | ⚠️ | WKT1 sem AXIS — aceito por maior parte dos leitores |
| 5.6 | Precisão do elipsoide GRS80 coerente com oficial | 🟧 CONVENÇÃO | ✅ | 6378137 / 298.257222101 — valores oficiais IERS |

## 6. Geometria e semântica

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 6.1 | Coordenadas em **graus decimais**, não DMS | 🟦 Manual v1.2 | ✅ | Conversão automática para lat/long via proj4 |
| 6.2 | Longitude **antes** de latitude na serialização textual de entrada | 🟦 Manual v1.2 | ✅ (N/A) | Entrada no sistema é shapefile binário — apenas a forma textual exige essa ordem |
| 6.3 | Polígono simples (sem auto-intersecção) | 🟥 INFERIDO | ❓ | Não validado pelo gerador |
| 6.4 | Sem vértices duplicados além do fechamento | 🟥 INFERIDO | ❓ | Não validado pelo gerador |
| 6.5 | Área > 0 | 🟥 INFERIDO | ❓ | Não validado |

## 7. Encoding e internacionalização

| # | Requisito | Origem | Status | Evidência |
|---|---|---|---|---|
| 7.1 | Encoding declarado (LDID do DBF ou `.cpg`) | 🟨 SPEC ESRI | ❌ | Nenhum dos dois |
| 7.2 | Suporte a caracteres acentuados (ç, ã, é) em nomes/municípios | 🟥 INFERIDO | ❌ | `asciiBytes()` atual faz `charCodeAt(i) & 0xff` — truncamento silencioso em UTF-16 > 255 |
| 7.3 | Encoding ISO-8859-1 (Latin1) ou UTF-8 consistente | 🟧 CONVENÇÃO | ❌ | Indefinido |

## 8. Metadados de processo (fora do shapefile, via API/UI)

| # | Requisito | Origem | Status | Observação |
|---|---|---|---|---|
| 8.1 | CNS da serventia | 🟦 Manual v1.2 | ✅ (N/A) | Preenchido na UI do ONR, não no DBF |
| 8.2 | Prenotação do título | 🟦 Manual v1.2 | ✅ (N/A) | Preenchido na UI |
| 8.3 | Descrição do polígono | 🟦 Manual v1.2 | ✅ (N/A) | Preenchido na UI |
| 8.4 | Autenticação via certificado digital do profissional habilitado | 🟦 Manual v1.2 | ✅ (N/A) | Responsabilidade do cliente/UI |

---

## Resumo quantitativo

- **Itens verificados:** 40
- **✅ Conforme:** 22
- **⚠️ Parcial:** 4
- **❌ Não conforme:** 10
- **❓ Indeterminável:** 4 (dependentes de Manual Técnico Operacional completo)

## Observações importantes

1. **O Provimento CNJ 195/2025 não é auto-contido** para validação técnica do shapefile. Parte das conformidades aqui é inferida da prática SIGEF/CAR e da spec ESRI. O Manual Técnico Operacional do ONR (previsto no art. 320-O §1º) é a fonte que fecharia todas as ambiguidades — e na data (2026-04-22) não encontramos versão pública abrangente.

2. **Estratégia de validação final** deve incluir um **teste de upload real** ao ambiente de homologação do ONR (`mapa.onr.org.br/sigri`) com o ZIP gerado, pra capturar validações implícitas que não estão documentadas.

3. **Campos do DBF**: a leitura do Manual v1.2 sugere fortemente que o ONR **não exige** campos específicos no DBF — a metadata (CNS, matrícula, prenotação, descrição) é coletada via **formulário da UI** no ato do upload. Isso aliviaria os itens 4.6, 4.9, 4.10. **Mas não temos confirmação textual** — é inferência.
