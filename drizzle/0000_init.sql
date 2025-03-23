CREATE TABLE "keys" (
	"key" varchar PRIMARY KEY NOT NULL,
	"balance" integer NOT NULL,
	"used_at" timestamp with time zone,
	"using" boolean DEFAULT false NOT NULL
);
