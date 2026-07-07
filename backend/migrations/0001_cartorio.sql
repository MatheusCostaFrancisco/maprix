CREATE TYPE "public"."matricula_status" AS ENUM('ativa', 'em_analise', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."protocolo_status" AS ENUM('recebido', 'em_analise', 'exigencia', 'aprovado', 'rejeitado');--> statement-breakpoint
CREATE TYPE "public"."protocolo_tipo" AS ENUM('georreferenciamento', 'retificacao', 'desmembramento', 'unificacao');--> statement-breakpoint
CREATE TABLE "matriculas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"cartorio" text,
	"proprietario" text NOT NULL,
	"municipio" text,
	"uf" text,
	"area_m2" double precision,
	"status" "matricula_status" DEFAULT 'ativa' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocolos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"requerente" text NOT NULL,
	"tipo" "protocolo_tipo" NOT NULL,
	"status" "protocolo_status" DEFAULT 'recebido' NOT NULL,
	"matricula_id" uuid,
	"observacao" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_matricula_id_matriculas_id_fk" FOREIGN KEY ("matricula_id") REFERENCES "public"."matriculas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocolos" ADD CONSTRAINT "protocolos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matriculas_numero_idx" ON "matriculas" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "matriculas_status_idx" ON "matriculas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "protocolos_numero_idx" ON "protocolos" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "protocolos_status_idx" ON "protocolos" USING btree ("status");