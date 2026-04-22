# Arquitetura — Maprix MVP

## Visão geral

O Maprix tem um motor geodésico central (`shared/geo-core`) que é consumido tanto pelo frontend quanto pelo backend. Qualquer transformação, cálculo de área/perímetro/azimute ou validação cruzada de sistemas de coordenadas acontece nesse módulo. Os tipos que circulam entre web e backend vivem em `shared/types`.

## Fluxo de dados

```
                        ┌─────────────────────────┐
                        │  Input do engenheiro    │
                        │  (KML / DXF / TXT)      │
                        └───────────┬─────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │  shared/geo-core::parse │
                        └───────────┬─────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │  Polygon (tipo canônico)│
                        │  shared/types::Polygon  │
                        └───────────┬─────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
   ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
   │   Memorial     │      │   Shapefile    │      │  Conferência   │
   │   descritivo   │      │   SIG-RI       │      │  bilateral     │
   │  (DWG/cursivo) │      │  (dbf/prj/shp) │      │  (tolerância)  │
   └────────────────┘      └────────────────┘      └────────────────┘
```

## Princípios

- **Uma fonte de verdade geodésica**: `shared/geo-core`. Web e backend consomem — nunca reimplementam.
- **Contratos explícitos**: todos os DTOs trocados entre camadas estão em `shared/types`. Mudança de contrato exige PR no workspace compartilhado.
- **Três saídas paralelas**: conversor, memorial e shapefile são features independentes que leem o mesmo `Polygon` canônico. Isso viabiliza desenvolvimento paralelo após o Prompt 1.

## Workspaces e responsabilidades

| Workspace        | Responsabilidade                                         |
| ---------------- | -------------------------------------------------------- |
| `maprix-web`     | Telas, upload de arquivo, visualização, chamadas à API   |
| `backend`        | Endpoints REST, persistência MySQL, orquestração         |
| `shared/geo-core`| Parsers, conversões (proj4), cálculos geométricos (turf) |
| `shared/types`   | Tipos TS compartilhados (DTOs, enums de sistema)         |
